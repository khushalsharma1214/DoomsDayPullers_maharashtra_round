import dotenv from "dotenv";
dotenv.config({ path: "Backend/.env" });

import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: process.env.DB_PASSWORD,
    database: "fairdrop",

    // Controlled database concurrency.
    // We do NOT want thousands of HTTP requests
    // creating thousands of PostgreSQL connections.
    max: 50,

    // Close idle connections after 30 seconds.
    idleTimeoutMillis: 30000,

    // Give a request up to 10 seconds to obtain
    // a PostgreSQL connection from the pool.
    connectionTimeoutMillis: 10000
});