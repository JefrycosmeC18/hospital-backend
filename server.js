require('dotenv').config();
const app=require('./app'),pool=require('./config/database');
const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log(`Servidor funcionando en http://localhost:${PORT}`));
pool.query('SELECT NOW() AS fecha').then(()=>console.log('Conexion exitosa con Neon PostgreSQL')).catch(e=>console.error('Error al conectar con Neon:',e.code||e.name));
