const db = require("../config/db");

exports.getDashboardSummary = (_req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM users WHERE role IN ('customer', 'provider')) AS total_users,
      (SELECT COUNT(*) FROM services WHERE is_active = 1) AS total_services,
      (SELECT COUNT(*) FROM bookings WHERE DATE(booking_date) = CURDATE()) AS bookings_today
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results[0] || { total_users: 0, total_services: 0, bookings_today: 0 });
  });
};

exports.getCategories = (_req, res) => {
  db.query(
    "SELECT id, name FROM categories ORDER BY id DESC",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
};

exports.createCategory = (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Category name is required" });
  }

  db.query(
    "INSERT INTO categories (name) VALUES (?)",
    [name.trim()],
    (err, result) => {
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
    }
  );
};

exports.deleteCategory = (req, res) => {
  db.query("DELETE FROM categories WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

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
    if (err) return res.status(500).json({ error: err.message });
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
    if (checkErr) return res.status(500).json({ error: checkErr.message });

    if (results.length === 0) {
      return res.status(404).json({ message: "Customer or provider not found" });
    }

    db.query("DELETE FROM users WHERE id = ?", [userId], (deleteErr) => {
      if (deleteErr) return res.status(500).json({ error: deleteErr.message });
      res.json({ message: "User removed successfully" });
    });
  });
};

exports.getManagedServices = (_req, res) => {
  const sql = `
    SELECT
      s.id,
      COALESCE(NULLIF(s.title, ''), c.name, 'Service') AS service_name,
      COALESCE(c.name, 'General') AS category_name,
      u.name AS provider_name,
      u.phone,
      s.price,
      s.description,
      s.created_at
    FROM services s
    LEFT JOIN categories c ON c.id = s.category_id
    JOIN users u ON s.provider_id = u.id
    WHERE s.is_active = 1
    ORDER BY s.id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.deactivateService = (req, res) => {
  db.query("UPDATE services SET is_active = 0 WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json({ message: "Service removed successfully" });
  });
};

exports.getAdminBookings = (req, res) => {
  const { filter = "all", start_date, end_date } = req.query;
  const conditions = [];
  const params = [];

  if (filter === "today") {
    conditions.push("DATE(booking_date) = CURDATE()");
  } else if (filter === "week") {
    conditions.push("DATE(booking_date) >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)");
    conditions.push("DATE(booking_date) <= DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 6 DAY)");
  } else if (filter === "month") {
    conditions.push("YEAR(booking_date) = YEAR(CURDATE())");
    conditions.push("MONTH(booking_date) = MONTH(CURDATE())");
  } else if (filter === "year") {
    conditions.push("YEAR(booking_date) = YEAR(CURDATE())");
  }

  if (start_date) {
    conditions.push("DATE(booking_date) >= ?");
    params.push(start_date);
  }

  if (end_date) {
    conditions.push("DATE(booking_date) <= ?");
    params.push(end_date);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql = `
    SELECT
      booking_id,
      booking_date,
      status,
      created_at,
      service_name,
      category,
      customer_name,
      customer_phone,
      provider_name,
      provider_phone
    FROM booking_details
    ${whereClause}
    ORDER BY booking_date DESC, booking_id DESC
  `;

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};
