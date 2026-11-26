require('dotenv').config();
const app=require('./app'),pool=require('./config/database');
const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log(`Servidor funcionando en http://localhost:${PORT}`));
pool.query('SELECT NOW() AS fecha').then(()=>console.log('Conexion exitosa con Neon PostgreSQL')).catch(e=>console.error('Error al conectar con Neon:',e.code||e.name));

(async () => {
  try {
    const a = await pool.query(`SELECT current_database() AS db, current_user AS usr, current_setting('search_path') AS sp, (SELECT n.nspname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.oid=to_regclass('usuarios')) AS esquema_usado, to_regclass('hospital.usuarios') IS NOT NULL AS existe_hospital_usuarios`);
    console.log('[DIAG2]', JSON.stringify(a.rows[0]));
    const t = await pool.query(`SELECT table_schema, string_agg(column_name, ',') AS cols FROM information_schema.columns WHERE table_name='usuarios' GROUP BY table_schema ORDER BY 1`);
    console.log('[DIAG2] tablas usuarios:', JSON.stringify(t.rows));
    for (const s of t.rows.filter(x => x.cols.includes('rol'))) {
      const r = await pool.query(`SELECT id, correo, rol FROM "${s.table_schema}".usuarios WHERE id = 14`);
      console.log('[DIAG2] id14 en', s.table_schema, JSON.stringify(r.rows));
    }
  } catch (e) { console.error('[DIAG2] error', e.message); }
})();
