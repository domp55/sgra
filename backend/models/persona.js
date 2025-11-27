const { DataTypes } = require('sequelize');
const db = require('../config/configBd');
const { v4: uuidv4 } = require('uuid');

const Persona = db.define('Persona', {
    // ID interno (Primary Key)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // ID Externo (Para no exponer el ID real en la API)
    external_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // Genera uno automático
        unique: true
    },
    nombre: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    apellido: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    cedula: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'personas',
    timestamps: false
});

module.exports = Persona;