const db = require("../config/db");

exports.getCategories = (_req, res) => {
  const sql = `
    SELECT id, name
    FROM categories
    ORDER BY id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
};

exports.createCategory = (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Category name is required" });
  }

  const sql = "INSERT INTO categories (name) VALUES (?)";

  db.query(sql, [name.trim()], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "Category already exists" });
      }

      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({
      message: "Category created successfully",
      category_id: result.insertId
    });
  });
};

exports.deleteCategory = (req, res) => {
  const categoryId = req.params.id;

  db.query("DELETE FROM categories WHERE id = ?", [categoryId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category removed successfully" });
  });
};

exports.getManagedUsers = (_req, res) => {
  const sql = `
    SELECT id, name, email, phone, role, created_at
    FROM users
    WHERE role IN ('customer', 'provider')
    ORDER BY id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
};

exports.deleteManagedUser = (req, res) => {
  const userId = req.params.id;

  const checkSql = `
    SELECT id
    FROM users
    WHERE id = ? AND role IN ('customer', 'provider')
  `;

  db.query(checkSql, [userId], (checkErr, results) => {
    if (checkErr) {
      return res.status(500).json({ error: checkErr.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Customer or provider not found" });
    }

    db.query("DELETE FROM users WHERE id = ?", [userId], (deleteErr) => {
      if (deleteErr) {
        return res.status(500).json({ error: deleteErr.message });
      }

      res.json({ message: "User removed successfully" });
    });
  });
};
