const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (role === "admin") {
      return res.status(403).json({ message: "Admin cannot register" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `
      INSERT INTO users (name, email, password, role, phone)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [name, email, hashedPassword, role, phone], (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ message: "Email already exists" });
        }

        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({ message: "User registered successfully" });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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

exports.getProfile = (req, res) => {
  const user_id = req.user.id;
  const sql = "SELECT id, name, email, phone, role FROM users WHERE id = ?";

  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: "User not found" });
    res.json(results[0]);
  });
};

exports.updateProfile = (req, res) => {
  const user_id = req.user.id;
  const { name, phone } = req.body;
  const sql = "UPDATE users SET name = ?, phone = ? WHERE id = ?";

  db.query(sql, [name, phone, user_id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Profile updated successfully" });
  });
};

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
