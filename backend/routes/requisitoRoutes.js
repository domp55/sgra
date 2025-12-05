const router = require('express').Router();
const req = require('../controller/requisitoController'); 
const { body } = require('express-validator');

// -------------------------
// guardar requisito
// -------------------------
router.post( '/registrar', req.registrarRequisito );
router.get('/listar/:externalProyecto', req.listarRequisitos);

module.exports = router;