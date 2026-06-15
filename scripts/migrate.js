const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'beautyiq',
    user: process.env.DB_USER || 'beautyiq',
    password: process.env.DB_PASSWORD || 'beautyiq_dev',
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  const migrationsDir = path.join(__dirname, '..', 'infra', 'migrations');

  let client;
  try {
    client = await pool.connect();
    console.log('[Migrate] Connected to database');

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`[Migrate] Running ${file}...`);
      await client.query(sql);
      console.log(`[Migrate] ${file} complete`);
    }

    console.log('[Migrate] All migrations applied successfully');
  } catch (err) {
    console.error('[Migrate] Error:', err.message);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

migrate();
