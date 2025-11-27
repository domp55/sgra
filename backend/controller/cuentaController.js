// controllers/cuentaController.js

const db = require("../models"); // <- ESTE ES EL IMPORT CORRECTO
const Cuenta = db.cuenta;
const Persona = db.persona;
const Colaborador = db.colaborador;

const bcrypt = require("bcrypt");

class CuentaController {
    
    // HU5: Registro de usuarios solicitantes
    async registrar(req, res) {
        const t = await db.sequelize.transaction(); // Transacción correcta

        try {
            const { nombre, apellido, cedula, correo, contrasena } = req.body;

            // Encriptar contraseña
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(contrasena, salt);

            // Crear persona
            const nuevaPersona = await Persona.create({
                nombre,
                apellido,
                cedula
            }, { transaction: t });

            // Crear cuenta asociada
            const nuevaCuenta = await Cuenta.create({
                correo,
                contrasena: hash,   // Tu modelo usa "contraseña" con Ñ
                estado: false,
                personaId: nuevaPersona.id,
                esAdmin: false
            }, { transaction: t });

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
                error: error.message
            });
        }
    }

    // HU7: Listar cuentas
    async listarCuentas(req, res) {
        try {
            const cuentas = await Cuenta.findAll({
                include: [
                    { model: Persona, as: "persona" },
                    { model: Colaborador, as: "colaborador" }
                ]
            });

            if (cuentas.length === 0) {
                return res.status(404).json({ mensaje: "No hay cuentas registradas" });
            }

            res.status(200).json(cuentas);

        } catch (error) {
            res.status(500).json({
                mensaje: "Error al listar cuentas",
                error: error.message
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
                error: error.message
            });
        }
    }
}

module.exports = new CuentaController();
