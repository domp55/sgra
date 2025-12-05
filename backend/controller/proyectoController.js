"use strict";

const { validationResult } = require("express-validator");
const db = require("../models");

const Proyecto = db.proyecto;
const RequisitoMaster = db.requisitomaster;
const Colaborador = db.colaborador;
const Cuenta = db.cuenta;
const Rol = db.rol;
const Persona = db.persona;

class ProyectoController {
<<<<<<< HEAD
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
          "external",
        ],
        include: [
          {
            model: RequisitoMaster,
            attributes: ["id", "external", "idProyecto"],
          },
          {
            model: Colaborador,
            attributes: [
              "rolID",
              "proyectoId",
              "cuentaID",
              "fechaAsignacion",
              "estado",
              "external",
            ],
            include: [
              {
                model: Rol,
                attributes: ["nombre"], // <-- aquí traes el nombre del rol
              },
            ],
          },
        ],
      });

      return res.status(200).json({
        msg: "Lista de proyectos",
        code: 200,
        data: proyectos,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        msg: "Error interno del servidor",
        code: 500,
      });
    }
  }

  // =============================================
  // LISTAR PROYECTOS POR COLABORADOR (EXTERNAL)
  // =============================================
  async listarProyectoColaborador(req, res) {
    try {
      const { externalCuenta } = req.params;

      if (!externalCuenta) {
        return res
          .status(400)
          .json({ code: 400, msg: "Falta el external de la cuenta", data: [] });
      }

      const cuenta = await Cuenta.findOne({
        where: { external: externalCuenta },
      });
      if (!cuenta) {
        return res
          .status(404)
          .json({ code: 404, msg: "Cuenta no encontrada", data: [] });
      }

      const proyectos = await Proyecto.findAll({
        where: { estaActivo: true }, // <-- solo proyectos activos
        include: [
          {
            model: Colaborador,
            where: { cuentaID: cuenta.id },
            include: [{ model: Rol, attributes: ["nombre"] }],
          },
        ],
      });

      return res.status(200).json({
        code: 200,
        msg: proyectos.length ? "Lista de proyectos" : "No tiene proyectos",
        data: proyectos,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        code: 500,
        msg: "Error al listar proyectos por cuenta",
        data: [],
      });
    }
  }

  // =============================================
  // CREAR PROYECTO
  // =============================================
