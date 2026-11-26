# Hospital Regional del Norte — backend Express + PostgreSQL

Ampliación del backend entregado por el usuario. Conserva la arquitectura routes/controllers/services/repositories/middlewares y los endpoints de salud, login y listado de citas. Compatible con el React entregado anteriormente (incluida la corrección de `datos` en el adaptador). No hay acceso directo a Neon desde React.

## Instalación sobre el proyecto existente (Windows)

1. Haz una copia de seguridad de tu carpeta `hospital-backend` y, de ser posible, de la base Neon o crea una rama de prueba. Detén Node con Ctrl+C. Descomprime el ZIP y copia el contenido de su carpeta `hospital-backend` sobre tu carpeta existente, aceptando reemplazar archivos. El ZIP no contiene `.env` ni `node_modules`: conserva los de tu proyecto. No copies `.env.example` encima de `.env`.
2. Desde la terminal ubicada en la carpeta del backend ejecuta `npm install` (solo si no tienes las dependencias), luego `npm run preparar-db`. Esta orden comprueba las tablas y columnas referenciadas por los SQL originales; añade `usuarios.sesion_version`, `citas_medicas.datos_solicitud` (JSONB para nacimiento/teléfono/correo/motivo) y `hospital_auditoria`. Es una migración aditiva, no borra ni vuelve a insertar citas/usuarios. Si falla, no continúes: envía el mensaje de error sin credenciales. No se ejecuta automáticamente al arrancar.
3. Si la preparación fue correcta: `npm start`. Mantén Vite en 5173 y Node en 3000. Cierra sesión en React y vuelve a iniciar sesión: el JWT ahora incluye versión de sesión, por lo que los tokens anteriores ya no son válidos.
4. Primero comprueba listado de citas y usuarios, reportes y caja. Después prueba altas y cambios en registros de prueba (no en pacientes reales), y registro de un usuario de prueba. `npm test` prueba el HTTP con repositorio sustituido en memoria; nunca consulta Neon.

## Endpoints

| Método | Ruta (prefijo /api) | Rol |
|---|---|---|
| GET | /salud | público |
| POST | /auth/login | público |
| POST | /auth/register | público; crea cliente |
| GET | /citas | administrador, empleado |
| GET | /citas/mias | cliente |
| GET | /citas/:id | cliente dueño |
| POST | /citas | cliente |
| PATCH | /citas/:id | cliente dueño, registrada no pagada |
| POST | /citas/presenciales | administrador, empleado de turno |
| PATCH | /citas/:id/gestion | administrador, empleado de turno |
| DELETE | /citas/:id/gestion | administrador, empleado de turno, sin historial de pagos |
| GET | /usuarios | administrador |
| PATCH | /usuarios/:id/rol | administrador |
| GET | /caja/pendientes | administrador, cajero |
| POST | /caja/cobros | administrador, cajero |
| GET | /caja/pagos | administrador, cajero |
| PATCH | /caja/pagos/:id/verificar | administrador, cajero |
| GET | /caja/resumen | administrador, cajero |
| POST | /pagos/pasarela | cliente dueño, modo académico habilitado |
| GET | /pagos/comprobante/:op | cliente dueño, personal autorizado |

Los reportes React consumen GET /citas con sus campos ampliados. Contratos: ver `docs/API-CONTRATOS.md` del frontend, que se usó como referencia. GET /citas conserva `{mensaje,total,datos}`; otras rutas devuelven envoltorios nombrados (`cita`, `citas`, `usuario`, `usuarios`, `pago`, `pagos`, `resumen`). DELETE devuelve 204. Los importes vienen de PostgreSQL o de reglas del servidor, no del formulario. El cliente no puede elegir su rol. Se comprueban permisos y versión del JWT contra usuarios en cada solicitud. Cambios y cobros se registran en auditoría; los pagos bloquean la cita y usan una única transacción. Los pagos rechazados académicos también se registran.

## Pasarela y límites

La pasarela se implementó contra las tablas académicas `banco_tarjetas`, `banco_cuentas`, `billeteras` y `pagos`, según las consultas nativas. Por defecto devuelve 503. Solo si se verifica que las tablas y cuentas contienen exclusivamente datos de prueba, añade `PASARELA_ACADEMICA=true` al `.env`, vuelve a ejecutar `npm run preparar-db` y reinicia Node. Nunca introducir números/CVV/códigos reales; no hay integración bancaria real. No almacena PAN ni CVV en pagos ni auditoría. El registro en caja por POS/billetera supone que el cajero ya verificó el cobro externo. La exoneración SIS conserva la regla académica declarativa de la versión original; no hay validación contra el servicio oficial SIS. No usar este sistema en producción clínica.

La base no fue contactada desde el entorno de desarrollo de esta entrega. Los nombres de columnas de los nuevos endpoints derivan de los SQL nativos; las restricciones, tipos, valores de enum, valores por defecto y permisos reales todavía requieren validación. Si hay discrepancias, no se deben inventar datos ni desactivar restricciones. El script valida presencia de columnas, no todos los tipos o constraints. Se mantiene la compatibilidad temporal del login antiguo con contraseñas en texto plano del backend existente; las nuevas cuentas se guardan con bcrypt. Antes de un despliegue real, migrar las cuentas antiguas, eliminar esa compatibilidad y rotar las credenciales. Se activa validación TLS en la configuración de pg; si la URL original contiene parámetros SSL que la sobrescriben, usa la configuración segura de Neon.

## Seguridad y pruebas

No se incluyó el `.env` original ni se usaron sus credenciales. Renueva la contraseña de Neon y el secreto JWT si se compartieron fuera del entorno privado; guarda los nuevos valores solo en el `.env` del backend. Se incluye `.env.example` sin secretos. Los logs de errores de la nueva API no muestran cuerpos ni consultas sensibles. La limitación de intentos de autenticación es local a un proceso, suficiente para la práctica, no una estrategia completa para producción.

Pruebas ejecutadas: 8/8 con Express HTTP, bcrypt y JWT reales, PostgreSQL simulado de forma explícita dentro de los tests. Verifican tarifas, turno, autenticación, permisos, propiedad, alta presencial, caja, transacción, usuarios y bloqueo de pasarela. Todos los JS de la aplicación pasaron `node --check`. No se probaron todos los endpoints de escritura con Neon ni la interfaz React de extremo a extremo. El siguiente paso es validar el esquema con `npm run preparar-db` en tu PC y probar los flujos reales con datos de prueba.
