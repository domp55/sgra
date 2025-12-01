const router = require('express').Router();
const cuentaController = require('../controller/cuentaController');
const authAdmin = require("../middleware/authAdmin");

router.post('/registro', cuentaController.registrar);

router.patch('/aprobar/:external', cuentaController.aprobarCuenta);
router.patch('/eliminar/:external', cuentaController.rechazarPeticion);

//router.get('/listarCuentas', cuentaController.listarCuentas);
router.get('/listarCuentasPorAprobar', cuentaController.listarCuentasPorAprobar);

router.get('/listarCuentasAprobadas',authAdmin, cuentaController.listarCuentasAprobadas);

router.patch('/desactivar/:external', cuentaController.desactivarCuenta);

router.get('/listarCuentas', cuentaController.listarCuentas);

router.patch('/cambiarEstado/:external', cuentaController.cambiarEstadoCuenta);
 

module.exports = router;