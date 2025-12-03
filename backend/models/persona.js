const { UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    const Persona = sequelize.define("persona", {
        nombre: {
            type: DataTypes.STRING,
            allowNull: false
        },
        cedula: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true // Asumiendo que la cédula es única
        },
        apellido: {
            type: DataTypes.STRING,
            allowNull: false
        },
        estado: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        external: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4
        }
    }, { freezeTableName: true });

    // La asociación con Cuenta se define en Cuenta, ya que Cuenta 'pertenece a' Persona
    Persona.associate = (models) => {
        Persona.hasOne(models.cuenta, { foreignKey: "personaId" }); 
    };

    return Persona;
};