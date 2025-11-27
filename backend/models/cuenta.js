'use strict';

module.exports = (sequelize, DataTypes) => {
    const cuenta = sequelize.define('cuenta', {
        external: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
        estado: { type: DataTypes.BOOLEAN,  defaultValue: true },
        esAdmin: { type: DataTypes.BOOLEAN, allowNull: false },
        correo: { type: DataTypes.STRING(75), allowNull: false },
        contraseña: { type: DataTypes.STRING(250), allowNull: false }
    }, {
        freezeTableName: true
    });

    cuenta.associate = function (models) {
        cuenta.belongsTo(models.persona, { foreignKey: 'personaId' });
        cuenta.hasMany(models.colaborador, {foreignKey: "cuentaID",as: "colaborador"
    });
    };

    return cuenta;
};