'use strict';
const { validationResult } = require('express-validator');
const models = require('../models');
const usuario = models.persona;
const Cuenta = models.cuenta;
const Persona = models.persona;
const Rol = models.rol;
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
                    model: Persona, // tu modelo de persona
                    as: 'persona',
                    attributes: ['apellido', 'nombre', 'external'],
                },
                {
                    model: Rol, // tu modelo de roles
                    as: 'rol',
                    attributes: ['nombre']
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
            return res.status(403).json({ msg: "USUARIO INACTIVO, EL ADMIN DEBE ACEPTARLO", code: 403 });
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
            external: login.persona.external,
            user: login.persona.nombre,
            check: true,
            role: login.rol ? login.rol.nombre : null
        };

        const token = jwt.sign(tokenData, llave, { expiresIn: '2h' });

        return res.status(200).json({
            token,
            user: `${login.persona.nombre} ${login.persona.apellido}`,
            msg: `Bienvenid@ ${login.persona.nombre} ${login.persona.apellido}`,
            correo: login.correo,
            external_id: login.persona.external,
            code: 200,
            role: login.rol ? login.rol.nombre : null
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

        // Generar hash de la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashContrasena = await bcrypt.hash(contrasena, salt);

        // Crear la persona
        const nuevaPersona = await usuario.create({
            nombre,
            apellido,
            cedula
        }, { transaction: t });

        // Buscar el rol de administrador
        const rolAdmin = await rol.findOne({
            where: { nombre: "ADMIN" } // asumimos que el rol "ADMIN" ya existe
        });

        if (!rolAdmin) {
            await t.rollback();
            return res.status(500).json({
                mensaje: "No se encontró el rol de administrador. Debe crearse previamente."
            });
        }

        // Crear la cuenta asociando el rol de admin
        const nuevaCuenta = await Cuenta.create({
            correo,
            contrasena: hashContrasena,
            esAdmin: true,
            estado: true,
            personaId: nuevaPersona.id,
            nombre: rolAdmin.id
        }, { transaction: t });

        await t.commit();

        res.status(201).json({
            mensaje: "Admin registrado correctamente.",
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