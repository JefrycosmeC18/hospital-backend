const crypto = require('node:crypto');
class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
function fail(status, msg) { throw new HttpError(status, msg); }
const roles = ['cliente','administrador','empleado','cajero'];
const shifts = ['mañana','tarde','noche-madrugada'];
const specialties = ['medicina-general','pediatria','ginecologia','cardiologia','traumatologia','cirugia-general','medicina-interna','odontologia','oftalmologia','psicologia'];
const states = ['registrado','atendido','rechazado','cancelado'];
function id(v) { if (!/^\d{1,18}$/.test(String(v)) || BigInt(v) <= 0n) fail(400,'Identificador inválido'); return String(v); }
function date(v) { if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0,10)!==v) fail(400,'Fecha inválida'); return v; }
function today() { return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
function text(v,min,max,label) { if(typeof v!=='string'||v.trim().length<min||v.trim().length>max) fail(400,`${label} inválido`); return v.trim(); }
function email(v) { const e=text(v,3,254,'Correo').toLowerCase(); if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) fail(400,'Correo inválido'); return e; }
function shift(user, now=new Date()) { if(user.rol==='administrador') return; const h=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'America/Lima',hour:'2-digit',hourCycle:'h23'}).format(now)); if(user.rol!=='empleado'||user.turno!==(h>=6&&h<14?'mañana':h>=14&&h<22?'tarde':'noche-madrugada')) fail(403,'Fuera del turno autorizado'); }
function cita(body={}, {gestion=false, nueva=false}={}) { const b=body||{}; const nombre=text(b.nombre_paciente,4,150,'Nombre'); const dni=String(b.dni??''); if(!/^\d{8}$/.test(dni)) fail(400,'DNI debe tener 8 dígitos'); if(!specialties.includes(b.especialidad)) fail(400,'Especialidad inválida'); const fecha=date(b.fecha_preferida); if(nueva&&fecha<today()) fail(400,'La fecha no puede ser anterior a hoy'); if(gestion&&!states.includes(b.estado)) fail(400,'Estado inválido'); if(!gestion&&typeof b.tiene_sis!=='boolean') fail(400,'Indica si cuenta con SIS'); return {nombre_paciente:nombre,dni,especialidad:b.especialidad,fecha_preferida:fecha,tiene_sis:b.tiene_sis,estado:b.estado}; }
function tarifa(especialidad,sis) { return {tipo:especialidad==='medicina-general'?'general':'especialidad',monto:sis?0:especialidad==='medicina-general'?15:30,estado:sis?'exonerado':'pendiente'}; }
function code(prefix) { return prefix+'-'+crypto.randomBytes(4).toString('hex').toUpperCase(); }
function payable(r) { if(!r) fail(404,'Cita no encontrada'); if(r.estado_pago!=='pendiente'||['rechazado','cancelado'].includes(r.estado)||!Number.isFinite(Number(r.monto_calculado))||Number(r.monto_calculado)<=0) fail(409,'La cita no admite cobro'); return Number(r.monto_calculado); }
function money(v) { if(v===null||v===''||typeof v==='boolean'||!Number.isFinite(Number(v))||Number(v)<0||Number(v)>1000000||!/^\d+(\.\d{1,2})?$/.test(String(v))) fail(400,'Importe inválido'); return Math.round(Number(v)*100)/100; }
module.exports={HttpError,fail,roles,shifts,specialties,states,id,date,today,text,email,shift,cita,tarifa,code,payable,money};
