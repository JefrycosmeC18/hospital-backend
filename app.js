const express=require('express'),cors=require('cors');
const {HttpError}=require('./services/rules');
const app=express();app.disable('x-powered-by');
app.use(cors({origin:process.env.FRONTEND_URL||'http://localhost:5173'}));app.use(express.json({limit:'32kb'}));
// Basic per-IP throttling for public authentication (single-process academic deployment).
const attempts=new Map();function limit(req,res,next){const now=Date.now(),key=req.ip;for(const [k,a] of attempts)if(a.until<=now)attempts.delete(k);const a=attempts.get(key)||{n:0,until:now+60000};a.n++;attempts.set(key,a);if(a.n>20)return res.status(429).json({mensaje:'Demasiados intentos. Espera un minuto.'});next();}
app.use('/api/auth',limit,require('./routes/authRoutes'));
app.use('/api/citas',require('./routes/citasRoutes'));app.use('/api/usuarios',require('./routes/usuariosRoutes'));app.use('/api/pagos',require('./routes/pagosRoutes'));app.use('/api/caja',require('./routes/cajaRoutes'));
app.get('/api/salud',(req,res)=>res.json({estado:'correcto',mensaje:'API del Hospital Regional del Norte funcionando'}));
app.use((req,res)=>res.status(404).json({mensaje:'Endpoint no encontrado'}));
app.use((e,req,res,next)=>{if(res.headersSent)return next(e);if(e instanceof HttpError)return res.status(e.status).json({mensaje:e.message});if(e.type==='entity.parse.failed')return res.status(400).json({mensaje:'JSON inválido'});if(e.code==='23505'||e.code==='23503')return res.status(409).json({mensaje:'Conflicto con un registro existente'});console.error('Error de API:',e.code||e.name);return res.status(500).json({mensaje:'Error interno del servidor. Revisa el esquema y los registros del backend.'});});
module.exports=app;
