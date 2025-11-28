const router = require('express').Router();
const rol = require('../controller/rolcontroller');

router.get('/listarRoles', rol.listarroles);
router.post('/registrarRol', rol.registrarRol);

module.exports = router;