// controllers/cuentaController.js

const { where } = require("sequelize");
const db = require("../models");
const Cuenta = db.cuenta;
const Persona = db.persona;
const Colaborador = db.colaborador;
const Rol = db.rol;

const bcrypt = require("bcrypt");

class CuentaController {
  // HU5: Registro de usuarios solicitantes
  async registrar(req, res) {
    const t = await db.sequelize.transaction();

    try {
      const { nombre, apellido, cedula, correo, contrasena } = req.body;

      // Validar correo
      const correoExiste = await Cuenta.findOne({ where: { correo } });
      if (correoExiste) {
        return res.status(400).json({
          mensaje: "El correo ya está registrado."
        });
      }

      // Validar cédula
      const cedulaExiste = await Persona.findOne({ where: { cedula } });
      if (cedulaExiste) {
        return res.status(400).json({
          mensaje: "La cedula ya está registrada en el sistema."
        });
      }

      // Verificar que el rol por defecto (ID = 1) exista
      const rolPorDefecto = await Rol.findByPk(1);
      if (!rolPorDefecto) {
        return res.status(500).json({
          mensaje: "Error: No existe el rol por defecto (ID = 1)."
        });
      }

      // Encriptar contraseña
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(contrasena, salt);

      // Crear Persona
      const nuevaPersona = await Persona.create(
        {
          nombre,
          apellido,
          cedula
        },
        { transaction: t }
      );

      // Crear Cuenta asociada con rol por defecto
      const nuevaCuenta = await Cuenta.create(
        {
          correo,
          contrasena: hash,
          estado: false,
          personaId: nuevaPersona.id,
          rolID: 1,    // ← ASIGNACIÓN DEL ROL POR DEFECTO
          esAdmin: false
        },
        { transaction: t }
      );

      await t.commit();

      res.status(201).json({
        mensaje: "Registro exitoso. Espere aprobación del administrador.",
        cuenta_id: nuevaCuenta.external
      });

    } catch (error) {
      await t.rollback();
      console.log(error);
      res.status(500).json({
        mensaje: "Error al registrar",
        error: error.message
      });
    }
  }


  // HU6: Aprobación de solicitudes
  async aprobarCuenta(req, res) {
    try {
      const { external } = req.params;

      const cuenta = await Cuenta.findOne({ where: { external } });

      if (!cuenta) {
        return res.status(404).json({ mensaje: "Cuenta no encontrada" });
      }

      cuenta.estado = true;
      await cuenta.save();

      res.status(200).json({ mensaje: "Cuenta aprobada exitosamente" });
    } catch (error) {
      res.status(500).json({
        mensaje: "Error al aprobar",
        error: error.message,
      });
    }
  }

  // HU7: Listar cuentas
  async listarCuentasAprobadas(req, res) {
  try {
    const cuentas = await Cuenta.findAll({
      where: { estado: true },
      include: [
        {
          model: Persona,
          as: "persona",
          attributes: ["nombre", "apellido"],
        },
      ],
    });
console.log(cuentas);
    if (!cuentas || cuentas.length === 0) {
      return res.status(404).json({ mensaje: "No hay cuentas registradas" });
    }

    return res.status(200).json(cuentas);
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al listar cuentas",
      error: error.message,
    });
  }
  }

async listarCuentas(req, res) {
  try {
    const cuentas = await Cuenta.findAll({
      attributes: ["correo", "estado", "id", "createdAt"],
      include: [
        {
          model: Persona,
          as: "persona",
          attributes: ["nombre", "apellido", "cedula"]
        },
        {
          model: Rol,
          as: "rol",
          attributes: ["nombre"] // tu modelo usa "nombre"
        }
      ]
    });

    // 🌐 Validación: ¿hay cuentas?
    if (!cuentas || cuentas.length === 0) {
      return res.status(404).json({
        mensaje: "No existen usuarios registrados",
        usuarios: []
      });
    }

    // 🔍 Transformación y validaciones avanzadas
    const usuarios = cuentas
      .map((c) => {
        if (!c.persona) {
          console.warn(`⚠ Cuenta ID ${c.id} sin persona asociada.`);
          return null;
        }

        return {
          nombre: `${c.persona.nombre} ${c.persona.apellido}`,
          cedula: c.persona.cedula,
          correo: c.correo,
          rol: c.rol ? c.rol.nombre : "Sin rol asignado",   // CORREGIDO
          estado: c.estado ? "Activo" : "Inactivo",
          registrado_en: c.createdAt
            ? c.createdAt.toISOString().split("T")[0]
            : "Fecha no disponible"
        };
      })
      .filter((u) => u !== null); // elimino registros corruptos

    // ⚠ Si todas las cuentas fallaron
    if (usuarios.length === 0) {
      return res.status(500).json({
        mensaje:
          "Los usuarios registrados tienen datos inconsistentes. Revisar integridad de datos."
      });
    }

    return res.status(200).json({
      mensaje: "Lista de usuarios obtenida correctamente",
      total: usuarios.length,
      usuarios
    });

  } catch (error) {
    console.error("❌ Error crítico al listar cuentas:", error);
    return res.status(500).json({
      mensaje: "Error interno al listar usuarios",
      error: error.message
    });
  }
}


    
//cuentas para aprobarlas  HU7: Listar cuentas
  async listarCuentasPorAprobar(req, res) {
    try {
      const cuentas = await Cuenta.findAll({
        where: { estado: false },
        include: [
          {
            model: Persona,
            as: "persona",
            attributes: ["nombre", "apellido"],
          },
          {
            model: Colaborador,
            as: "colaborador",
          },
        ],
      });

      if (cuentas.length === 0) {
        return res.status(404).json({ mensaje: "No hay cuentas registradas" });
      }

      const resultado = cuentas.map((c) => {
        const persona = Array.isArray(c.persona) ? c.persona[0] : c.persona;

        return {
          external: c.external,
          correo: c.correo,
          estado: c.estado,
          esAdmin: c.esAdmin,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,

          persona: persona
            ? {
                nombre: persona.nombre,
                apellido: persona.apellido,
              }
            : null,

          colaborador: Array.isArray(c.colaborador)
            ? c.colaborador[0] || null
            : c.colaborador,
        };
      });

      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(500).json({
        mensaje: "Error al listar cuentas",
        error: error.message,
      });
    }
  }

  // HU3: Desactivar usuarios --por parte del admin
  async desactivarCuenta(req, res) {
    try {
      const { external } = req.params;

      const cuenta = await Cuenta.findOne({ where: { external } });

      if (!cuenta) {
        return res.status(404).json({ mensaje: "Cuenta no encontrada" });
      }

      cuenta.estado = false;
      await cuenta.save();

      res.status(200).json({ mensaje: "Cuenta desactivada exitosamente" });
    } catch (error) {
      res.status(500).json({
        mensaje: "Error al desactivar",
        error: error.message,
      });
    }
  }
}

module.exports = new CuentaController();