async guardarProyecto(req, res) {
    console.log("--------------- INICIO GUARDAR PROYECTO ---------------");
    
    // 1. Verificar validaciones de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log("Error: Falló la validación inicial", errors.array());
        return res.status(400).json({
            msg: "Datos faltantes o inválidos",
            code: 400,
            errors: errors.array(),
        });
    }

    const {
        nombre, acronimo, descripcion, tiempoSprint, nroSprints,
        fechaInicio, fechaFin, objetivosCalidad, definicionDone,
        criteriosEntradaQA, coberturaPruebasMinima, externalCuenta,
    } = req.body;

    // 2. Loguear datos recibidos (útil para ver si externalCuenta llega bien)
    console.log("Datos recibidos (Body):", req.body);
    console.log("External Cuenta recibido:", externalCuenta);

    const t = await db.sequelize.transaction();
    console.log("--> Transacción iniciada");

    try {
        // 3. Buscar rol
        console.log("--> Buscando rol SCRUM_MASTER...");
        const rolPO = await db.rol.findOne({ where: { nombre: "SCRUM_MASTER" } });
        
        if (!rolPO) {
            console.log("Error: No se encontró el rol SCRUM_MASTER en la BD");
            await t.rollback();
            return res.status(400).json({ msg: "No existe el rol SCRUM_MASTER", code: 400 });
        }
        console.log("--> Rol encontrado ID:", rolPO.id);

        // 4. Buscar cuenta
        console.log(`--> Buscando cuenta con external: ${externalCuenta}...`);
        const cuenta = await db.cuenta.findOne({
            where: { external: externalCuenta },
        });

        if (!cuenta) {
            console.log("Error: No se encontró la cuenta asociada");
            await t.rollback();
            return res.status(400).json({ msg: "No se encontró la cuenta del usuario", code: 400 });
        }
        console.log("--> Cuenta encontrada ID:", cuenta.id);

        // 5. Crear Proyecto
        console.log("--> Intentando crear registro Proyecto...");
        const nuevoProyecto = await db.proyecto.create(
            {
                nombre,
                acronimo: acronimo || null,
                descripcion: descripcion || null,
                tiempoSprint: tiempoSprint || null,
                nroSprints: nroSprints || null,
                fechaInicio: fechaInicio || null,
                fechaFin: fechaFin || null,
                objetivosCalidad: objetivosCalidad || null,
                definicionDone: definicionDone || null,
                criteriosEntradaQA: criteriosEntradaQA || null,
                coberturaPruebasMinima: coberturaPruebasMinima || null,
                estado: "En Planificación",
                estaActivo: false,
            },
            { transaction: t }
        );
        console.log("--> Proyecto creado ID:", nuevoProyecto.id);

        // 6. Crear Requisito Master
        console.log("--> Intentando crear RequisitoMaster...");
        await db.requisitomaster.create(
            { idProyecto: nuevoProyecto.id },
            { transaction: t }
        );
        console.log("--> RequisitoMaster creado.");

        // 7. Crear Colaborador
        console.log("--> Intentando crear Colaborador (Asignación)...");
        // OJO AQUÍ: Verifica si tus columnas en BD son realmente 'cuentaID' o 'cuentaId' (camelCase)
        await db.colaborador.create(
            {
                proyectoId: nuevoProyecto.id,
                cuentaID: cuenta.id,  // <--- Posible error aquí (revisa mayúsculas/minúsculas)
                rolID: rolPO.id,      // <--- Posible error aquí
                fechaAsignacion: new Date(),
                estado: false,
            },
            { transaction: t }
        );
        console.log("--> Colaborador creado.");

        await t.commit();
        console.log("--------------- PROCESO TERMINADO CON ÉXITO ---------------");

        return res.status(201).json({
            msg: "Proyecto solicitado correctamente. Pendiente de aprobación",
            code: 201,
            proyecto: nuevoProyecto,
        });

    } catch (error) {
        await t.rollback();
        console.error("--------------- ERROR CRÍTICO ---------------");
        console.error("Mensaje:", error.message);
        // Si es error de Sequelize, esto nos dirá qué campo falló
        if (error.original) console.error("Error Original SQL:", error.original.sqlMessage);
        if (error.errors) console.error("Detalle Validación:", JSON.stringify(error.errors, null, 2));
        console.error("Stack:", error.stack);
        console.error("---------------------------------------------");

        return res.status(500).json({
            msg: "Error al solicitar el proyecto",
            code: 500,
            error: error.message,
        });
    }
}

  async listarProyectoSinAprobar(req, res) {
    try {
      const proyectos = await Proyecto.findAll({
        attributes: [
          "nombre",
          "acronimo",
          "descripcion",
          "fechaInicio",
          "fechaFin",
          "estado",
          "tiempoSprint",
          "nroSprints",
          "objetivosCalidad",
          "definicionDone",
          "criteriosEntradaQA",
          "coberturaPruebasMinima",
          "estaActivo",
          "external",
        ],
        where: {
          estaActivo: false,
        },
        include: [
          {
            model: RequisitoMaster,
            attributes: ["id", "external", "idProyecto"],
          },
          {
            model: Colaborador,
            attributes: [
              "rolID",
              "proyectoId",
              "cuentaID",
              "fechaAsignacion",
              "estado",
              "external",
            ],
            include: [
              {
                model: Rol,
                attributes: ["nombre"],
              },
              // -------------------------------------------------
              // <--- AQUÍ AGREGAS LA RELACIÓN CON EL MODELO CUENTA
              // -------------------------------------------------
              {
                model: Cuenta,
                attributes: ["correo", "external"],
                include: [
                  {
                    model: Persona,
                    attributes: ["nombre", "apellido"],
                  },
=======
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
                    "external",
>>>>>>> b3c0b5015fcaf9970d0006cfea32bc7107c1c5c4
                ],
                include: [
                    {
                        model: RequisitoMaster,
                        attributes: ["id", "external", "idProyecto"],
                    },
                    {
                        model: Colaborador,
                        attributes: [
                            "rolID",
                            "proyectoId",
                            "cuentaID",
                            "fechaAsignacion",
                            "estado",
                            "external",
                        ],
                        include: [
                            {
                                model: Rol,
                                attributes: ["nombre"], // <-- aquí traes el nombre del rol
                            },
                        ],
                    },
                ],
            });

            return res.status(200).json({
                msg: "Lista de proyectos",
                code: 200,
                data: proyectos,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                msg: "Error interno del servidor",
                code: 500,
            });
        }
    }

<<<<<<< HEAD
  async cambioEstado(req, res) {
    const external = req.params.external;
=======
    // =============================================
    // LISTAR PROYECTOS POR COLABORADOR (EXTERNAL)
    // =============================================
    async listarProyectoColaborador(req, res) {
        try {
            const { externalCuenta } = req.params;
>>>>>>> b3c0b5015fcaf9970d0006cfea32bc7107c1c5c4

            if (!externalCuenta) {
                return res
                    .status(400)
                    .json({ code: 400, msg: "Falta el external de la cuenta", data: [] });
            }

            const cuenta = await Cuenta.findOne({
                where: { external: externalCuenta },
            });
            if (!cuenta) {
                return res
                    .status(404)
                    .json({ code: 404, msg: "Cuenta no encontrada", data: [] });
            }

            const proyectos = await Proyecto.findAll({
                where: { estaActivo: true }, // <-- solo proyectos activos
                include: [
                    {
                        model: Colaborador,
                        where: { cuentaID: cuenta.id },
                        include: [{ model: Rol, attributes: ["nombre"] }],
                    },
                ],
            });

            return res.status(200).json({
                code: 200,
                msg: proyectos.length ? "Lista de proyectos" : "No tiene proyectos",
                data: proyectos,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                code: 500,
                msg: "Error al listar proyectos por cuenta",
                data: [],
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
                errors: errors.array(),
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
            objetivosCalidad,
            definicionDone,
            criteriosEntradaQA,
            coberturaPruebasMinima,
            externalCuenta,
        } = req.body;

        const t = await db.sequelize.transaction();

        try {
            // Buscar rol SCRUM_MASTER
            const rolPO = await db.rol.findOne({ where: { nombre: "SCRUM_MASTER" } });
            if (!rolPO) {
                await t.rollback();
                return res
                    .status(400)
                    .json({ msg: "No existe el rol SCRUM_MASTER", code: 400 });
            }

            // Buscar cuenta del usuario
            const cuenta = await db.cuenta.findOne({
                where: { external: externalCuenta },
            });
            if (!cuenta) {
                await t.rollback();
                return res
                    .status(400)
                    .json({ msg: "No se encontró la cuenta del usuario", code: 400 });
            }

            // Crear proyecto pendiente de aprobación
            const nuevoProyecto = await db.proyecto.create(
                {
                    nombre,
                    acronimo: acronimo || null,
                    descripcion: descripcion || null,
                    tiempoSprint: tiempoSprint || null,
                    nroSprints: nroSprints || null,
                    fechaInicio: fechaInicio || null,
                    fechaFin: fechaFin || null,
                    objetivosCalidad: objetivosCalidad || null,
                    definicionDone: definicionDone || null,
                    criteriosEntradaQA: criteriosEntradaQA || null,
                    coberturaPruebasMinima: coberturaPruebasMinima || null,
                    estado: "En Planificación",
                    estaActivo: false, // proyecto no activo hasta aprobación
                },
                { transaction: t }
            );

            // Crear registro en RequisitoMaster
            await db.requisitomaster.create(
                { idProyecto: nuevoProyecto.id },
                { transaction: t }
            );

            // Asignar al usuario como Scrum master
            await db.colaborador.create(
                {
                    proyectoId: nuevoProyecto.id,
                    cuentaID: cuenta.id,
                    rolID: rolPO.id,
                    fechaAsignacion: new Date(),
                    estado: false,
                },
                { transaction: t }
            );

            await t.commit();

            return res.status(201).json({
                msg: "Proyecto solicitado correctamente. Pendiente de aprobación",
                code: 201,
                proyecto: nuevoProyecto,
            });
        } catch (error) {
            await t.rollback();
            console.error(error);
            return res.status(500).json({
                msg: "Error al solicitar el proyecto",
                code: 500,
                error: error.message,
            });
        }
    }

    async listarProyectoSinAprobar(req, res) {
        try {
            const proyectos = await Proyecto.findAll({
                attributes: [
                    "nombre",
                    "acronimo",
                    "descripcion",
                    "fechaInicio",
                    "fechaFin",
                    "estado",
                    "tiempoSprint",
                    "nroSprints",
                    "objetivosCalidad",
                    "definicionDone",
                    "criteriosEntradaQA",
                    "coberturaPruebasMinima",
                    "estaActivo",
                    "external",
                ],
                where: {
                    estaActivo: false,
                },
                include: [
                    {
                        model: RequisitoMaster,
                        attributes: ["id", "external", "idProyecto"],
                    },
                    {
                        model: Colaborador,
                        attributes: [
                            "rolID",
                            "proyectoId",
                            "cuentaID",
                            "fechaAsignacion",
                            "estado",
                            "external",
                        ],
                        include: [
                            {
                                model: Rol,
                                attributes: ["nombre"],
                            },
                            // -------------------------------------------------
                            // <--- AQUÍ AGREGAS LA RELACIÓN CON EL MODELO CUENTA
                            // -------------------------------------------------
                            {
                                model: Cuenta,
                                attributes: ["correo", "external"],
                                include: [
                                    {
                                        model: Persona,
                                        attributes: ["nombre", "apellido"],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });

            return res.status(200).json({
                msg: "Lista de proyectos",
                code: 200,
                data: proyectos,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                msg: "Error interno del servidor",
                code: 500,
            });
        }
    }

    async listarProyectosAprobados(req, res) {
        try {
            const proyectos = await Proyecto.findAll({
                attributes: [
                    "nombre",
                    "acronimo",
                    "descripcion",
                    "fechaInicio",
                    "fechaFin",
                    "estado",
                    "tiempoSprint",
                    "nroSprints",
                    "objetivosCalidad",
                    "definicionDone",
                    "criteriosEntradaQA",
                    "coberturaPruebasMinima",
                    "estaActivo",
                    "external",
                ],
                where: {
                    estaActivo: true,
                },
                include: [
                    {
                        model: RequisitoMaster,
                        attributes: ["id", "external", "idProyecto"],
                    },
                    {
                        model: Colaborador,
                        attributes: [
                            "rolID",
                            "proyectoId",
                            "cuentaID",
                            "fechaAsignacion",
                            "estado",
                            "external",
                        ],
                        include: [
                            {
                                model: Rol,
                                attributes: ["nombre"],
                            },
                            // -------------------------------------------------
                            // <--- AQUÍ AGREGAS LA RELACIÓN CON EL MODELO CUENTA
                            // -------------------------------------------------
                            {
                                model: Cuenta,
                                attributes: ["correo", "external"],
                                include: [
                                    {
                                        model: Persona,
                                        attributes: ["nombre", "apellido"],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });

            return res.status(200).json({
                msg: "Lista de proyectos",
                code: 200,
                data: proyectos,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                msg: "Error interno del servidor",
                code: 500,
            });
        }
    }

    async cambioEstado(req, res) {
        const external = req.params.external;
        console.log("aaaaaaaaaaaaa");

        console.log(req.params.external);
        try {
            const proyecto = await Proyecto.findOne({
                where: { external: external },
            });
            const colaborador = await Colaborador.findOne({
                where: { proyectoId: proyecto.id },
            });
            console.log(colaborador);
            if (!proyecto) {
                return res.status(404).json({
                    msg: "Proyecto no encontrado",
                });
            }
            if (!colaborador) {
                return res.status(404).json({
                    msg: "Colaborador no encontrado",
                });
            }

            proyecto.estaActivo = true;
            colaborador.estado = true;

            await proyecto.save();
            await colaborador.save();

            return res.status(200).json({
                code: 200,
                msg: "Estado de proyecto actualizado",
            });
        } catch (error) {
            return res.status(500).json({
                msg: "Error al actualizar estado",
                error,
            });
        }
    }

    // =============================================
    // MODIFICAR PROYECTO
    // =============================================
    async modificarProyecto(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                msg: "Datos faltantes o inválidos",
                code: 400,
                errors: errors.array(),
            });
        }

        const {
            externalProyecto,
            nombre,
            acronimo,
            descripcion,
            tiempoSprint,
            nroSprints,
            fechaFin,
            objetivosCalidad,
            definicionDone,
            criteriosEntradaQA,
            coberturaPruebasMinima,
        } = req.body;

        const t = await db.sequelize.transaction();

        try {
            // Buscar el proyecto existente
            const proyecto = await db.proyecto.findOne({ where: { external: externalProyecto } });
            if (!proyecto) {
                await t.rollback();
                return res.status(404).json({ msg: "Proyecto no encontrado", code: 404 });
            }

            // Actualizar los campos que existan en la petición
            await proyecto.update(
                {
                    nombre: nombre ?? proyecto.nombre,
                    acronimo: acronimo ?? proyecto.acronimo,
                    descripcion: descripcion ?? proyecto.descripcion,
                    tiempoSprint: tiempoSprint ?? proyecto.tiempoSprint,
                    nroSprints: nroSprints ?? proyecto.nroSprints,
                    fechaInicio: fechaInicio ?? proyecto.fechaInicio,
                    fechaFin: fechaFin ?? proyecto.fechaFin,
                    objetivosCalidad: objetivosCalidad ?? proyecto.objetivosCalidad,
                    definicionDone: definicionDone ?? proyecto.definicionDone,
                    criteriosEntradaQA: criteriosEntradaQA ?? proyecto.criteriosEntradaQA,
                    coberturaPruebasMinima: coberturaPruebasMinima ?? proyecto.coberturaPruebasMinima,
                    estado: estado ?? proyecto.estado,
                    estaActivo: estaActivo ?? proyecto.estaActivo,
                },
                { transaction: t }
            );

            await t.commit();

            return res.status(200).json({
                msg: "Proyecto actualizado correctamente",
                code: 200,
                proyecto,
            });
        } catch (error) {
            await t.rollback();
            console.error(error);
            return res.status(500).json({
                msg: "Error al actualizar el proyecto",
                code: 500,
                error: error.message,
            });
        }
    }

    async listarProyecto(req, res) {


        const external = req.params.external;
        console.log(req.params.external);
        try {
            const proyectos = await Proyecto.findOne({
                attributes: [
                    "nombre",
                    "acronimo",
                    "descripcion",
                    "fechaInicio",
                    "fechaFin",
                    "estado",
                    "tiempoSprint",
                    "nroSprints",
                    "objetivosCalidad",
                    "definicionDone",
                    "criteriosEntradaQA",
                    "coberturaPruebasMinima",
                    "estaActivo",
                    "external",
                ],
                where: {
                    external: external,
                },
                include: [
                    {
                        model: RequisitoMaster,
                        attributes: ["id", "external", "idProyecto"],
                    },
                    {
                        model: Colaborador,
                        attributes: [
                            "rolID",
                            "proyectoId",
                            "cuentaID",
                            "fechaAsignacion",
                            "estado",
                            "external",
                        ],
                        include: [
                            {
                                model: Rol,
                                attributes: ["nombre"],
                            },
                            // -------------------------------------------------
                            // <--- AQUÍ AGREGAS LA RELACIÓN CON EL MODELO CUENTA
                            // -------------------------------------------------
                            {
                                model: Cuenta,
                                attributes: ["correo", "external"],
                                include: [
                                    {
                                        model: Persona,
                                        attributes: ["nombre", "apellido"],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });

            return res.status(200).json({
                msg: "Proyecto encontrado",
                code: 200,
                data: proyectos,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                msg: "Error interno del servidor",
                code: 500,
            });
        }
    }

}

module.exports = new ProyectoController();
