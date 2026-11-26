const router=require('express').Router(),c=require('../controllers/usuariosController'),{verificarToken,permitirRoles}=require('../middlewares/authMiddleware');
router.use(verificarToken,permitirRoles('administrador'));router.get('/',c.listar);router.patch('/:id/rol',c.change);module.exports=router;
