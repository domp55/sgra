const { where } = require("sequelize");
const db = require("../models");
const RequisitoMaster = db.requisitomaster;
const Version = db.version;
const Proyecto = db.proyecto; // Para validación de FK

class RequisitoController {
  // HU11: Registrar requisitos (Crea Master y la primera Versión)
  registrarRequisito = async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
      const { idProyecto, nombre, descripcion, prioridad, tipo } = req.body;

      // 1. Validaciones
      if (!idProyecto || !nombre || !descripcion || !prioridad || !tipo) {
        await t.rollback();
        return res
          .status(400)
          .json({ mensaje: "Faltan campos obligatorios para el requisito." });
      }

      // 1.1. Validar que el Proyecto exista
      const proyectoExiste = await Proyecto.findByPk(idProyecto);
      if (!proyectoExiste) {
        await t.rollback();
        return res
          .status(404)
          .json({ mensaje: `Proyecto con ID ${idProyecto} no encontrado.` });
      }

      // Se asume que el nombre del requisito debe ser único dentro del proyecto
      // Se salta esta validación para simplificar, ya que la unicidad recae en la HU.

      // 2. Crear RequisitoMaster (Contenedor)
      const nuevoMaster = await RequisitoMaster.create(
        {
          idProyecto: idProyecto,
        },
        { transaction: t }
      );

      // 3. Crear la Versión Inicial (La versión 1 del requisito)
      const nuevaVersion = await Version.create(
        {
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          prioridad: prioridad.trim(),
          tipo: tipo.trim(),
          version: 1,
          idMaster: nuevoMaster.id,
        },
        { transaction: t }
      );

      await t.commit();

      res.status(201).json({
        mensaje: "Requisito registrado exitosamente con Versión 1.",
        requisito: {
          externalMaster: nuevoMaster.external,
          nombre: nuevaVersion.nombre,
          version: nuevaVersion.version,
        },
      });
    } catch (error) {
      await t.rollback();
      console.error("Error al registrar requisito:", error);
      res.status(500).json({
        mensaje: "Error al registrar requisito",
        error: error.message,
      });
    }
  };

  // HU12: Editar requisitos (Crea una nueva Versión)
  modificarRequisito = async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
      const { externalMaster } = req.params;
      const { nombre, descripcion, prioridad, tipo } = req.body;

      // 1. Buscar el RequisitoMaster
      const master = await RequisitoMaster.findOne({
        where: { external: externalMaster },
        include: [{ model: Version, as: "versions", attributes: ["version"] }],
      });

      if (!master) {
        await t.rollback();
        return res
          .status(404)
          .json({ mensaje: "Requisito Maestro no encontrado." });
      }

      // 2. Determinar la nueva versión
      const versiones = master.versions.map((v) => v.version);
      const ultimaVersion = versiones.length > 0 ? Math.max(...versiones) : 0;
      const nuevaVersionNumero = ultimaVersion + 1;

      // 3. Crear la nueva entrada en la tabla Version
      const nuevaVersion = await Version.create(
        {
          nombre: nombre ? nombre.trim() : ultimaVersion.nombre,
          descripcion: descripcion
            ? descripcion.trim()
            : ultimaVersion.descripcion,
          prioridad: prioridad ? prioridad.trim() : ultimaVersion.prioridad,
          tipo: tipo ? tipo.trim() : ultimaVersion.tipo,
          version: nuevaVersionNumero,
          idMaster: master.id,
        },
        { transaction: t }
      );

      await t.commit();

      res.status(200).json({
        mensaje: "Requisito modificado exitosamente. Nueva versión creada.",
        version: nuevaVersionNumero,
        externalVersion: nuevaVersion.external,
      });
    } catch (error) {
      await t.rollback();
      console.error("Error al modificar requisito:", error);
      res.status(500).json({
        mensaje: "Error al modificar requisito",
        error: error.message,
      });
    }
  };

  // HU13: Eliminar requisitos (Eliminación lógica de todo el Master)
  eliminarRequisito = async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
      const { externalMaster } = req.params;

      const master = await RequisitoMaster.findOne({
        where: { external: externalMaster },
        transaction: t,
      });

      if (!master) {
        await t.rollback();
        return res
          .status(404)
          .json({ mensaje: "Requisito Maestro no encontrado." });
      }

      await master.update({ estado: false }, { transaction: t });

      const [numAffectedRows] = await Version.update(
        { estado: false },
        {
          where: { idMaster: master.id },
          transaction: t,
        }
      );
      await t.commit();

      return res.status(200).json({
        mensaje: `Requisito Maestro y sus ${numAffectedRows} versiones asociadas han sido eliminados lógicamente (estado = false).`,
        external: master.external,
        code: 200,
      });
    } catch (error) {
      // 6. Si algo falla, revertir todos los cambios.
      await t.rollback();
      console.error("Error al eliminar requisito (Lógico):", error);
      res
        .status(500)
        .json({ mensaje: "Error al eliminar requisito", error: error.message });
    }
  };

  // HU14: Visualizar requisitos (Lista la última versión de cada uno)
  listarRequisitosPorProyecto = async (req, res) => {
    try {
      const { externalProyecto } = req.params;

      // 1. Buscar el proyecto para obtener su ID interno
      const proyecto = await Proyecto.findOne({
        where: { external: externalProyecto },
      });
      if (!proyecto) {
        return res.status(404).json({ mensaje: "Proyecto no encontrado." });
      }
      const idProyecto = proyecto.id;

      // 2. Buscar todos los RequisitoMaster de ese proyecto y todas sus versiones
      const requisitosMaster = await RequisitoMaster.findAll({
        where: { idProyecto: idProyecto, estado: true },
        include: [
          {
            model: Version,
            as: "versions", // Asumimos alias 'versions'
            attributes: [
              "nombre",
              "descripcion",
              "prioridad",
              "tipo",
              "estado",
              "version",
              "external",
              "createdAt",
            ],
          },
        ],
        // Importante: Ordenar las versiones de mayor a menor para que la versión actual sea la primera
        order: [[{ model: Version, as: "versions" }, "version", "DESC"]],
      });

      if (!requisitosMaster || requisitosMaster.length === 0) {
        return res.status(200).json({
          mensaje: "No hay requisitos registrados para este proyecto.",
          requisitos: [],
        });
      }

      // 3. Mapear y obtener la versión actual y el array de versiones anteriores
      const requisitosConTodasLasVersiones = requisitosMaster.map((master) => {
        // Las versiones ya están ordenadas de DESC (la primera es la actual)
        const versiones = master.versions.map((v) => ({
          nombre: v.nombre,
          descripcion: v.descripcion,
          prioridad: v.prioridad,
          tipo: v.tipo,
          estado: v.estado,
          version: v.version,
          external: v.external,
          createdAt: v.createdAt,
        }));

        // Desestructurar: [0] es la versión actual, el resto es 'versionesAnteriores'
        const [versionActual, ...versionesAnteriores] = versiones;

        return {
          externalMaster: master.external,
          idProyecto: master.idProyecto,
          fechaCreacionMaster: master.createdAt,
          // **Nuevo formato solicitado**
          versionActual: versionActual || null, // La versión más reciente
          versionesAnteriores: versionesAnteriores, // El resto de versiones
        };
      });

      res.status(200).json({
        mensaje: "Requisitos listados exitosamente con historial de versiones.",
        requisitos: requisitosConTodasLasVersiones,
      });
    } catch (error) {
      console.error("Error al listar requisitos:", error);
      res
        .status(500)
        .json({ mensaje: "Error al listar requisitos", error: error.message });
    }
  };
}

module.exports = new RequisitoController();
