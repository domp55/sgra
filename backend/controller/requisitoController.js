const db = require("../models");
const RequisitoMaster = db.requisitomaster;
const Version = db.version;
const Proyecto = db.proyecto; // Para validación de FK

class RequisitoController {

    // HU11: Registrar requisitos (Crea Master y la primera Versión)
    async registrarRequisito(req, res) {
        const t = await db.sequelize.transaction();
        try {
            // AHORA RECIBIMOS 'externalProyecto' EN LUGAR DE 'idProyecto'
            const { externalProyecto, nombre, descripcion, prioridad, tipo } = req.body;
            
            console.log("--> Solicitud nuevo requisito para proyecto external:", externalProyecto);

            // 1. Validaciones
            if (!externalProyecto || !nombre || !descripcion || !prioridad || !tipo) {
                await t.rollback();
                return res.status(400).json({ msg: "Faltan campos obligatorios" });
            }

            // 2. BUSCAR EL PROYECTO POR SU EXTERNAL (UUID)
            const proyectoEncontrado = await db.proyecto.findOne({ 
                where: { external: externalProyecto } 
            });
            
            if (!proyectoEncontrado) {
                await t.rollback();
                return res.status(404).json({ msg: "Proyecto no encontrado" });
            }

            // 3. Crear RequisitoMaster (Usamos el ID interno que acabamos de encontrar)
            // El Master es el contenedor principal del requisito.
            const nuevoMaster = await db.requisitomaster.create({
                idProyecto: proyectoEncontrado.id // <-- Aquí usamos el ID interno seguro
            }, { transaction: t });

            // 4. Crear Versión (Igual que antes)
            // La versión contiene los detalles.
            const nuevaVersion = await db.version.create({
                nombre: nombre.trim(),
                descripcion: descripcion.trim(),
                prioridad: prioridad,
                tipo: tipo,
                version: 1,
                estado: 1,
                idMaster: nuevoMaster.id 
            }, { transaction: t });

            await t.commit();
            
            // =========================================================
            // 5. MODIFICACIÓN: Devolver el objeto creado (Master + Versión)
            // Se recomienda usar 201 Created para la creación, pero mantendré 200.
            // =========================================================
            return res.status(200).json({ 
                msg: "Requisito registrado exitosamente",
                requisito: {
                    idMaster: nuevoMaster.id,
                    nombre: nuevaVersion.nombre,
                    descripcion: nuevaVersion.descripcion,
                    prioridad: nuevaVersion.prioridad,
                    tipo: nuevaVersion.tipo,
                    version: nuevaVersion.version,
                    // Puedes agregar el external si lo tienes en el modelo Master
                    // external: nuevoMaster.external // <--- si existe este campo
                }
            });

        } catch (error) {
            await t.rollback();
            console.error(error);
            return res.status(500).json({ msg: "Error interno", error: error.message });
        }
    }

    // HU14: Visualizar requisitos (Lista la última versión de cada uno)
    listarRequisitos = async (req, res) => {
        try {
            const { externalProyecto } = req.params;
            // 1. Buscar el Proyecto por su external
            const proyecto = await Proyecto.findOne({ where: { external: externalProyecto } });
            if (!proyecto) {    
                return res.status(404).json({ mensaje: "Proyecto no encontrado." });
            }
            // 2. Buscar todos los RequisitoMaster asociados al proyecto
            const masters = await RequisitoMaster.findAll({ where: { idProyecto: proyecto.id } });
            const requisitos = [];
            // 3. Para cada Master, obtener la última versión
            for (const master of masters) {
                const ultimaVersion = await Version.findOne({
                    where: { idMaster: master.id },
                    order: [['version', 'DESC']]
                });
                if (ultimaVersion) {
                    requisitos.push({
                        externalMaster: master.external,
                        nombre: ultimaVersion.nombre,
                        descripcion: ultimaVersion.descripcion,
                        prioridad: ultimaVersion.prioridad,
                        tipo: ultimaVersion.tipo,
                        version: ultimaVersion.version,
                        estado: ultimaVersion.estado
                    });
                }
            }
            res.status(200).json({ requisitos });
        } catch (error) {
            console.error("Error al listar requisitos:", error);
            res.status(500).json({ mensaje: "Error al listar requisitos", error: error.message });
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
                include: [{ model: Version, as: 'versions', attributes: ['version'] }]
            });

