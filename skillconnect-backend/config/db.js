/**
 * WHAT IT DOES:
 *   Establishes and exports a centralized connection to the MySQL database (SKILL_CONNECT)
 *   using the mysql2 driver and environment variables.
 * 
 * WHY WE ADDED IT:
 *   - Centralizes database credentials in .env so sensitive passwords are never hardcoded.
 *   - Shares a single reusable DB client instance across all controllers and models,
 *     preventing redundant connections.
 * 
 * HOW IT WORKS:
 *   1. Reads host, user, password, and database credentials securely from process.env.
 *   2. Creates a MySQL connection instance via mysql.createConnection().
 *   3. Tests the connection on application startup and logs success or connection errors.
 *   4. Exports the `db` instance for query execution in controllers.
 */
const mysql = require("mysql2");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 4000,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Enable SSL if running against TiDB or cloud database
if (process.env.DB_SSL === "true" || (process.env.DB_HOST && process.env.DB_HOST.includes("tidbcloud.com"))) {
  dbConfig.ssl = {
    minVersion: "TLSv1.2",
    rejectUnauthorized: true
  };
}

const db = mysql.createPool(dbConfig);

db.getConnection((err, connection) => {
  if (err) {
    console.error("DB connection failed:", err.message);
  } else {
    console.log("MySQL/TiDB Connected successfully");
    connection.release();
  }
});

module.exports = db;