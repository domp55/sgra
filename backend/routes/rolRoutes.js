const router = require('express').Router();
const rol = require('../controller/rolController');

router.get('/listarRoles', rol.listarroles);
router.post('/registrarRol', rol.registrarRol);

module.exports = router;