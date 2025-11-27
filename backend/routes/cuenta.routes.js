// routes/cuenta.routes.js
const router = require('express').Router();
const cuentaController = require('../controllers/cuentaController');

router.post('/registro', cuentaController.registrar);

router.put('/aprobar/:external_id', cuentaController.aprobarCuenta);

module.exports = router;