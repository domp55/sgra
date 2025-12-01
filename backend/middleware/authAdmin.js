// middleware/authAdmin.js
const jwt = require("jsonwebtoken");
const db = require("../models");
const Cuenta = db.cuenta;
const Rol = db.rol;
const authAdmin = async (req, res, next) => {
  try {    console.log("estooooooooooooo empiezaaaaaa     ")

    console.log("estooooooooooooo      ")
    console.log(req)
    const authHeader = req.headers['x-access-token'];
    console.log("Authorization header:", authHeader);

    if (!authHeader) {
      return res.status(401).json({ mensaje: "No autorizado: falta token" });
    }

    const token = authHeader
    console.log("Token recibido:", token);

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.KEY_SQ);
      console.log("Token decodificado:", decoded);
    } catch (err) {
      console.error("Error verificando token:", err.message);
      return res.status(401).json({ mensaje: "Token inválido o expirado" });
    }

    const cuenta = await Cuenta.findOne({
      where: { external: decoded.externalCuenta },
      include: [{ model: Rol, as: "rol" }],
    });

    if (!cuenta) {
      console.log("Cuenta no encontrada para external:", decoded.externalCuenta);
      return res.status(401).json({ mensaje: "Usuario no encontrado" });
    }

    if (!cuenta.rol || cuenta.rol.nombre.toUpperCase() !== "ADMIN") {
      console.log(`Acceso prohibido: usuario rol=${cuenta.rol?.nombre || "Ninguno"}`);
      return res
        .status(403)
        .json({ mensaje: "Acceso prohibido: solo administradores" });
    }

    req.user = {
      id: cuenta.id,
      nombre: `${cuenta.persona?.nombre || ""} ${cuenta.persona?.apellido || ""}`,
      correo: cuenta.correo,
      external: cuenta.external,
      rol: cuenta.rol.nombre,
    };

    console.log("Usuario autorizado como ADMIN:", req.user.nombre);

    next();
  } catch (error) {
    console.error("Error en authAdmin:", error.message);
    return res.status(500).json({ mensaje: "Error interno en autorización" });
  }
};

module.exports = authAdmin;
