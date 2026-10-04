const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

pool.query("SELECT NOW()", (error, result) => {
  if (error) {
    console.error("Database connection failed:", error.message);
  } else {
    console.log("Database connected:", result.rows[0]);
  }
});

module.exports = pool;