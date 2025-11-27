const router = require('express').Router();
const cuentaController = require('../controller/cuentaController');

router.post('/registro', cuentaController.registrar);

router.put('/aprobar/:external', cuentaController.aprobarCuenta);

module.exports = router;