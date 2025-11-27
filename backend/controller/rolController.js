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

    
}
module.exports = new RolController();