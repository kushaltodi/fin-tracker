 const Pool = require("pg").Pool;

 const pool = new Pool({
    user: "postgres",
    password: "2ndapril",
    host: "127.0.0.1",
    port: 5432,
    database: "FinTracker"
 });
 

 module.exports = pool;