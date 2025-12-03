'use strict';
const { validationResult } = require('express-validator');
const models = require('../models');
const usuario = models.persona;
const Cuenta = models.cuenta;
const Persona = models.persona;
const Rol = models.rol;
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

require('dotenv').config(); // cargar variables de entorno

class LoginController {

    // -------------------------
    // Iniciar sesión
    // -------------------------
    async sesion(req, res) {

        console.log("REQ BODY:", req.body);

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

            // Buscar cuenta + persona asociada
            const login = await Cuenta.findOne({
                where: { correo },
                include: [
                    {
                        model: Persona, // ← SIN alias
                        attributes: ['nombre', 'apellido', 'external']
                    }
                ]
            });

            if (!login) {
                return res.status(400).json({
                    msg: "CREDENCIALES INVALIDAS",
                    code: 400
                });
            }

            // Verificar si está activo
            if (!login.estado) {
                return res.status(403).json({
                    msg: "USUARIO NO SE ENCUENTRA ACTIVO",
                    code: 403
                });
            }

            // ---- VALIDAR CONTRASEÑA CORRECTAMENTE ----
            const claveCorrecta = bcrypt.compareSync(contrasena, login.contrasena);

            if (!claveCorrecta) {
                return res.status(400).json({
                    msg: "CREDENCIALES INVALIDAS",
                    code: 400
                });
            }

            // ------ GENERAR TOKEN ------
            const llave = process.env.KEY_SQ;
            if (!llave) {
                return res.status(500).json({
                    msg: "Clave JWT no configurada",
                    code: 500
                });
            }

            const tokenData = {
                external: login.external,
                persona: login.persona.external,
                check: true
            };

            const token = jwt.sign(tokenData, llave, {
                expiresIn: '2h'
            });

            return res.status(200).json({
                token,
                msg: "Bienvenid@ " + login.persona.nombre + ' ' + login.persona.apellido,
                user: login.persona.nombre + ' ' + login.persona.apellido,
                correo: login.correo,
                external_id: login.persona.external,
                isAdmn: login.isAdmn,
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



    async restablecerContraseña(req, res) {
        const { correo } = req.body;
        if (!correo) return res.status(400).json({ msg: "Debe proporcionar un correo", code: 400 });

        try {
            // Buscar la cuenta
            const cuenta = await Cuenta.findOne({
                where: { correo },
                include: [{ model: usuario, as: 'persona', attributes: ['cedula'] }]
            });

            if (!cuenta) return res.status(404).json({ msg: "Cuenta no encontrada", code: 404 });

            // Generar hash de la cédula
            const salt = await bcrypt.genSalt(10);
            const hashCedula = await bcrypt.hash(cuenta.persona.cedula, salt);

            // Actualizar la contraseña usando el mismo patrón que en tu modificar()
            const result = await cuenta.update({ contrasena: hashCedula });

            if (!result) {
                return res.status(500).json({ msg: "No se pudo actualizar la contraseña", code: 500 });
            }

            return res.status(200).json({
                msg: "Contraseña restablecida temporalmente a la cédula",
                code: 200
            });

        } catch (error) {
            console.error("Error al restablecer contraseña:", error);
            return res.status(500).json({ msg: "Error en servidor", code: 500, error: error.message });
        }
    }

}

module.exports = new LoginController();