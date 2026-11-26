const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true
  }
});

// Todas las consultas del backend usan el esquema "hospital" primero.
pool.on('connect', (client) => {
  client.query('SET search_path TO hospital, public').catch((e) => {
    console.error('No se pudo fijar search_path:', e.message);
  });
});

module.exports = pool;
