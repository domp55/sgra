'use strict';
const { validationResult } = require('express-validator');
const models = require('../models');
const usuario = models.persona;
const Cuenta = models.cuenta;
const Persona = models.persona;
const Colaborador = models.colaborador;
const Rol = models.rol;
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

require('dotenv').config(); // cargar variables de entorno

class LoginController {

    // -------------------------
    // Iniciar sesión
    // -------------------------
    async sesion(req, res) {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                msg: "Datos faltantes o inválidos",
                code: 400,
                errors: errors.array()
            });
        }

        const { correo, contrasena } = req.body;

        try {
            // 1. Buscar cuenta
            const login = await Cuenta.findOne({
                where: { correo },
                include: [
                    {
                        model: Persona,
                        as: 'persona',
                        attributes: ['nombre', 'apellido', 'external']
                    }
                ]
            });

            if (!login) {
                return res.status(400).json({ msg: "CREDENCIALES INVALIDAS", code: 400 });
            }

            // 2. Validación de estado
            if (!login.estado) {
                return res.status(403).json({ msg: "USUARIO NO SE ENCUENTRA ACTIVO", code: 403 });
            }

            // 3. Validación de contraseña
            const claveCorrecta = bcrypt.compareSync(contrasena, login.contrasena);
            if (!claveCorrecta) {
                return res.status(400).json({ msg: "CREDENCIALES INVALIDAS", code: 400 });
            }

            // 4. Buscar rol real del usuario (colaborador)
            const colaborador = await Colaborador.findOne({
                where: { cuentaID: login.id },
                include: [
                    {
                        model: Rol,
                        attributes: ['nombre']
                    }
                ]
            });

            // Rol final
            let rolFinal = "USER"; // Por defecto

            if (login.isAdmn) {
                rolFinal = "ADMIN";
            } else if (colaborador) {
                rolFinal = colaborador.rol.nombre;
                // Ejemplo: "PRODUCT_OWNER"
            }

            // 5. Generar token
            const llave = process.env.KEY_SQ;

            const tokenData = {
                external: login.external,
                persona: login.persona.external,
                isAdmn: login.isAdmn,
                role: rolFinal,
                estado: login.estado
            };

            const token = jwt.sign(tokenData, llave, { expiresIn: "2h" });

            return res.status(200).json({
                token,
                msg: "Bienvenid@ " + login.persona.nombre + ' ' + login.persona.apellido,
                user: login.persona.nombre + ' ' + login.persona.apellido,
                correo: login.correo,
                external_cuenta: login.external,
                external_persona: login.persona.external,
                isAdmn: login.isAdmn,
                estado: login.estado,
                role: rolFinal,
                code: 200
            });

        } catch (error) {
            console.error("Error en login:", error);
            return res.status(500).json({
                msg: "Error interno del servidor",
                code: 500,
                error: error.message
            });
        }
    }


    // -------------------------
    // Registrar admin
    // -------------------------
    async registrarAdmin(req, res) {
        const db = require('../config/configBd');
        const t = await db.transaction();

        try {
            const { nombre, apellido, cedula, correo, contrasena } = req.body;

            // Verificar si correo ya existe
            const existeCorreo = await Cuenta.findOne({ where: { correo } });
            if (existeCorreo) {
                return res.status(400).json({
                    mensaje: "El correo ya se encuentra registrado."
                });
            }

            // Verificar si cédula ya existe
            const existeCedula = await usuario.findOne({ where: { cedula } });
            if (existeCedula) {
                return res.status(400).json({
                    mensaje: "La cédula ya se encuentra registrada."
                });
            }

            // Hash de la contraseña
            const salt = await bcrypt.genSalt(10);
            const hashContrasena = await bcrypt.hash(contrasena, salt);

            // Crear persona
            const nuevoAdmin = await usuario.create({
                nombre,
                apellido,
                cedula,
            }, { transaction: t });

            // Crear cuenta
            const nuevaCuenta = await Cuenta.create({
                correo,
                contrasena: hashContrasena,
                isAdmn: true,
                estado: true,
                personaId: nuevoAdmin.id,
            }, { transaction: t });

            await t.commit();

            res.status(201).json({
                mensaje: "Admin registrado correctamente.",
                cuenta_id: nuevaCuenta.external
            });

        } catch (error) {
            await t.rollback();

            console.error("Error al registrar admin:", error);

            // Manejo específico de errores UNIQUE de Sequelize
            if (error.name === "SequelizeUniqueConstraintError") {
                const campo = error.errors[0].path;

                if (campo.includes("correo")) {
                    return res.status(400).json({ mensaje: "El correo ya existe." });
                }

                if (campo.includes("cedula")) {
                    return res.status(400).json({ mensaje: "La cédula ya existe." });
                }
            }

            // Otros errores
            res.status(500).json({
                mensaje: "Error al registrar",
                error: error.message
            });
        }
    }


    // -------------------------
    // Restablecer Contraseña
    // -------------------------
    async restablecerContrasena(req, res) {
        const { correo } = req.body;
        if (!correo) return res.status(400).json({ msg: "Debe proporcionar un correo", code: 400 });

        try {
            // Buscar la cuenta
            const cuenta = await Cuenta.findOne({
                where: { correo },
                include: [{ model: Persona, as: 'persona', attributes: ['cedula'] }]
            });

            if (!cuenta) {
                return res.status(404).json({
                    msg: "Cuenta no encontrada",
                    code: 404
                });
            }

            if (!cuenta.persona || !cuenta.persona.cedula) {
                return res.status(500).json({
                    msg: "Esta cuenta no tiene una persona asociada correctamente",
                    code: 500
                });
            }

            const cedula = cuenta.persona.cedula;

            // Generar hash de la cédula
            const salt = await bcrypt.genSalt(10);
            const hashCedula = await bcrypt.hash(cedula.toString(), salt);

            // Actualizar contraseña
            await cuenta.update({ contrasena: hashCedula });

            return res.status(200).json({
                msg: "Contraseña restablecida temporalmente a la cédula",
                code: 200
            });

        } catch (error) {
            console.error("Error al restablecer contraseña:", error);
            return res.status(500).json({
                msg: "Error en servidor",
                code: 500,
                error: error.message
            });
        }
    }

}

module.exports = new LoginController();