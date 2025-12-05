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

router.get(
    '/listarTodos',
    proController.listarProyectoSinAprobar
);
router.get(
    '/listarActivos',
    proController.listarProyectosAprobados
);
// -------------------------
// listar proyectos usuario especifico
// -------------------------
router.get(
    '/listar/:externalCuenta',
    proController.listarProyectoColaborador
);

router.get(
    '/listarProyecto/:external',
    proController.listarProyecto
);

router.patch(
    '/cambiarEstado/:external',
    proController.cambioEstado
)
module.exports = router;
