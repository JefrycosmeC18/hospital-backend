
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const usuariosRepository = require('../repositories/usuariosRepository');

async function iniciarSesion(correo, contrasena) {

  // Validar datos obligatorios
  if (
    typeof correo !== 'string' ||
    typeof contrasena !== 'string' ||
    !correo.trim() ||
    !contrasena
  ) {
    return {
      exito: false,
      mensaje: 'Correo y contrasena son obligatorios'
    };
  }

  // Buscar usuario en Neon PostgreSQL
  const usuario = await usuariosRepository.buscarPorCorreo(
    correo.trim()
  );

  if (!usuario) {
    return {
      exito: false,
      mensaje: 'Credenciales incorrectas'
    };
  }

  // Identificar formato de contrasena
  const claveGuardada = usuario.contrasena;
  const esBcrypt = /^\$2[aby]\$\d{2}\$/.test(claveGuardada);

  let claveCorrecta = false;

  if (esBcrypt) {

    claveCorrecta = await bcrypt.compare(
      contrasena,
      claveGuardada
    );

  } else {

    // Compatibilidad temporal con contrasenas antiguas
    const claveIngresada = crypto
      .createHash('sha256')
      .update(contrasena)
      .digest();

    const claveAnterior = crypto
      .createHash('sha256')
      .update(claveGuardada)
      .digest();

    claveCorrecta = crypto.timingSafeEqual(
      claveIngresada,
      claveAnterior
    );
  }

  if (!claveCorrecta) {
    return {
      exito: false,
      mensaje: 'Credenciales incorrectas'
    };
  }

  // La migracion automatica a bcrypt sigue desactivada
  // para no modificar las cuentas durante las pruebas.

  // Comprobar configuracion JWT
  if (!process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET no esta configurado correctamente');
  }

  // Generar token de autenticacion
  const token = jwt.sign(
    {
      id: usuario.id,
      rol: usuario.rol,
      ver: usuario.sesion_version
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '2h',
      algorithm: 'HS256'
    }
  );

  // Responder sin incluir la contrasena
  return {
    exito: true,
    mensaje: 'Inicio de sesion correcto',
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      turno: usuario.turno
    }
  };
}

module.exports = {
  iniciarSesion
};
