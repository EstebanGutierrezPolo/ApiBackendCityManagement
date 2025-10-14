import pool from './db';

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa a PostgreSQL');
    console.log('🕒 Hora actual del servidor:', result.rows[0].now);
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error);
  } finally {
    await pool.end();
    console.log('🔒 Conexión cerrada');
  }
}

testConnection();