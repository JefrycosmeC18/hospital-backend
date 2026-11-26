require('dotenv').config();
const app=require('./app'),pool=require('./config/database');
const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log(`Servidor funcionando en http://localhost:${PORT}`));
pool.query('SELECT NOW() AS fecha').then(()=>console.log('Conexion exitosa con Neon PostgreSQL')).catch(e=>console.error('Error al conectar con Neon:',e.code||e.name));
pool.query(`SELECT current_database() AS db, current_user AS usr, current_setting('search_path') AS sp, (SELECT tableoid::regclass::text FROM usuarios LIMIT 1) AS tabla_usuarios, (SELECT rol FROM usuarios WHERE id=14) AS rol_id14`)
  .then(r => console.log('[DIAG]', JSON.stringify(r.rows[0])))
  .catch(e => console.error('[DIAG] error', e.message));
