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
// listar proyecto
// -------------------------
router.get(
    '/listar',
    proController.listarProyecto
);



module.exports = router;
