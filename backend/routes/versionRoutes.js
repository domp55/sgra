const router = require('express').Router();
const versionController = require('../controller/versionController');
const authAdmin = require("../middleware/authAdmin");
const RequisitoController = require('../controller/requisitoController');

router.get('/listarVersiones/:externalProyecto', RequisitoController.listarRequisitosPorProyecto);
router.patch('/eliminarRequisito/:externalMaster', RequisitoController.eliminarRequisito);


module.exports = router;