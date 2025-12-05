const router = require('express').Router();
const versionController = require('../controller/versionController');
const authAdmin = require("../middleware/authAdmin");
const RequisitoController = require('../controller/requisitoController');

router.get('/listarVersiones', RequisitoController.listarRequisitosPorProyecto);


module.exports = router;