
const authService = require('../services/authService');

async function iniciarSesion(req, res) {
  try {
    const { correo, contrasena } = req.body || {};

    if (
      typeof correo !== 'string' ||
      typeof contrasena !== 'string' ||
      !correo.trim() ||
      !contrasena
    ) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Correo y contrasena son obligatorios'
      });
    }

    const resultado = await authService.iniciarSesion(
      correo,
      contrasena
    );

    if (!resultado.exito) {
      return res.status(401).json(resultado);
    }

    return res.status(200).json(resultado);

  } catch (error) {
    console.error('Error en autenticacion:', error.message);

    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
}

module.exports = {
  iniciarSesion
};
