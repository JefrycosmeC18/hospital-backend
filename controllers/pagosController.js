const s=require('../services/pagosService');
exports.pendientes=async(req,res)=>res.json({citas:await s.pendientes(req.query)});
exports.online=async(req,res)=>res.json({pagos:await s.online(req.query)});
exports.summary=async(req,res)=>res.json({resumen:await s.summary(req.query)});
exports.verify=async(req,res)=>res.json({pago:await s.verify(req.usuario,req.params.id)});
exports.receipt=async(req,res)=>res.json({pago:await s.receipt(req.usuario,req.params.op)});
exports.cash=async(req,res)=>res.status(201).json({pago:await s.cash(req.usuario,req.body)});
exports.gateway=async(req,res)=>res.status(201).json({pago:await s.gateway(req.usuario,req.body)});
