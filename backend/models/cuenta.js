'use strict';

module.exports = (sequelize, DataTypes) => {
    const cuenta = sequelize.define('cuenta', {
        external: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
        estado: { type: DataTypes.BOOLEAN,  defaultValue: true },
        esAdmin: { type: DataTypes.BOOLEAN, allowNull: false },
        correo: { type: DataTypes.STRING(75), allowNull: false },
        contrasena: { type: DataTypes.STRING(250), allowNull: false }
    }, {
        freezeTableName: true
    });

    cuenta.associate = function (models) {
        // Relación con persona
        cuenta.belongsTo(models.persona, { foreignKey: 'personaId' });

        // Relación con colaborador
        cuenta.hasMany(models.colaborador, {
            foreignKey: "cuentaID",
            as: "colaborador"
        });

        // ⭐ Nueva relación con rol (cada cuenta tiene un rol)
        cuenta.belongsTo(models.rol, {
            foreignKey: "rolID",
            as: "rol"
        });
    };

    return cuenta;
};
