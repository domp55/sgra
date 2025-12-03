const db = require("../models");
const rol = db.rol;
const {
    where
} = require("sequelize");

class RolController {

    // 1. Listar todos los roles
    listarroles = async (req, res) => {
        try {
            // Incluimos todas las asociaciones (Colaboradores)
            const roles = await rol.findAll({
                include: [{
                    all: true
                }]
            });
            res.status(200).json(roles);
        } catch (error) {
            res.status(500).json({
                mensaje: "Error al listar roles",
                error: error.message
            });
        }
    };

    // 2. Registrar un nuevo rol
    registrarRol = async (req, res) => {
        try {
            const {
                nombreRol
            } = req.body;

            if (!nombreRol || nombreRol.trim() === "") {
                return res.status(400).json({
                    mensaje: "El nombre del rol es obligatorio",
                });
            }

            const nombreNormalizado = nombreRol.trim().toUpperCase();

            // Validar que no exista un rol con el mismo nombre
            const rolExistente = await rol.findOne({
                where: {
                    nombre: nombreNormalizado
                }
            });

            if (rolExistente) {
                return res.status(409).json({
                    mensaje: `El rol "${nombreRol}" ya existe`,
                });
            }

            // Crear el rol
            const nuevoRol = await rol.create({
                nombre: nombreNormalizado
            });

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

    // 3. Obtener un rol por su external (UUID)
    obtenerRol = async (req, res) => {
        try {
            const external = req.params.external;

            const rolEncontrado = await rol.findOne({
                where: {
                    external: external
                },
                include: [{
                    all: true
                }]
            });

            if (!rolEncontrado) {
                return res.status(404).json({
                    mensaje: "Rol no encontrado"
                });
            }

            res.status(200).json(rolEncontrado);
        } catch (error) {
            res.status(500).json({
                mensaje: "Error al obtener rol",
                error: error.message
            });
        }
    };

    // 4. Modificar un rol (solo el nombre en este caso)
    modificarRol = async (req, res) => {
        try {
            const external = req.params.external;
            const {
                nombreRol
            } = req.body;

            // 1. Validación de entrada
            if (!nombreRol || nombreRol.trim() === "") {
                return res.status(400).json({
                    mensaje: "El nuevo nombre del rol es obligatorio",
                });
            }
            const nombreNormalizado = nombreRol.trim().toUpperCase();

            // 2. Buscar el rol por external
            const rolAActualizar = await rol.findOne({
                where: {
                    external: external
                }
            });

            if (!rolAActualizar) {
                return res.status(404).json({
                    mensaje: "Rol no encontrado para actualizar"
                });
            }

            // 3. Validar si el nuevo nombre ya existe en otro rol
            if (rolAActualizar.nombre !== nombreNormalizado) {
                const rolExistente = await rol.findOne({
                    where: {
                        nombre: nombreNormalizado
                    }
                });

                if (rolExistente) {
                    return res.status(409).json({
                        mensaje: `El rol "${nombreRol}" ya existe en otro registro`,
                    });
                }
            }

            // 4. Actualizar el rol
            rolAActualizar.nombre = nombreNormalizado;
            await rolAActualizar.save();

            res.status(200).json({
                mensaje: "Rol modificado exitosamente",
                rol: {
                    id: rolAActualizar.id,
                    nombre: rolAActualizar.nombre,
                    estado: rolAActualizar.estado,
                    external: rolAActualizar.external,
                },
            });

        } catch (error) {
            console.error("Error al modificar rol:", error);
            res.status(500).json({
                mensaje: "Error al modificar rol",
                error: error.message,
            });
        }
    };

    // 5. Cambiar el estado (Activar/Desactivar)
    cambiarEstado = async (req, res) => {
        try {
            const external = req.params.external;
            const rolACambiarEstado = await rol.findOne({
                where: {
                    external: external
                }
            });

            if (!rolACambiarEstado) {
                return res.status(404).json({
                    mensaje: "Rol no encontrado"
                });
            }

            // Cambiar el estado
            rolACambiarEstado.estado = !rolACambiarEstado.estado;
            await rolACambiarEstado.save();

            res.status(200).json({
                mensaje: `Rol ${rolACambiarEstado.estado ? 'activado' : 'desactivado'} exitosamente`,
                rol: {
                    nombre: rolACambiarEstado.nombre,
                    estado: rolACambiarEstado.estado,
                    external: rolACambiarEstado.external,
                },
            });

        } catch (error) {
            console.error("Error al cambiar estado del rol:", error);
            res.status(500).json({
                mensaje: "Error al cambiar estado del rol",
                error: error.message,
            });
        }
    };
}

module.exports = new RolController();