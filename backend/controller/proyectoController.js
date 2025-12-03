'use strict';
const db = requite("../models");
const proyecto = db.proyecto;
const usuario = db.persona;

class proyectoController {

    // LISTAR PROYECTOS POR USUARIO
    async listarProyecto(req, res) {
        try {
            var person = await usuario.findOne({
                where: { external: req.params.external },
            });

            if (!person) {
                return res.status(404).json({ msg: "Usuario no encontrado", code: 404 });
            }

            const listar = await proyecto.findAll({
                attributes: ['nombre', 'descripcion', 'tiempoSprint', 'nroSprints', 'estado'],
                where: { id_usuario: person.id },
            });

        } catch (error) {

        }
    }

    async guardarProyecto(req, res) {

        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({ msg: "DATOS FALTANTES", code: 400, errors: errors.array() });
            }

            // Verificar si external_id está presente
            if (!req.body.external) {
                return res.status(400).json({ msg: "External ID es requerido", code: 400 });
            }

            const person = await usuario.findOne({
                where: { external: req.body.external }
            });

            // Verificar si el usuario existe
            if (!person) {
                return res.status(404).json({ msg: "Usuario no encontrado", code: 404 });
            }

            // Crear datos del proyecto
            const data = {
                nombre: req.body.nombre,
                descripcion: req.body.descripcion,
                nroSprints: req.body.nroSprint,
                tiempoSprint: req.body.tiempoSprint,
            };

            // Iniciar transacción
            let transaction = await models.sequelize.transaction();

            try {
                // Crear el proyecto en la base de datos dentro de la transacción
                await proyecto.create(data, { transaction });

                // Confirmar transacción
                await transaction.commit();
                return res.status(200).json({ msg: "PROYECTO CREADO CON ÉXITO", code: 200 });

            } catch (error) {
                // Revertir transacción en caso de error
                if (transaction) await transaction.rollback();

                console.error("Error al crear el proyecto:", error);
                return res.status(500).json({ msg: "Error al crear el proyecto", code: 500, error: error.message });
            }

        } catch (error) {
            console.error("Error interno en guardar proyecto:", error);
            return res.status(500).json({ msg: "Error interno del servidor", code: 500, error: error.message });
        }
    }

    async modificarProyecto(req, res) {

    }

    async eliminarProyecto(req, res) {

    }

}
module.exports = new proyectoController();