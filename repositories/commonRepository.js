const pool=require('../config/database');
async function transaction(fn) { const c=await pool.connect(); try { await c.query('BEGIN'); const v=await fn(c); await c.query('COMMIT'); return v; } catch(e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); } }
async function audit(c,u,accion,entidad,id) { await c.query('INSERT INTO hospital_auditoria (id_actor,accion,entidad,id_entidad) VALUES ($1,$2,$3,$4)',[String(u.id),accion,entidad,String(id)]); }
module.exports={pool,transaction,audit};
