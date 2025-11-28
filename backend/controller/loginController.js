'use strict';
const { validationResult } = require('express-validator');
const models = require('../models');
const usuario = models.persona;
const Cuenta = models.cuenta;
const bcrypt = require('bcrypt');

const nodemailer = require("nodemailer");

const jwt = require('jsonwebtoken');
require('dotenv').config(); // cargar variables de entorno

class LoginController {

    // -------------------------
    // Iniciar sesión
    // -------------------------
    async sesion(req, res) {

        console.log('REQ BODY:', req.body);
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
            const login = await Cuenta.findOne({
                where: { correo },
                include: [
                    {
                        model: usuario,
                        as: 'persona',
                        attributes: ['apellido', 'nombre', 'external'],
                    }
                ]
            });

            console.log('LOGIN DB:', login);


            if (!login) {
                return res.status(400).json({ msg: "USUARIO NO ENCONTRADO", code: 400 });
            }

            if (!login.persona) {
                return res.status(400).json({ msg: "USUARIO SIN PERFIL ASOCIADO", code: 400 });
            }

            if (!login.estado) {
                return res.status(403).json({ msg: "USUARIO INACTIVO", code: 403 });
            }

            if (!login.contrasena) {
                return res.status(400).json({ msg: "CUENTA SIN CONTRASEÑA REGISTRADA", code: 400 });
            }

            const passwordValida = bcrypt.compareSync(contrasena, login.contrasena);
            if (!passwordValida) {
                return res.status(401).json({ msg: "CLAVE INCORRECTA", code: 401 });
            }

            const llave = process.env.KEY_SQ;
            if (!llave) {
                return res.status(500).json({ msg: "CLAVE JWT NO CONFIGURADA", code: 500 });
            }

            const tokenData = {
                external: login.external,
                user: login.persona.nombre,
                check: true
            };

            const token = jwt.sign(tokenData, llave, { expiresIn: '2h' });

            return res.status(200).json({
                token,
                user: `${login.persona.nombre} ${login.persona.apellido}`,
                msg: `Bienvenid@ ${login.persona.nombre} ${login.persona.apellido}`,
                correo: login.correo,
                external_id: login.persona.external,
                code: 200
            });

        } catch (error) {
            console.error("Error en login:", error);
            return res.status(500).json({ msg: "ERROR INTERNO DEL SERVIDOR", code: 500, error: error.message });
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

            const salt = await bcrypt.genSalt(10);
            const hashContrasena = await bcrypt.hash(contrasena, salt);

            const nuevaPersona = await usuario.create({
                nombre,
                apellido,
                cedula
            }, { transaction: t });

            const nuevaCuenta = await Cuenta.create({
                correo,
                contrasena: hashContrasena,
                esAdmin: true,
                estado: true,
                personaId: nuevaPersona.id
            }, { transaction: t });

            await t.commit();

            res.status(201).json({
                mensaje: "Admin Registrado Correctamente.",
                cuenta_id: nuevaCuenta.external
            });

        } catch (error) {
            await t.rollback();
            console.error("Error al registrar admin:", error);
            res.status(500).json({ mensaje: "Error al registrar", error: error.message });
        }
    }
    
    async restablecerContraseña(req, res) {
        const { correo } = req.body;

        try {
            const cuenta = await Cuenta.findOne({
                where: { correo },
                include: [{ model: usuario, as: 'persona', attributes: ['nombre', 'apellido', 'cedula'] }]
            });

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            // Mensaje a enviar
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: cuenta.correo,
                subject: 'Restablecimiento de contraseña',
                text: `Hola ${cuenta.persona.nombre}, tu contraseña temporal será tu número de cédula (${cuenta.persona.cedula}). 
Por favor, actualiza tu contraseña al iniciar sesión nuevamente.`
            };

            // Enviar correo
            await transporter.sendMail(mailOptions);

            // Actualizar contraseña en la base de datos
            const salt = await bcrypt.genSalt(10);
            const hashCedula = await bcrypt.hash(cuenta.persona.cedula, salt);

            cuenta.contrasena = hashCedula;
            await cuenta.save();

            return res.json({
                msg: "Correo enviado y contraseña restablecida temporalmente",
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

module.exports = new LoginController(); // exportamos la instancia directamente
