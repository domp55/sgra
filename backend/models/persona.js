'use strict';

module.exports = (sequelize, DataTypes) => {
    const persona = sequelize.define('persona', {
        external_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
        estado: { type: DataTypes.BOOLEAN,  defaultValue: true },
        nombre: { type: DataTypes.STRING(100), allowNull: false },
        apellido: { type: DataTypes.STRING(100), allowNull: false },
        cedula: { type: DataTypes.STRING(10), allowNull: false }
    }, {
        freezeTableName: true
    });

    persona.associate = function (models) {
        persona.hasOne(models.cuenta, { foreignKey: 'personaId', as: "cuenta" });
    };

    return persona;
};