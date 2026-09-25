const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/**
 * WHAT IT DOES:
 *   Registers a new customer or provider account in the database with a securely hashed password.
 * 
 * WHY WE ADDED IT:
 *   - Onboarding: Allows new customers to book services and professionals to offer skills.
 *   - Security: Hashes plain-text passwords using bcrypt with a salt factor of 10 so plain passwords
 *     are never stored in the database.
 *   - Privilege Protection: Explicitly blocks public registration with the 'admin' role to prevent
 *     unauthorized escalation of privileges.
 * 
 * HOW IT WORKS:
 *   1. Extracts name, email, password, role, and phone from `req.body`.
 *   2. Rejects any attempt to register directly as an admin with HTTP 403.
 *   3. Uses bcrypt.hash(password, 10) to generate a secure salted hash.
 *   4. Inserts the user record into the `users` table.
 *   5. Handles duplicate email errors (ER_DUP_ENTRY) gracefully with HTTP 400.
 *   6. Responds with HTTP 201 Created on success.
 * 
 * @param {Object} req - Express request (body contains name, email, password, role, phone)
 * @param {Object} res - Express response
 */
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (role === "admin") {
      return res.status(403).json({ message: "Admin cannot register" });
    }

    // Validate standard @gmail.com pattern
    const emailRegex = /^[A-Za-z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid Gmail address ending with @gmail.com" });
    }

    // Validate 10-digit phone number starting with 6-9
    const phoneRegex = /^[6-9][0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Phone must be a valid 10-digit number starting with 6, 7, 8, or 9" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `
      INSERT INTO users (name, email, password, role, phone)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [name, email, hashedPassword, role, phone], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          const errMsg = err.message || "";
          if (errMsg.toLowerCase().includes("phone")) {
            return res.status(400).json({ message: "This phone number is already registered" });
          }
          return res.status(400).json({ message: "This email is already registered" });
        }

        return res.status(500).json({ message: err.message || "Database registration error" });
      }

      // Generate JWT immediately so user is automatically logged in upon signup
      const token = jwt.sign(
        { id: result.insertId, role: role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: { id: result.insertId, name, email, role, phone }
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error occurred" });
  }
};

/**
 * WHAT IT DOES:
 *   Authenticates an existing user (customer, provider, or admin) using email and password,
 *   returning a signed JSON Web Token (JWT).
 * 
 * WHY WE ADDED IT:
 *   - Core Authentication: Validates credentials and issues a stateless JWT that the client
 *     stores and includes in subsequent API requests.
 *   - Stateless authorization: The server doesn't need to track active sessions in memory,
 *     making the application fast and scalable.
 * 
 * HOW IT WORKS:
 *   1. Queries `users` table for a record matching the provided email.
 *   2. If user is not found, responds with 404.
 *   3. Uses `bcrypt.compare(password, user.password)` to securely verify the entered password
 *      against the stored bcrypt hash.
 *   4. If matched, creates a signed JWT containing `{ id: user.id, role: user.role }` valid for 1 day.
 *   5. Returns the token and success message to the frontend.
 * 
 * @param {Object} req - Express request (body contains email, password)
 * @param {Object} res - Express response
 */
exports.login = (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Login successful", token });
  });
};

/**
 * WHAT IT DOES:
 *   Retrieves the public profile details of the currently authenticated user.
 * 
 * WHY WE ADDED IT:
 *   - Populates user information across frontend views (e.g. Profile page, Navbar greeting, user dashboards).
 *   - Privacy: Explicitly projects only safe fields (id, name, email, phone, role) and omits the password hash.
 * 
 * HOW IT WORKS:
 *   1. Reads `req.user.id` from the verified JWT token (injected by `verifyToken`).
 *   2. Executes a SELECT query filtering by `id = ?`.
 *   3. Returns user profile details or 404 if not found.
 * 
 * @param {Object} req - Express request (with req.user.id from authMiddleware)
 * @param {Object} res - Express response
 */
exports.getProfile = (req, res) => {
  const user_id = req.user.id;
  const sql = "SELECT id, name, email, phone, role FROM users WHERE id = ?";

  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: "User not found" });
    res.json(results[0]);
  });
};

/**
 * WHAT IT DOES:
 *   Updates the editable contact information (name and phone number) for the logged-in user.
 * 
 * WHY WE ADDED IT:
 *   - Allows customers and providers to keep their contact details up-to-date for service coordination.
 *   - Enforces user boundary: only updates the profile of the caller (`req.user.id`), preventing users
 *     from modifying another person's information.
 * 
 * HOW IT WORKS:
 *   1. Reads `req.user.id` from the verified JWT token.
 *   2. Extracts `name` and `phone` from `req.body`.
 *   3. Executes an UPDATE query on `users` where `id = ?`.
 *   4. Returns a success message.
 * 
 * @param {Object} req - Express request (body contains name, phone; req.user contains id)
 * @param {Object} res - Express response
 */
exports.updateProfile = (req, res) => {
  const user_id = req.user.id;
  const { name, phone } = req.body;
  const sql = "UPDATE users SET name = ?, phone = ? WHERE id = ?";

  db.query(sql, [name, phone, user_id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Profile updated successfully" });
  });
};

/**
 * WHAT IT DOES:
 *   Enables an existing administrator to create new administrator accounts.
 * 
 * WHY WE ADDED IT:
 *   - Enterprise Administration: Allows master admins to delegate administrative privileges safely.
 *   - Security: Protected by `authorizeRoles('admin')` so normal users can never invoke this endpoint.
 * 
 * HOW IT WORKS:
 *   1. Validates that all required fields (name, email, password, phone) are provided.
 *   2. Hashes the admin password using bcrypt.
 *   3. Inserts the record into `users` explicitly assigning `role = 'admin'`.
 *   4. Returns HTTP 201 with the newly created admin's ID.
 * 
 * @param {Object} req - Express request (body contains name, email, password, phone)
 * @param {Object} res - Express response
 */
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `
      INSERT INTO users (name, email, password, role, phone)
      VALUES (?, ?, ?, 'admin', ?)
    `;

    db.query(sql, [name, email, hashedPassword, phone], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ message: "Email already exists" });
        }

        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        message: "Admin created successfully",
        admin_id: result.insertId
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * WHAT IT DOES:
 *   Fetches the list of all administrators registered on the platform.
 * 
 * WHY WE ADDED IT:
 *   - Powers the "Manage Admins" panel in the admin dashboard so managers can review platform staff.
 * 
 * HOW IT WORKS:
 *   1. Executes a SELECT query filtering `role = 'admin'`.
 *   2. Returns safe admin records sorted newest first.
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.getAdmins = (req, res) => {
  const sql = `
    SELECT id, name, email, phone, role
    FROM users
    WHERE role = 'admin'
    ORDER BY id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
};
