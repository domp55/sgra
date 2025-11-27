const router = require('express').Router();
const rol = require('../controller/rolcontroller');

router.get('/listarRoles', rol.listarroles);

module.exports = router;