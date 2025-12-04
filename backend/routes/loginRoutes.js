const router = require('express').Router();
const loginController = require('../controller/loginController'); // importamos la instancia directamente
const { body } = require('express-validator');

// -------------------------
// Iniciar sesión
// -------------------------
router.post(
    '/cuenta/sesion',
    [
        body('correo', 'Ingrese un correo').trim().exists().notEmpty(),
        body('contrasena', 'Ingrese una clave').trim().exists().notEmpty(),
    ],
    loginController.sesion
);

// -------------------------
// Registrar admin
// -------------------------
router.post(
    '/admin/registrar',
    [
        body('nombre', 'Ingrese un nombre').trim().exists().notEmpty(),
        body('apellido', 'Ingrese un apellido').trim().exists().notEmpty(),
        body('cedula', 'Ingrese una cédula').trim().exists().notEmpty(),
        body('correo', 'Ingrese un correo').trim().exists().notEmpty(),
        body('contrasena', 'Ingrese una contraseña').trim().exists().notEmpty(),
    ],
    loginController.registrarAdmin
);

// Registrar admin
router.put('/admin/restablecer', loginController.restablecerContrasena);



module.exports = router;
