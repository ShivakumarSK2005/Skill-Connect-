const db = require("../config/db");

/**
 * WHAT IT DOES:
 *   Retrieves the list of reviews submitted by the logged-in customer.
 * 
 * WHY WE ADDED IT:
 *   - Allows customers to see their past feedback and ratings in their profile/account views.
 * 
 * HOW IT WORKS:
 *   1. Obtains the customer's ID from `req.user.id` (set by `verifyToken`).
 *   2. Queries `reviews` table filtering by `user_id = ?`.
 *   3. Orders results chronologically, newest first.
 *   4. Returns the reviews array as JSON.
 * 
 * @param {Object} req - Express request (with req.user.id)
 * @param {Object} res - Express response
 */
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

/**
 * WHAT IT DOES:
 *   Fetches all public reviews and star ratings for a specific service, along with customer names.
 * 
 * WHY WE ADDED IT:
 *   - Social Proof: Displays genuine customer feedback on service listings so prospective customers
 *     can evaluate service quality before booking.
 * 
 * HOW IT WORKS:
 *   1. Reads `serviceId` from route parameters (`/api/reviews/service/:serviceId`).
 *   2. Joins `reviews` with `users` to project `u.name AS customer_name`.
 *   3. Orders reviews newest first.
 *   4. Returns the reviews array as JSON.
 * 
 * @param {Object} req - Express request (with req.params.serviceId)
 * @param {Object} res - Express response
 */
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

/**
 * WHAT IT DOES:
 *   Validates and saves a customer rating (1-5 stars) and review comment for a completed service.
 * 
 * WHY WE ADDED IT:
 *   - Service Quality Feedback: Collects real customer ratings to evaluate provider performance.
 *   - Fraud Prevention: Verifies the booking actually occurred, belongs to this customer, and is completed.
 *   - Atomic DB Trigger Integration: Leverages MySQL trigger `after_review_insert` to recalculate
 *     `services.avg_rating` and `services.total_reviews` instantly without extra Node.js queries.
 * 
 * HOW IT WORKS:
 *   1. Extracts `booking_id`, `rating`, and `comment` from `req.body`.
 *   2. Checks `bookings` table to verify this booking is 'completed' and belongs to `req.user.id`.
 *   3. Checks `reviews` table to ensure the customer has not already reviewed this booking.
 *   4. Inserts the review row into `reviews`.
 *   5. The MySQL trigger `after_review_insert` fires automatically in the database.
 *   6. Responds with success message.
 * 
 * @param {Object} req - Express request (body: booking_id, rating, comment; user: id)
 * @param {Object} res - Express response
 */
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

          // Update service avg_rating and total_reviews directly
          const updateServiceRating = `
            UPDATE services
            SET
              avg_rating = (
                SELECT COALESCE(ROUND(AVG(rating), 1), 0)
                FROM reviews
                WHERE service_id = ?
              ),
              total_reviews = (
                SELECT COUNT(*)
                FROM reviews
                WHERE service_id = ?
              )
            WHERE id = ?
          `;

          db.query(updateServiceRating, [service_id, service_id, service_id], (updateErr) => {
            if (updateErr) {
              console.error("Failed to update service rating:", updateErr);
            }
            res.json({ message: "Review added successfully" });
          });
        }
      );
    });
  });
};
