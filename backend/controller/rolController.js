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

        if (!nombreRol || nombreRol.trim() === "") {
        return res.status(400).json({
            mensaje: "El nombre del rol es obligatorio",
        });
        }

        // Validar que no exista un rol con el mismo nombre
        const rolExistente = await rol.findOne({
        where: { nombre: nombreRol.trim().toUpperCase() } // Normalizamos a mayúsculas
        });

        if (rolExistente) {
        return res.status(409).json({
            mensaje: `El rol "${nombreRol}" ya existe`,
        });
        }

        // Crear el rol en la base de datos
        const nuevoRol = await rol.create({ nombre: nombreRol.trim() });

        res.status(201).json({
        mensaje: "Rol registrado exitosamente",
        rol: {
            id: nuevoRol.id,
            nombre: nuevoRol.nombre,
            estado: nuevoRol.estado,
            external: nuevoRol.external,
        },
        });
    } catch (error) {
        console.error("Error al registrar rol:", error);
        res.status(500).json({
        mensaje: "Error al registrar rol",
        error: error.message,
        });
    }
    };



    
}
module.exports = new RolController();