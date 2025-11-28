const express = require("express");
const router = express.Router();
const RolController = require("../controller/rolController");
const authAdmin = require("../middleware/authAdmin");

// Listar roles (solo admin)
router.get("/listar", authAdmin, RolController.listarroles);

// Registrar rol (solo admin)
router.post("/registrar", authAdmin, RolController.registrarRol);

module.exports = router;
