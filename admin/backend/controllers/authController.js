const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const sql = "SELECT * FROM users WHERE email = ? AND role = 'admin'";

  db.query(sql, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const admin = results[0];
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Admin login successful", token });
  });
};

exports.getProfile = (req, res) => {
  const sql = "SELECT id, name, email, phone, role FROM users WHERE id = ? AND role = 'admin'";

  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json(results[0]);
  });
};

exports.getAdmins = (_req, res) => {
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

exports.createAdmin = async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!/^[A-Za-z ]{2,}$/.test(name.trim())) {
    return res.status(400).json({ message: "Name should contain only letters and spaces" });
  }

  if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email.trim())) {
    return res.status(400).json({ message: "Email must be a valid @gmail.com address" });
  }

  if (!/^\d{10}$/.test(phone.trim())) {
    return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `
      INSERT INTO users (name, email, password, role, phone)
      VALUES (?, ?, ?, 'admin', ?)
    `;

    db.query(sql, [name.trim(), email.trim(), hashedPassword, phone.trim()], (err, result) => {
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
