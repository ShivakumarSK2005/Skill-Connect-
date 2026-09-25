const db = require("../config/db");

/**
 * WHAT IT DOES:
 *   Legacy endpoint returning an empty array for backward compatibility.
 * 
 * WHY WE ADDED IT:
 *   - Maintained so older frontend calls to `/service-types` do not throw 404 errors
 *     after the redundant `service_types` dictionary table was deprecated in favor of free-text titles.
 */
exports.getServiceTypes = (_req, res) => {
  res.json([]);
};

/**
 * WHAT IT DOES:
 *   Fetches the list of active service categories (e.g., "Plumbing", "Electrical", "Cleaning").
 * 
 * WHY WE ADDED IT:
 *   - Powers category dropdown filters on the customer catalog and provider service creation forms.
 * 
 * HOW IT WORKS:
 *   1. Queries `categories` table ordered alphabetically.
 *   2. Returns array of `{ id, name }`.
 * 
 * @param {Object} _req - Express request
 * @param {Object} res - Express response
 */
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

/**
 * WHAT IT DOES:
 *   Creates a new service offering tied to the logged-in provider.
 * 
 * WHY WE ADDED IT:
 *   - Allows skilled professionals to publish their services, set hourly/flat pricing, and specify details.
 * 
 * HOW IT WORKS:
 *   1. Extracts `category_id`, `service_name`/`title`, `description`, and `price` from `req.body`.
 *   2. Extracts authenticated provider ID from `req.user.id`.
 *   3. Validates required fields and ensures positive numeric price.
 *   4. Inserts into `services` table with `is_active = 1`.
 *   5. Responds with HTTP 201 Created.
 * 
 * @param {Object} req - Express request (body: category_id, service_name, description, price; user: id)
 * @param {Object} res - Express response
 */
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

/**
 * WHAT IT DOES:
 *   Updates the details (category, title, description, price) of an existing service.
 * 
 * WHY WE ADDED IT:
 *   - Allows providers to adjust their rates or refine service descriptions over time.
 *   - Enforces ownership security: verifies that the service belongs to the calling provider before updating.
 * 
 * HOW IT WORKS:
 *   1. Reads `service_id` from `req.params.id` and provider ID from `req.user.id`.
 *   2. Queries `services` to verify ownership (`WHERE id = ? AND provider_id = ?`).
 *   3. If not found or owned by another provider, responds with 403 Forbidden.
 *   4. Updates the record in the `services` table.
 *   5. Responds with success message.
 * 
 * @param {Object} req - Express request (params: id; body: category_id, service_name, description, price; user: id)
 * @param {Object} res - Express response
 */
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

/**
 * WHAT IT DOES:
 *   Retrieves the public catalog of all active services offered by all providers.
 * 
 * WHY WE ADDED IT:
 *   - Serves as the primary marketplace browse page for customers searching for services.
 *   - Projects provider contact details, category names, average star ratings, and review counts.
 * 
 * HOW IT WORKS:
 *   1. Performs a LEFT JOIN between `services`, `categories`, and `users` (providers).
 *   2. Formats and aliases names cleanly with `COALESCE`.
 *   3. Orders services descending by ID (newest listings first).
 *   4. Returns the services array as JSON.
 * 
 * @param {Object} _req - Express request
 * @param {Object} res - Express response
 */
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

/**
 * WHAT IT DOES:
 *   Retrieves all services created by the currently logged-in provider.
 * 
 * WHY WE ADDED IT:
 *   - Powers the "My Services" management page in the provider portal.
 *   - Database Stored Procedure Integration: Leverages the MySQL Stored Procedure `CALL GetProviderServices(?)`
 *     to encapsulate the complex query logic inside the database.
 * 
 * HOW IT WORKS:
 *   1. Reads provider ID from `req.user.id`.
 *   2. Executes `CALL GetProviderServices(?)`.
 *   3. Unpacks results from `results[0]` (the mysql2 format for stored procedure result sets).
 *   4. Returns the list of provider services as JSON.
 * 
 * @param {Object} req - Express request (with req.user.id)
 * @param {Object} res - Express response
 */
exports.getProviderServices = (req, res) => {
  const provider_id = req.user.id;

  const sql = `
    SELECT
      s.id,
      s.category_id,
      s.title AS service_name,
      COALESCE(c.name, 'General') AS category,
      s.description,
      s.price,
      COALESCE(s.avg_rating, 0) AS avg_rating,
      COALESCE(s.total_reviews, 0) AS total_reviews,
      s.created_at
    FROM services s
    LEFT JOIN categories c ON c.id = s.category_id
    WHERE s.provider_id = ?
    ORDER BY s.id DESC
  `;

  db.query(sql, [provider_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(results || []);
  });
};

/**
 * WHAT IT DOES:
 *   Deletes a service listing belonging to the logged-in provider.
 * 
 * WHY WE ADDED IT:
 *   - Allows providers to permanently remove discontinued services.
 *   - Authorization verification: Ensures providers can only delete their own listings.
 * 
 * HOW IT WORKS:
 *   1. Reads `service_id` from `req.params.id` and provider ID from `req.user.id`.
 *   2. Validates ownership via SELECT query.
 *   3. Executes DELETE FROM services WHERE id = ?.
 *   4. Returns success message.
 * 
 * @param {Object} req - Express request (params: id; user: id)
 * @param {Object} res - Express response
 */
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
