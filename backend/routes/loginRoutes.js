const router = require('express').Router();
const LoginController = require('../controller/loginController');
const { body } = require('express-validator');

const loginController = new LoginController();

// Iniciar sesión
router.post('/cuenta/sesion', [
    body('correo', 'Ingrese un correo').trim().exists().notEmpty(),
    body('contrasena', 'Ingrese una clave').trim().exists().notEmpty(),
], loginController.sesion);

// Registrar admin
router.post('/admin/registrar', loginController.registrarAdmin);

// Registrar admin
router.put('/admin/restablecer', loginController.restablecerContraseña);



module.exports = router;
