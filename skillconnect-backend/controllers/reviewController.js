const db = require("../config/db");

exports.getMyReviews = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT
      id,
      service_id,
      booking_id,
      rating,
      comment,
      created_at
    FROM reviews
    WHERE user_id = ?
    ORDER BY created_at DESC, id DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
};

exports.getServiceReviews = (req, res) => {
  const serviceId = req.params.serviceId;

  const sql = `
    SELECT
      r.id,
      r.rating,
      r.comment,
      r.created_at,
      u.name AS customer_name
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.service_id = ?
    ORDER BY r.created_at DESC, r.id DESC
  `;

  db.query(sql, [serviceId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
};

exports.addReview = (req, res) => {
  const { booking_id, rating, comment } = req.body;
  const user_id = req.user.id;

  if (!booking_id || !rating) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const bookingCheck = `
    SELECT b.id, b.service_id
    FROM bookings b
    WHERE b.id = ? AND b.user_id = ? AND b.status = 'completed'
  `;

  db.query(bookingCheck, [booking_id, user_id], (err, bookings) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (bookings.length === 0) {
      return res.status(400).json({
        message: "You can only review completed bookings"
      });
    }

    const service_id = bookings[0].service_id;
    const existingReviewSql = `
      SELECT id
      FROM reviews
      WHERE booking_id = ?
      LIMIT 1
    `;

    db.query(existingReviewSql, [booking_id], (existingErr, existingReviews) => {
      if (existingErr) {
        return res.status(500).json({ error: existingErr.message });
      }

      if (existingReviews.length > 0) {
        return res.status(400).json({
          message: "You already reviewed this booking"
        });
      }

      const insertReview = `
        INSERT INTO reviews (user_id, service_id, booking_id, rating, comment)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(
        insertReview,
        [user_id, service_id, booking_id, rating, comment || ""],
        (insertErr) => {
          if (insertErr) {
            if (insertErr.code === "ER_DUP_ENTRY") {
              return res.status(400).json({
                message: "You already reviewed this booking"
              });
            }

            return res.status(500).json({ error: insertErr.message });
          }

          const updateRating = `
            UPDATE services
            SET
              avg_rating = (
                SELECT AVG(rating) FROM reviews WHERE service_id = ?
              ),
              total_reviews = (
                SELECT COUNT(*) FROM reviews WHERE service_id = ?
              )
            WHERE id = ?
          `;

          db.query(updateRating, [service_id, service_id, service_id], (ratingErr) => {
            if (ratingErr) {
              return res.status(500).json({ error: ratingErr.message });
            }

            res.json({ message: "Review added successfully" });
          });
        }
      );
    });
  });
};
