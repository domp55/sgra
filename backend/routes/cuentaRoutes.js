const router = require('express').Router();
const cuentaController = require('../controller/cuentaController');

router.post('/registro', cuentaController.registrar);

router.patch('/aprobar/:external', cuentaController.aprobarCuenta);

//router.get('/listarCuentas', cuentaController.listarCuentas);
router.get('/listarCuentasPorAprobar', cuentaController.listarCuentasPorAprobar);

router.get('/listarCuentasAprobadas', cuentaController.listarCuentasAprobadas);

router.patch('/desactivar/:external', cuentaController.desactivarCuenta);

router.get('/listarCuentas', cuentaController.listarCuentas);

router.patch('/cambiarEstado/:external', cuentaController.cambiarEstadoCuenta);
 

module.exports = router;