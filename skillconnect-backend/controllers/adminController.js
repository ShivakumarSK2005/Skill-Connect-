const db = require("../config/db");

/**
 * WHAT IT DOES:
 *   Aggregates high-level platform statistics for the Admin Dashboard overview:
 *   total customer/provider users, active service listings, and bookings scheduled for today.
 * 
 * WHY WE ADDED IT:
 *   - Executive Oversight: Gives administrators an instant pulse of platform activity upon logging in.
 * 
 * HOW IT WORKS:
 *   1. Executes a consolidated SELECT query containing subqueries for users, services, and today's bookings.
 *   2. Returns a clean summary object `{ total_users, total_services, bookings_today }`.
 * 
 * @param {Object} _req - Express request
 * @param {Object} res - Express response
 */
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

/**
 * WHAT IT DOES:
 *   Fetches all categories in the system sorted newest first.
 * 
 * WHY WE ADDED IT:
 *   - Powers the "Categories" management table in the admin panel.
 * 
 * @param {Object} _req - Express request
 * @param {Object} res - Express response
 */
exports.getCategories = (_req, res) => {
  db.query(
    "SELECT id, name FROM categories ORDER BY id DESC",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
};

/**
 * WHAT IT DOES:
 *   Creates a new skill category (e.g. "Carpentry", "Appliance Repair").
 * 
 * WHY WE ADDED IT:
 *   - Allows administrators to expand the marketplace with new service niches.
 *   - Handles duplicates: gracefully catches unique constraint violations (ER_DUP_ENTRY).
 * 
 * HOW IT WORKS:
 *   1. Trims and validates the provided `name`.
 *   2. Inserts into `categories` table.
 *   3. Returns HTTP 201 with `category_id`.
 * 
 * @param {Object} req - Express request (body: name)
 * @param {Object} res - Express response
 */
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

/**
 * WHAT IT DOES:
 *   Deletes a category from the database.
 * 
 * WHY WE ADDED IT:
 *   - Allows admins to clean up unused or duplicate categories.
 * 
 * @param {Object} req - Express request (params: id)
 * @param {Object} res - Express response
 */
exports.deleteCategory = (req, res) => {
  db.query("DELETE FROM categories WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category removed successfully" });
  });
};

/**
 * WHAT IT DOES:
 *   Fetches all non-admin registered users (customers and providers).
 * 
 * WHY WE ADDED IT:
 *   - Powers the "Users" moderation panel in the admin dashboard.
 *   - Protects admin security: filters `role IN ('customer', 'provider')` so admins are managed separately.
 * 
 * @param {Object} _req - Express request
 * @param {Object} res - Express response
 */
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

/**
 * WHAT IT DOES:
 *   Deletes a customer or provider account from the platform.
 * 
 * WHY WE ADDED IT:
 *   - Moderation: Enables administrators to ban/remove abusive accounts or spammers.
 *   - Protection: Explicitly checks that the target account is a 'customer' or 'provider' to prevent
 *     accidental deletion of administrative accounts.
 * 
 * HOW IT WORKS:
 *   1. Queries `users` verifying target ID is a customer or provider.
 *   2. If found, executes DELETE statement.
 *   3. Returns success message.
 * 
 * @param {Object} req - Express request (params: id)
 * @param {Object} res - Express response
 */
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

/**
 * WHAT IT DOES:
 *   Retrieves all active services across the platform, including provider contact details.
 * 
 * WHY WE ADDED IT:
 *   - Powers the Admin Services moderation table to monitor published listings across categories.
 * 
 * @param {Object} _req - Express request
 * @param {Object} res - Express response
 */
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

/**
 * WHAT IT DOES:
 *   Soft-deactivates a service listing by setting `is_active = 0`.
 * 
 * WHY WE ADDED IT:
 *   - Content Moderation: Allows admins to pull down misleading or non-compliant listings
 *     without breaking historical booking records that reference this service ID.
 * 
 * @param {Object} req - Express request (params: id)
 * @param {Object} res - Express response
 */
exports.deactivateService = (req, res) => {
  db.query("UPDATE services SET is_active = 0 WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json({ message: "Service removed successfully" });
  });
};

/**
 * WHAT IT DOES:
 *   Fetches all platform bookings with customer and provider details, supporting time filters
 *   (today, week, month, year, or custom start and end date ranges).
 * 
 * WHY WE ADDED IT:
 *   - Marketplace Operations: Allows admins to monitor all appointments, resolve disputes,
 *     and track fulfillment across the platform.
 *   - Database View Integration: Reads from the `booking_details` view, delivering clean, unified data.
 * 
 * HOW IT WORKS:
 *   1. Extracts filter query parameters (`filter`, `start_date`, `end_date`).
 *   2. Dynamically generates SQL WHERE conditions.
 *   3. Queries `booking_details` view and sorts by booking date descending.
 * 
 * @param {Object} req - Express request (query: filter, start_date, end_date)
 * @param {Object} res - Express response
 */
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
