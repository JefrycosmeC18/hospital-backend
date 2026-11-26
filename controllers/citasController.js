const s=require('../services/citasService');
async function listarCitas(req,res){const datos=await s.listarCitas();res.json({mensaje:'Citas medicas obtenidas correctamente',total:datos.length,datos});}
async function mias(req,res){res.json({citas:await s.mias(req.usuario)});}
async function detail(req,res){res.json({cita:await s.detail(req.usuario,req.params.id)});}
const create=presencial=>async(req,res)=>res.status(201).json({cita:await s.create(req.usuario,req.body,presencial)});
const edit=gestion=>async(req,res)=>res.json({cita:await s.edit(req.usuario,req.params.id,req.body,gestion)});
async function remove(req,res){await s.remove(req.usuario,req.params.id);res.status(204).end();}
module.exports={listarCitas,mias,detail,create,edit,remove};
