const db = require("../config/db");

exports.createBooking = (req, res) => {
  const { service_id, booking_date } = req.body;
  const user_id = req.user.id;

  if (!service_id || !booking_date) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const now = new Date();
  const bookingTime = new Date(booking_date);

  if (bookingTime <= now) {
    return res.status(400).json({
      message: "Booking date must be in the future"
    });
  }

  const checkSql = `
    SELECT id FROM bookings
    WHERE user_id = ? AND service_id = ?
    AND status NOT IN ('completed', 'cancelled', 'expired')
  `;

  db.query(checkSql, [user_id, service_id], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (existing.length > 0) {
      return res.status(400).json({
        message: "You already have an active booking for this service"
      });
    }

    const sql = `
      INSERT INTO bookings (user_id, service_id, booking_date, status)
      VALUES (?, ?, ?, 'pending')
    `;

    db.query(sql, [user_id, service_id, booking_date], (err2, result) => {
      if (err2) {
        return res.status(500).json({ error: err2.message });
      }

      res.status(201).json({
        message: "Booking created successfully",
        booking_id: result.insertId
      });
    });
  });
};

exports.updateBookingStatus = (req, res) => {
  const bookingId = req.params.id;
  const { status } = req.body;
  const provider_id = req.user.id;

  if (!["confirmed", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const checkSql = `
    SELECT b.id
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.id = ? AND s.provider_id = ?
  `;

  db.query(checkSql, [bookingId, provider_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updateSql = `
      UPDATE bookings
      SET status = ?
      WHERE id = ?
    `;

    db.query(updateSql, [status, bookingId], (err2) => {
      if (err2) {
        return res.status(500).json({ error: err2.message });
      }

      res.json({ message: "Booking status updated" });
    });
  });
};

exports.getCustomerBookings = (req, res) => {
  const user_id = req.user.id;

  const sql = `
    SELECT 
      b.id AS booking_id,
      b.service_id,
      COALESCE(NULLIF(st.name, ''), c.name, 'Service') AS service_name,
      COALESCE(c.name, 'General') AS category,
      b.booking_date,
      b.status,
      u.name AS provider_name,
      u.phone,
      (
        SELECT rv.rating
        FROM reviews rv
        WHERE rv.user_id = b.user_id
        AND (
          rv.booking_id = b.id
          OR (rv.booking_id IS NULL AND rv.service_id = b.service_id)
        )
        ORDER BY CASE WHEN rv.booking_id = b.id THEN 0 ELSE 1 END
        LIMIT 1
      ) AS user_rating,
      (
        SELECT rv.comment
        FROM reviews rv
        WHERE rv.user_id = b.user_id
        AND (
          rv.booking_id = b.id
          OR (rv.booking_id IS NULL AND rv.service_id = b.service_id)
        )
        ORDER BY CASE WHEN rv.booking_id = b.id THEN 0 ELSE 1 END
        LIMIT 1
      ) AS user_comment,
      (
        SELECT rv.created_at
        FROM reviews rv
        WHERE rv.user_id = b.user_id
        AND (
          rv.booking_id = b.id
          OR (rv.booking_id IS NULL AND rv.service_id = b.service_id)
        )
        ORDER BY CASE WHEN rv.booking_id = b.id THEN 0 ELSE 1 END
        LIMIT 1
      ) AS user_reviewed_at
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    LEFT JOIN service_types st ON s.service_type_id = st.id
    LEFT JOIN categories c ON c.id = COALESCE(st.category_id, s.category_id)
    JOIN users u ON s.provider_id = u.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC, b.id DESC
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
};

exports.getProviderBookings = (req, res) => {
  const provider_id = req.user.id;
  const { filter = "all", start_date, end_date } = req.query;
  const conditions = ["s.provider_id = ?"];
  const values = [provider_id];

  if (filter === "today") {
    conditions.push("DATE(b.booking_date) = CURDATE()");
  } else if (filter === "week") {
    conditions.push("YEARWEEK(b.booking_date, 1) = YEARWEEK(CURDATE(), 1)");
  } else if (filter === "month") {
    conditions.push("YEAR(b.booking_date) = YEAR(CURDATE()) AND MONTH(b.booking_date) = MONTH(CURDATE())");
  } else if (filter === "year") {
    conditions.push("YEAR(b.booking_date) = YEAR(CURDATE())");
  }

  if (start_date) {
    conditions.push("DATE(b.booking_date) >= ?");
    values.push(start_date);
  }

  if (end_date) {
    conditions.push("DATE(b.booking_date) <= ?");
    values.push(end_date);
  }

  const sql = `
    SELECT 
      b.id AS booking_id,
      COALESCE(NULLIF(st.name, ''), c.name, 'Service') AS service_name,
      COALESCE(c.name, 'General') AS category,
      b.booking_date,
      b.created_at,
      b.status,
      u.name AS customer_name,
      u.phone
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    LEFT JOIN service_types st ON s.service_type_id = st.id
    LEFT JOIN categories c ON c.id = COALESCE(st.category_id, s.category_id)
    JOIN users u ON b.user_id = u.id
    WHERE ${conditions.join(" AND ")}
    ORDER BY b.booking_date DESC, b.id DESC
  `;

  db.query(sql, values, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
};

exports.markAsCompleted = (req, res) => {
  const bookingId = req.params.id;
  const provider_id = req.user.id;

  const checkSql = `
    SELECT b.status
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.id = ? AND s.provider_id = ?
  `;

  db.query(checkSql, [bookingId, provider_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const currentStatus = results[0].status;

    if (currentStatus !== "started") {
      return res.status(400).json({
        message: "Only started bookings can be completed"
      });
    }

    const updateSql = `
      UPDATE bookings
      SET status = 'completed'
      WHERE id = ?
    `;

    db.query(updateSql, [bookingId], (err2) => {
      if (err2) {
        return res.status(500).json({ error: err2.message });
      }

      res.json({ message: "Booking marked as completed" });
    });
  });
};

exports.requestStart = (req, res) => {
  const bookingId = req.params.id;
  const provider_id = req.user.id;

  const sql = `
    SELECT b.status
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.id = ? AND s.provider_id = ?
  `;

  db.query(sql, [bookingId, provider_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const status = results[0].status;

    if (status !== "confirmed") {
      return res.status(400).json({
        message: "Only confirmed bookings can request start"
      });
    }

    const updateSql = `
      UPDATE bookings SET status = 'pending_start' WHERE id = ?
    `;

    db.query(updateSql, [bookingId], (err2) => {
      if (err2) {
        return res.status(500).json({ error: err2.message });
      }

      res.json({ message: "Start request sent to customer" });
    });
  });
};

exports.confirmStart = (req, res) => {
  const bookingId = req.params.id;
  const user_id = req.user.id;

  const sql = `
    SELECT status, booking_date
    FROM bookings
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, [bookingId, user_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { status, booking_date } = results[0];

    if (status !== "pending_start") {
      return res.status(400).json({
        message: "Start not requested yet"
      });
    }

    const now = new Date();
    const bookingTime = new Date(booking_date);
    const diffHours = (now - bookingTime) / (1000 * 60 * 60);

    if (diffHours > 1) {
      const expireSql = `
        UPDATE bookings SET status = 'expired' WHERE id = ?
      `;
      db.query(expireSql, [bookingId]);

      return res.status(400).json({
        message: "Booking expired (not started within 1 hour)"
      });
    }

    const updateSql = `
      UPDATE bookings SET status = 'started' WHERE id = ?
    `;

    db.query(updateSql, [bookingId], (err2) => {
      if (err2) {
        return res.status(500).json({ error: err2.message });
      }

      res.json({ message: "Work started" });
    });
  });
};

exports.cancelBooking = (req, res) => {
  const bookingId = req.params.id;
  const user_id = req.user.id;

  const checkSql = `
    SELECT status FROM bookings
    WHERE id = ? AND user_id = ?
  `;

  db.query(checkSql, [bookingId, user_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { status } = results[0];

    if (status !== "pending") {
      return res.status(400).json({
        message: "Only pending bookings can be cancelled"
      });
    }

    const updateSql = `
      UPDATE bookings SET status = 'cancelled' WHERE id = ?
    `;

    db.query(updateSql, [bookingId], (err2) => {
      if (err2) {
        return res.status(500).json({ error: err2.message });
      }

      res.json({ message: "Booking cancelled successfully" });
    });
  });
};
