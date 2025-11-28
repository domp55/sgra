const db = require("../models"); 
const rol = db.rol;


class RolController {
    listarroles = async (req, res) => {
        try {
            const roles = await rol.findAll({
                include: [{ all: true }]
            });
            res.status(200).json(roles);
        } catch (error) {

            res.status(500).json({ mensaje: "Error al listar roles", error: error.message });
        }
    };

    registrarRol = async (req, res) => {
        try {
            const { nombreRol } = req.body;                
            const nuevoRol = await rol.create({ nombreRol });
            res.status(201).json({ mensaje: "Rol registrado exitosamente", rol: nuevoRol });
        } catch (error) {
            res.status(500).json({ mensaje: "Error al registrar rol", error: error.message });
        }
    };

    
}
module.exports = new RolController();