const pool = require("../model/pool");

//these async functions are only used for initializing the database (used only once)

async function createUsersTable() {
  const connection = pool.promise();
  await connection.query(`
  CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(10) NOT NULL PRIMARY KEY,
    name VARCHAR(40),
    email VARCHAR(60) DEFAULT '',
    created_at INT(10),
    is_admin SMALLINT DEFAULT 0,
    hashed_password VARCHAR(64), 
    salt VARCHAR(64)
  );
  `);
}

module.exports = {
  createUsersTable,
};
