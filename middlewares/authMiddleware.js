const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { buscarPorId, buscarPorCorreo } = require('../repositories/usuariosRepository');

async function verificarToken(req, res, next) {
  const autorizacion = req.headers.authorization;

  if (!autorizacion || !autorizacion.startsWith('Bearer ')) {
    return res.status(401).json({
      exito: false,
      mensaje: 'Acceso denegado. Token requerido'
    });
  }

  const token = autorizacion.slice(7);

  try {
    const datos = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ['HS256'] }
    );

    if (!/^\d{1,18}$/.test(String(datos.id))) {
      return res.status(401).json({ mensaje: 'Sesión antigua o inválida. Inicia sesión de nuevo.' });
    }

    // 1. Token nativo de Hospital (incluye versión de sesión)
    if (Number.isInteger(datos.ver)) {
      const actual = await buscarPorId(datos.id);
      if (!actual || actual.rol !== datos.rol || actual.sesion_version !== datos.ver) {
        return res.status(401).json({ mensaje: 'Sesión invalidada. Inicia sesión de nuevo.' });
      }
      req.usuario = actual;
      return next();
    }

    // 2. Token compartido (SSO) emitido por otro módulo de la Red
    let actual = datos.correo ? await buscarPorCorreo(datos.correo) : null;

    if (!actual) {
      const central = await pool.query(
        `SELECT h.id, h.nombre, h.correo, h.rol, h.turno, h.sesion_version
         FROM public.usuarios u
         JOIN hospital.usuarios h ON LOWER(h.correo) = LOWER(u.correo)
         WHERE u.id = $1
         LIMIT 1`,
        [datos.id]
      );
      actual = central.rows[0] || null;
    }

    if (!actual) {
      return res.status(401).json({ mensaje: 'Usuario no registrado en Hospital.' });
    }

    req.usuario = actual;
    next();
  } catch (error) {
    if (!['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)) return next(error);
    return res.status(401).json({
      exito: false,
      mensaje: 'Token invalido o expirado'
    });
  }
}

function permitirRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Autenticacion requerida'
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permisos para esta operacion'
      });
    }

    next();
  };
}

module.exports = {
  verificarToken,
  permitirRoles
};
