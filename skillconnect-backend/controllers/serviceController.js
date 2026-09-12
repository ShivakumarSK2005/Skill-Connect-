const db = require("../config/db");

exports.getServiceTypes = (_req, res) => {
  res.json([]);
};

exports.getCategories = (_req, res) => {
  const sql = `
    SELECT id, name
    FROM categories
    ORDER BY name ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
};

exports.addService = (req, res) => {
  const category_id = req.body.category_id ? Number(req.body.category_id) : null;
  const service_name = String(req.body.service_name || req.body.title || "").trim();
  const description = req.body.description || "";
  const price = Number(req.body.price);
  const provider_id = req.user.id;

  if (!category_id || !service_name || !Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ message: "Please select a category, enter a service type, and enter a valid price" });
  }

  const sql = `
    INSERT INTO services (provider_id, category_id, title, description, price, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `;

  db.query(sql, [provider_id, category_id, service_name, description, price], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({ message: "Service added successfully" });
  });
};

exports.updateService = (req, res) => {
  const category_id = req.body.category_id ? Number(req.body.category_id) : null;
  const service_name = String(req.body.service_name || req.body.title || "").trim();
  const description = req.body.description || "";
  const price = Number(req.body.price);
  const provider_id = req.user.id;
  const service_id = req.params.id;

  if (!category_id || !service_name || !Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ message: "Please select a category, enter a service type, and enter a valid price" });
  }

  const checkSql = "SELECT id FROM services WHERE id = ? AND provider_id = ?";

  db.query(checkSql, [service_id, provider_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updateSql = `
      UPDATE services
      SET category_id = ?, title = ?, description = ?, price = ?
      WHERE id = ?
    `;

    db.query(updateSql, [category_id, service_name, description, price, service_id], (updateErr) => {
      if (updateErr) {
        return res.status(500).json({ error: updateErr.message });
      }

      res.json({ message: "Service updated successfully" });
    });
  });
};

exports.getAllServices = (_req, res) => {
  const sql = `
    SELECT 
      s.id,
      COALESCE(NULLIF(s.title, ''), c.name, 'Service') AS service_name,
      COALESCE(c.name, 'General') AS category,
      s.description,
      s.price,
      COALESCE(s.avg_rating, 0) AS avg_rating,
      COALESCE(s.total_reviews, 0) AS total_reviews,
      u.name AS provider_name,
      u.phone
    FROM services s
    LEFT JOIN categories c ON c.id = s.category_id
    JOIN users u ON s.provider_id = u.id
    ORDER BY s.id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
};

exports.getProviderServices = (req, res) => {
  const provider_id = req.user.id;

  db.query("CALL GetProviderServices(?)", [provider_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // mysql2 returns [ [rows], OkPacket ] for stored procedures
    res.json(results[0] || []);
  });
};

exports.deleteService = (req, res) => {
  const provider_id = req.user.id;
  const service_id = req.params.id;

  const checkSql = "SELECT id FROM services WHERE id = ? AND provider_id = ?";

  db.query(checkSql, [service_id, provider_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const deleteSql = "DELETE FROM services WHERE id = ?";

    db.query(deleteSql, [service_id], (deleteErr) => {
      if (deleteErr) {
        return res.status(500).json({ error: deleteErr.message });
      }

      res.json({ message: "Service deleted successfully" });
    });
  });
};
