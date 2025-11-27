'use strict';
const { validationResult } = require('express-validator');
var models = require('../models');
var usuario = models.persona;
const db = require('../config/configBd');
const bcrypt = require('bcrypt');
var Cuenta = models.cuenta;
let jwt = require('jsonwebtoken');

class loginController {

    async sesion(req, res) {
        let errors = validationResult(req);
        console.log(req.body)
        // Validar errores
        if (!errors.isEmpty()) {
            return res.status(400).json({
                msg: "Datos faltantes",
                code: 400,
                errors: errors.array()
            });
        }

        try {
            // Buscar cuenta por correo
            const login = await Cuenta.findOne({
                where: { correo: req.body.correo },
                include: [
                    {
                        model: usuario,
                        as: 'persona',
                        attributes: ['apellido', 'nombre', 'external'],
                    }
                ]
            });

            // Si no existe
            if (!login || login == null) {
                return res.status(400).json({
                    msg: "USUARIO NO ENCONTRADO",
                    code: 400
                });
            }

            // Validar estado activo
            if (!login.estado) {
                return res.json({
                    msg: "USUARIO NO SE ENCUENTRA ACTIVO",
                    code: 201
                });
            }

            // Validar contraseña
            const passwordValida = bcrypt.compareSync(req.body.contrasena, login.contrasena);

            if (!passwordValida) {
                return res.json({
                    msg: "CLAVE INCORRECTA",
                    code: 201
                });
            }

            // Crear token
            const tokenData = {
                external: login.external,
                user: login.persona.nombre,
                check: true
            };

            require('dotenv').config();
            const llave = process.env.KEY_SQ;

            const token = jwt.sign(tokenData, llave, {
                expiresIn: '2h'
            });

            // Respuesta final correcta
            return res.json({
                token: token,
                user: `${login.persona.nombre} ${login.persona.apellido}`,
                msg: `Bienvenid@ ${login.persona.nombre} ${login.persona.apellido}`,
                correo: login.correo,
                external_id: login.persona.external,
                code: 200
            });

        } catch (error) {
            console.error("Error en login:", error);
            return res.status(500).json({
                msg: "ERROR EN SERVIDOR",
                code: 500,
                error: error.message
            });
        }
    }

    async registrarAdmin(req, res) {
        const t = await db.transaction();

        try {

            const { nombre, apellido, cedula, correo, contrasena } = req.body;

            const salt = await bcrypt.genSalt(10);
            const hashContrasena = await bcrypt.hash(contrasena, salt);

            const nuevaPersona = await usuario.create({
                nombre,
                apellido,
                cedula,
            }, { transaction: t }); 

            const nuevaCuenta = await Cuenta.create({
                correo,
                contrasena: hashContrasena,
                esAdmin: true,
                estado: true,
                personaId: nuevaPersona.id,
            }, { transaction: t });

            await t.commit();

            res.status(201).json({
                mensaje: "Admin Registrado Correctamente.",
                cuenta_id: nuevaCuenta.external
            });

        } catch (error) {
            await t.rollback();
            console.log(error);
            res.status(500).json({ mensaje: "Error al registrar", error: error.message });
        }
    }
    
}
module.exports = loginController;