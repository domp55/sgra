const { DataTypes } = require('sequelize');
const db = require('../config/configBd');
const Persona = require('./persona');
const { v4: uuidv4 } = require('uuid');

const Cuenta = db.define('Cuenta', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    external_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true
    },
    correo: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    contrasena: {
        type: DataTypes.STRING,
        allowNull: false
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true // O false, si requieren aprobación primero (HU6)
    },
    esAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // Llave foránea manual (opcional, sequelize lo puede hacer solo, pero tu diagrama lo pide explícito)
    personaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'personas',
            key: 'id'
        }
    }
}, {
    tableName: 'cuentas',
    timestamps: false
});

// DEFINICIÓN DE LA RELACIÓN
// Una Cuenta pertenece a una Persona
Cuenta.belongsTo(Persona, { foreignKey: 'personaId' });
// Una Persona tiene una Cuenta
Persona.hasOne(Cuenta, { foreignKey: 'personaId' });

module.exports = Cuenta;