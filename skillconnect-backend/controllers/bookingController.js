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
      COALESCE(NULLIF(s.title, ''), c.name, 'Service') AS service_name,
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
    LEFT JOIN categories c ON c.id = s.category_id
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
  const conditions = ["provider_id = ?"];
  const values = [provider_id];

  if (filter === "today") {
    conditions.push("DATE(booking_date) = CURDATE()");
  } else if (filter === "week") {
    conditions.push("YEARWEEK(booking_date, 1) = YEARWEEK(CURDATE(), 1)");
  } else if (filter === "month") {
    conditions.push("YEAR(booking_date) = YEAR(CURDATE()) AND MONTH(booking_date) = MONTH(CURDATE())");
  } else if (filter === "year") {
    conditions.push("YEAR(booking_date) = YEAR(CURDATE())");
  }

  if (start_date) {
    conditions.push("DATE(booking_date) >= ?");
    values.push(start_date);
  }

  if (end_date) {
    conditions.push("DATE(booking_date) <= ?");
    values.push(end_date);
  }

  const sql = `
    SELECT 
      booking_id,
      service_name,
      category,
      booking_date,
      created_at,
      status,
      customer_name,
      customer_phone AS phone
    FROM booking_details
    WHERE ${conditions.join(" AND ")}
    ORDER BY booking_date DESC, booking_id DESC
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

exports.getProviderEarnings = (req, res) => {
  const provider_id = req.user.id;
  const { period = "month", year = new Date().getFullYear() } = req.query;
  const targetYear = parseInt(year, 10) || new Date().getFullYear();

  // 1. Get joined year from user registration
  const userSql = "SELECT YEAR(created_at) AS joined_year FROM users WHERE id = ?";
  db.query(userSql, [provider_id], (userErr, userRes) => {
    if (userErr) return res.status(500).json({ error: userErr.message });
    const joinedYear = userRes[0]?.joined_year || targetYear;
    const currentYear = new Date().getFullYear();

    // 2. Build conditions for period filter
    let timeCondition = "";
    const params = [provider_id];

    if (period === "week") {
      timeCondition = "AND YEARWEEK(b.booking_date, 1) = YEARWEEK(CURDATE(), 1)";
    } else if (period === "month") {
      timeCondition = "AND YEAR(b.booking_date) = YEAR(CURDATE()) AND MONTH(b.booking_date) = MONTH(CURDATE())";
    } else if (period === "last_month") {
      timeCondition = "AND b.booking_date >= DATE_SUB(DATE_FORMAT(CURDATE() ,'%Y-%m-01'), INTERVAL 1 MONTH) AND b.booking_date < DATE_FORMAT(CURDATE() ,'%Y-%m-01')";
    } else if (period === "year" || period === "selected_year") {
      timeCondition = "AND YEAR(b.booking_date) = ?";
      params.push(targetYear);
    } // 'all' requires no extra date clause

    // 3. Query completed transactions for this provider
    const transactionsSql = `
      SELECT 
        b.booking_id,
        b.service_name,
        b.category,
        b.booking_date,
        b.created_at,
        b.status,
        b.customer_name,
        b.customer_phone AS phone,
        b.price
      FROM booking_details b
      WHERE b.provider_id = ? AND b.status = 'completed' ${timeCondition}
      ORDER BY b.booking_date DESC, b.booking_id DESC
    `;

    db.query(transactionsSql, params, (txErr, transactions) => {
      if (txErr) return res.status(500).json({ error: txErr.message });

      const completedJobs = transactions.length;
      const totalEarnings = transactions.reduce((sum, item) => sum + Number(item.price || 0), 0);
      const avgPerJob = completedJobs > 0 ? Math.round(totalEarnings / completedJobs) : 0;

      // 4. Query monthly breakdown for target year
      const monthlySql = `
        SELECT 
          MONTH(b.booking_date) AS month_num,
          COUNT(b.id) AS jobs,
          COALESCE(SUM(s.price), 0) AS earnings
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        WHERE s.provider_id = ? AND b.status = 'completed' AND YEAR(b.booking_date) = ?
        GROUP BY MONTH(b.booking_date)
      `;

      db.query(monthlySql, [provider_id, targetYear], (monthErr, monthResults) => {
        if (monthErr) return res.status(500).json({ error: monthErr.message });

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyBreakdown = monthNames.map((name, idx) => {
          const match = monthResults.find((m) => m.month_num === idx + 1);
          return {
            month: idx + 1,
            name,
            jobs: match ? Number(match.jobs) : 0,
            earnings: match ? Number(match.earnings) : 0
          };
        });

        // 5. Top Earning Services in this period
        const serviceMap = {};
        transactions.forEach((tx) => {
          const sName = tx.service_name || "Service";
          if (!serviceMap[sName]) {
            serviceMap[sName] = { service_name: sName, category: tx.category, jobs: 0, earnings: 0 };
          }
          serviceMap[sName].jobs += 1;
          serviceMap[sName].earnings += Number(tx.price || 0);
        });

        const topServices = Object.values(serviceMap)
          .sort((a, b) => b.earnings - a.earnings)
          .map((item) => ({
            ...item,
            percentage: totalEarnings > 0 ? Math.round((item.earnings / totalEarnings) * 100) : 0
          }));

        // 6. Overall average rating
        const ratingSql = "SELECT AVG(avg_rating) as overall_rating FROM services WHERE provider_id = ?";
        db.query(ratingSql, [provider_id], (_rErr, rRes) => {
          const overallRating = rRes?.[0]?.overall_rating ? Number(rRes[0].overall_rating).toFixed(1) : "5.0";

          res.json({
            summary: {
              totalEarnings,
              completedJobs,
              avgPerJob,
              rating: overallRating,
              joinedYear,
              currentYear
            },
            monthlyBreakdown,
            topServices,
            transactions
          });
        });
      });
    });
  });
};
