const router = require('express').Router();
const colaboradorController = require('../controller/colaboradorController');

router.get('/listarColaboradores', colaboradorController.listarColaboradores);

module.exports = router;