import dotenv from "dotenv";
dotenv.config({ path: "Backend/.env" }); 	

import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: process.env.DB_PASSWORD,
    database: "fairdrop"
});