            if (!master) {
                await t.rollback();
                return res.status(404).json({ mensaje: "Requisito Maestro no encontrado." });
            }

            // 2. Determinar la nueva versión
            const versiones = master.versions.map(v => v.version);
            const ultimaVersion = versiones.length > 0 ? Math.max(...versiones) : 0;
            const nuevaVersionNumero = ultimaVersion + 1;

            // 3. Crear la nueva entrada en la tabla Version
            const nuevaVersion = await Version.create({
                nombre: nombre ? nombre.trim() : ultimaVersion.nombre,
                descripcion: descripcion ? descripcion.trim() : ultimaVersion.descripcion,
                prioridad: prioridad ? prioridad.trim() : ultimaVersion.prioridad,
                tipo: tipo ? tipo.trim() : ultimaVersion.tipo,
                version: nuevaVersionNumero,
                idMaster: master.id 
            }, { transaction: t });

            await t.commit();

            res.status(200).json({
                mensaje: "Requisito modificado exitosamente. Nueva versión creada.",
                version: nuevaVersionNumero,
                externalVersion: nuevaVersion.external
            });

        } catch (error) {
            await t.rollback();
            console.error("Error al modificar requisito:", error);
            res.status(500).json({ mensaje: "Error al modificar requisito", error: error.message });
        }
    };

  // HU13: Eliminar requisitos (Eliminación lógica de todo el Master)
  eliminarRequisito = async (req, res) => {
    const t = await db.sequelize.transaction();

    try {
      const { externalMaster } = req.params;

      // Buscar master
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

      // Obtener versiones asociadas
      const versiones = await Version.findAll({
        where: { idMaster: master.id },
        include: [
          {
            model: HistoriaUsuario,
            include: [CondicionAceptacion],
          },
        ],
        transaction: t,
      });

      // Si no tiene versiones, solo eliminar master
      if (versiones.length === 0) {
        await master.update({ estado: false }, { transaction: t });

        await t.commit();
        return res.status(200).json({
          msg: `Requisito Maestro eliminado (sin versiones asociadas).`,
          external: master.external,
        });
      }

      // VALIDAR ESTADOS DE HU
      for (const version of versiones) {
        for (const hu of version.historiaUsuarios) {
          // Si la HU NO está en los estados permitidos
          if (hu.estado !== "sin asignar sprint" && hu.estado !== "por hacer") {
            await t.rollback();
            return res.status(400).json({
        msg: `No se puede eliminar porque la HU ${hu.codigo} de la versión ${version.nombre} está en estado ${hu.estado}.`,
              detalle:
                "Solo se permite eliminar si las HU están en 'sin asignar sprint' o 'por hacer'.",
            });
          }
        }
      }

      //  SI TODO ES VÁLIDO → PROCEDER A ELIMINAR LÓGICO

      // 1. Dar de baja HU + condiciones
      for (const version of versiones) {
        for (const hu of version.historiaUsuarios) {
          await hu.update({ estaActiva: false }, { transaction: t });

          // Dar baja condiciones
          for (const ca of hu.condicionAceptacions) {
            await ca.update({ estado: false }, { transaction: t });
          }
        }
      }

      // 2. Dar de baja las versiones
      await Version.update(
        { estado: false },
        { where: { idMaster: master.id }, transaction: t }
      );

      // 3. Dar de baja el Master
      await master.update({ estado: false }, { transaction: t });

      await t.commit();

      return res.status(200).json({
        mensaje: `Requisito Maestro eliminado correctamente junto con versiones, HU y condiciones.`,
        external: master.external,
        code: 200,
      });
    } catch (error) {
      await t.rollback();
      console.error("Error al eliminar requisito (Lógico):", error);
      res.status(500).json({
        mensaje: "Error al eliminar requisito",
        error: error.message,
      });
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