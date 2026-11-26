const s=require('../services/usuariosService');
exports.register=async(req,res)=>res.status(201).json({usuario:await s.register(req.body)});
exports.listar=async(req,res)=>res.json({usuarios:await s.listar()});
exports.change=async(req,res)=>res.json({usuario:await s.change(req.usuario,req.params.id,req.body)});
