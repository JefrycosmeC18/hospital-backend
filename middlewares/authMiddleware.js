const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { buscarPorId, buscarPorCorreo } = require('../repositories/usuariosRepository');

// Normaliza el rol: sin tildes, minusculas y con alias conocidos.
const ALIAS_ROLES = {
  admin: 'administrador',
  administrator: 'administrador',
  admin_hospital: 'administrador',
  administrador_hospital: 'administrador',
  hospital_admin: 'administrador',
  hospital_administrador: 'administrador',
  cajera: 'cajero',
  user: 'cliente',
  usuario: 'cliente',
  ciudadano: 'cliente',
  ciudadana: 'cliente'
};

function normalizarRol(rol) {
  const limpio = String(rol ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  return ALIAS_ROLES[limpio] || limpio;
}

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
      req.usuario = { ...actual, rol_bd: actual.rol, rol: normalizarRol(actual.rol) };
      return next();
    }

    // 2. Token compartido (SSO) emitido por otro módulo de la Red
    let actual = datos.correo ? await buscarPorCorreo(datos.correo) : null;

    if (!actual) {
      const central = await pool.query(
        `SELECT id, nombre, correo, rol, turno, sesion_version
         FROM usuarios
         WHERE id = $1
         LIMIT 1`,
        [datos.id]
      );
      actual = central.rows[0] || null;
    }

    if (!actual) {
      return res.status(401).json({ mensaje: 'Usuario no registrado en Hospital.' });
    }

    req.usuario = { ...actual, rol_bd: actual.rol, rol: normalizarRol(actual.rol) };
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
      // Este log aparece en Render > Logs y dice POR QUE se rechazo.
      console.warn(
        '[403 permisos]', req.method, req.originalUrl,
        '| usuario id=' + req.usuario.id,
        '| rol en BD=' + JSON.stringify(req.usuario.rol_bd ?? req.usuario.rol),
        '| rol normalizado=' + JSON.stringify(req.usuario.rol),
        '| permitidos=' + JSON.stringify(rolesPermitidos)
      );
      const respuesta = { exito: false, mensaje: 'No tienes permisos para esta operacion' };
      if (process.env.DEBUG_AUTH === 'true') {
        respuesta.debug = { rol_bd: req.usuario.rol_bd ?? req.usuario.rol, rol: req.usuario.rol, permitidos: rolesPermitidos };
      }
      return res.status(403).json(respuesta);
    }

    next();
  };
}

module.exports = {
  verificarToken,
  permitirRoles,
  normalizarRol
};
