'use strict';

const { validationResult } = require("express-validator");
const db = require("../models");

const Proyecto = db.proyecto;
const RequisitoMaster = db.requisitomaster;
const Colaborador = db.colaborador;
const Rol = db.rol;

class ProyectoController {

    // =============================================
    // LISTAR TODOS LOS PROYECTOS
    // =============================================
    async listarProyecto(req, res) {
        try {
            const proyectos = await Proyecto.findAll({
                attributes: [
                    "nombre",
                    "acronimo",
                    "descripcion",
                    "tiempoSprint",
                    "nroSprints",
                    "fechaInicio",
                    "fechaFin",
                    "estado",
                    "estaActivo",
                    "external"
                ],
                include: [
                    {
                        model: RequisitoMaster,
                        attributes: ["id", "external", "idProyecto"]
                    },
                    {
                        model: Colaborador,
                        attributes: [
                            "rolID",
                            "proyectoId",
                            "cuentaID",
                            "fechaAsignacion",
                            "estado",
                            "external"
                        ], include: [
                            {
                                model: Rol,
                                attributes: ["nombre"]  // <-- aquí traes el nombre del rol
                            }
                        ]
                    }
                ]
            });

            return res.status(200).json({
                msg: "Lista de proyectos",
                code: 200,
                data: proyectos
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                msg: "Error interno del servidor",
                code: 500
            });
        }
    }


    // =============================================
    // CREAR PROYECTO
    // =============================================
    async guardarProyecto(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                msg: "Datos faltantes o inválidos",
                code: 400,
                errors: errors.array()
            });
        }

        const {
            nombre,
            acronimo,
            descripcion,
            tiempoSprint,
            nroSprints,
            fechaInicio,
            fechaFin,
            externalCuenta
        } = req.body;

        const t = await db.sequelize.transaction();

        try {
            // A) Buscar el rol PRODUCT_OWNER
            const rolPO = await db.rol.findOne({
                where: { nombre: "PRODUCT_OWNER" }
            });

            if (!rolPO) {
                await t.rollback();
                return res.status(400).json({
                    msg: "No existe el rol PRODUCT_OWNER en la BD",
                    code: 400
                });
            }

            const cuenta = await db.cuenta.findOne({
                where: { external: externalCuenta }
            });

            if (!cuenta) {
                await t.rollback();
                return res.status(400).json({
                    msg: "No se encontró la cuenta del usuario",
                    code: 400
                });
            }

            // B) Crear el proyecto según el modelo
            const nuevoProyecto = await db.proyecto.create({
                nombre,
                acronimo: acronimo || null,
                descripcion: descripcion || null,
                tiempoSprint: tiempoSprint || null,
                nroSprints: nroSprints || null,
                fechaInicio: fechaInicio || null,
                fechaFin: fechaFin || null,
                estado: "En Planificación",     // default
                estaActivo: true                 // default
            }, { transaction: t });

            // C) Crear registro en RequisitoMaster
            await db.requisitomaster.create({
                idProyecto: nuevoProyecto.id
            }, { transaction: t });

            // D) Asignar el usuario como Product Owner
            await db.colaborador.create({
                proyectoId: nuevoProyecto.id,
                cuentaID: cuenta.id,
                rolID: rolPO.id,
                fechaAsignacion: new Date(),
                estado: true
            }, { transaction: t });

            await t.commit();

            return res.status(201).json({
                msg: "Proyecto creado correctamente",
                code: 201,
                proyecto: nuevoProyecto
            });

        } catch (error) {
            await t.rollback();
            console.error(error);

            return res.status(500).json({
                msg: "Error al crear el proyecto",
                code: 500,
                error: error.message
            });
        }
    }
}

module.exports = new ProyectoController();
