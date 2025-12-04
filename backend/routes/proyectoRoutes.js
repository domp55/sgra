const router = require('express').Router();
const proController = require('../controller/proyectoController'); // importamos la instancia directamente
const { body } = require('express-validator');

// -------------------------
// guardar proyecto
// -------------------------
router.post(
    '/registrar',
    proController.guardarProyecto
);

// -------------------------
// listar proyectos general
// -------------------------
router.get(
    '/listar',
    proController.listarProyecto
);

// -------------------------
// listar proyectos usuario especifico
// -------------------------
router.get(
    '/listar/:externalCuenta',
    proController.listarProyectoColaborador
);

module.exports = router;
