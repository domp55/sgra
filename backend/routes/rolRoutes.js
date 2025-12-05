const express = require("express");
const router = express.Router();
const rol = require("../controller/rolController");
const authAdmin = require("../middleware/authAdmin");

// Listar roles (solo admin)
router.get("/listar", rol.listarroles);

// Registrar rol (solo admin)
router.post("/registrar", rol.registrarRol);

module.exports = router;
