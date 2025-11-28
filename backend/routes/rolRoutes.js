const express = require("express");
const router = express.Router();
const rol = require("../controller/rolController");
const authAdmin = require("../middleware/authAdmin");

// Listar roles (solo admin)
router.get("/listar", authAdmin, rol.listarroles);

// Registrar rol (solo admin)
router.post("/registrar", authAdmin, rol.registrarRol);

module.exports = router;
