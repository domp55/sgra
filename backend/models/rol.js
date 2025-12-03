const { UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    const Rol = sequelize.define("rol", {
        nombre: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
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

    Rol.associate = (models) => {
        // Relación: Un Rol puede estar asignado a muchos Colaboradores
        Rol.hasMany(models.colaborador, { foreignKey: "rolID" });
    };

    return Rol;
};