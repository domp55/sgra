// controllers/cuentaController.js
const Cuenta = require('../models/cuenta');
const Persona = require('../models/persona');
const db = require('../config/configBd'); // Necesitamos esto para la transacción
const bcrypt = require('bcrypt'); // Para encriptar contraseña
const { v4: uuidv4 } = require('uuid');

class CuentaController {

    // HU5: Registro de usuarios solicitantes
    async registrar(req, res) {
        // Iniciamos una transacción (si algo falla, se borra todo)
        const t = await db.transaction();

        try {
            // 1. Obtener datos del frontend (body)
            const { nombre, apellido, cedula, correo, contrasena } = req.body;

            // 2. Encriptar la contraseña (seguridad básica)
            const salt = await bcrypt.genSalt(10);
            const hashContrasena = await bcrypt.hash(contrasena, salt);

            // 3. Crear la Persona primero
            const nuevaPersona = await Persona.create({
                nombre,
                apellido,
                cedula,
                external_id: uuidv4()
            }, { transaction: t }); // ¡Importante pasar la transacción 't'!

            // 4. Crear la Cuenta vinculada a la persona
            const nuevaCuenta = await Cuenta.create({
                correo,
                contrasena: hashContrasena, // Guardamos la encriptada
                estado: false, // Por defecto inactivo hasta que aprueben (HU6)
                personaId: nuevaPersona.id, // Aquí hacemos el vínculo manual
                external_id: uuidv4()
            }, { transaction: t });

            // 5. Si todo salió bien, confirmamos los cambios en la BD
            await t.commit();

            res.status(201).json({
                mensaje: "Registro exitoso. Espere aprobación del administrador.",
                cuenta_id: nuevaCuenta.external_id
            });

        } catch (error) {
            // 6. Si algo falló, deshacemos todo
            await t.rollback();
            console.log(error);
            res.status(500).json({ mensaje: "Error al registrar", error: error.message });
        }
    }

    // HU6: Aprobación de solicitudes
    async aprobarCuenta(req, res) {
        try {
            const { external_id } = req.params; // El ID viene por la URL

            // Buscar la cuenta por su ID externo (es más seguro que usar el ID 1, 2, 3)
            const cuenta = await Cuenta.findOne({ where: { external_id: external_id } });

            if (!cuenta) {
                return res.status(404).json({ mensaje: "Cuenta no encontrada" });
            }

            // Actualizar estado
            cuenta.estado = true;
            await cuenta.save();

            res.status(200).json({ mensaje: "Cuenta aprobada exitosamente" });

        } catch (error) {
            res.status(500).json({ mensaje: "Error al aprobar", error: error.message });
        }
    }
}

module.exports = new CuentaController();