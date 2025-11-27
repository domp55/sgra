const router = require('express').Router();
const cuentaController = require('../controller/cuentaController');

router.post('/registro', cuentaController.registrar);

router.put('/aprobar/:external', cuentaController.aprobarCuenta);

router.get('/listarCuentas', cuentaController.listarCuentas);

router.put('/desactivar/:external', cuentaController.desactivarCuenta);

module.exports = router;