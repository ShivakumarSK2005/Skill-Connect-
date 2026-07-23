const db = require("../config/db");

const ensureServiceType = (categoryId, serviceName, callback) => {
  const trimmedName = String(serviceName || "").trim();

  if (!categoryId || !trimmedName) {
    callback(null, null);
    return;
  }

  const findSql = `
    SELECT id
    FROM service_types
    WHERE category_id = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?))
    LIMIT 1
  `;

  db.query(findSql, [categoryId, trimmedName], (findErr, results) => {
    if (findErr) {
      callback(findErr);
      return;
    }

    if (results.length > 0) {
      callback(null, results[0].id);
      return;
    }

    const insertSql = `
      INSERT INTO service_types (category_id, name)
      VALUES (?, ?)
    `;

    db.query(insertSql, [categoryId, trimmedName], (insertErr, insertResult) => {
      if (insertErr) {
        callback(insertErr);
        return;
      }

      callback(null, insertResult.insertId);
    });
  });
};

exports.getServiceTypes = (req, res) => {
  const sql = `
    SELECT st.id, st.name, c.name AS category
    FROM service_types st
    JOIN categories c ON st.category_id = c.id
    ORDER BY c.name ASC, st.name ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
};

exports.getCategories = (req, res) => {
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
  const service_name = String(req.body.service_name || "").trim();
  const description = req.body.description || "";
  const price = Number(req.body.price);
  const provider_id = req.user.id;

  if (!category_id || !service_name || !Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ message: "Please select a category, enter a service type, and enter a valid price" });
  }

  ensureServiceType(category_id, service_name, (typeErr, serviceTypeId) => {
    if (typeErr) {
      return res.status(500).json({ error: typeErr.message });
    }

    const sql = `
      INSERT INTO services (provider_id, category_id, service_type_id, description, price)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [provider_id, category_id, serviceTypeId, description, price], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({ message: "Service added successfully" });
    });
  });
};

exports.updateService = (req, res) => {
  const category_id = req.body.category_id ? Number(req.body.category_id) : null;
  const service_name = String(req.body.service_name || "").trim();
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

    ensureServiceType(category_id, service_name, (typeErr, serviceTypeId) => {
      if (typeErr) {
        return res.status(500).json({ error: typeErr.message });
      }

      const updateSql = `
        UPDATE services
        SET category_id = ?, service_type_id = ?, description = ?, price = ?
        WHERE id = ?
      `;

      db.query(updateSql, [category_id, serviceTypeId, description, price, service_id], (updateErr) => {
        if (updateErr) {
          return res.status(500).json({ error: updateErr.message });
        }

        res.json({ message: "Service updated successfully" });
      });
    });
  });
};

exports.getAllServices = (req, res) => {
  const sql = `
    SELECT 
      s.id,
      COALESCE(NULLIF(st.name, ''), c.name, 'Service') AS service_name,
      COALESCE(c.name, 'General') AS category,
      s.description,
      s.price,
      COALESCE(s.avg_rating, 0) AS avg_rating,
      COALESCE(s.total_reviews, 0) AS total_reviews,
      u.name AS provider_name,
      u.phone
    FROM services s
    LEFT JOIN service_types st ON s.service_type_id = st.id
    LEFT JOIN categories c ON c.id = COALESCE(st.category_id, s.category_id)
    JOIN users u ON s.provider_id = u.id
    WHERE s.is_active = 1
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

  const sql = `
    SELECT
      s.id,
      s.category_id,
      s.service_type_id,
      COALESCE(NULLIF(st.name, ''), c.name, 'Service') AS service_name,
      COALESCE(c.name, 'General') AS category,
      s.description,
      s.price,
      COALESCE(s.avg_rating, 0) AS avg_rating,
      COALESCE(s.total_reviews, 0) AS total_reviews
    FROM services s
    LEFT JOIN service_types st ON s.service_type_id = st.id
    LEFT JOIN categories c ON c.id = COALESCE(st.category_id, s.category_id)
    WHERE s.provider_id = ? AND s.is_active = 1
    ORDER BY s.id DESC
  `;

  db.query(sql, [provider_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
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
