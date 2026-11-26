
const pool = require('../config/database');

async function buscarPorCorreo(correo) {
  const consulta = `
    SELECT
      id,
      nombre,
      correo,
      contrasena,
      rol,
      turno,
      sesion_version
    FROM usuarios
    WHERE LOWER(correo) = LOWER($1)
    LIMIT 1
  `;

  const resultado = await pool.query(consulta, [correo]);

  return resultado.rows[0] || null;
}

async function actualizarContrasena(id, hash) {
  const consulta = `
    UPDATE usuarios
    SET contrasena = $1
    WHERE id = $2
  `;

  await pool.query(consulta, [hash, id]);
}

module.exports = {
  buscarPorCorreo,
  actualizarContrasena
};

async function buscarPorId(id){return (await pool.query('SELECT id,nombre,correo,rol,turno,sesion_version FROM usuarios WHERE id=$1',[id])).rows[0]||null;}
async function listar(){return (await pool.query('SELECT id,nombre,correo,rol,turno FROM usuarios ORDER BY id')).rows;}
async function crear(db,nombre,correo,hash){return (await db.query("INSERT INTO usuarios (nombre,correo,contrasena,rol) VALUES ($1,$2,$3,'cliente') RETURNING id,nombre,correo,rol,turno",[nombre,correo,hash])).rows[0];}
async function cambiar(db,id,rol,turno){return (await db.query('UPDATE usuarios SET rol=$2,turno=$3,sesion_version=sesion_version+1 WHERE id=$1 RETURNING id,nombre,correo,rol,turno',[id,rol,turno])).rows[0];}
Object.assign(module.exports,{buscarPorId,listar,crear,cambiar});
