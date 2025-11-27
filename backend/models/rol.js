// models/rol.js
module.exports = (sequelize, DataTypes) => {
    const rol = sequelize.define("rol", {
        nombre: DataTypes.STRING,
        estado: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        external: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        }
    });

    rol.associate = (models) => {
        rol.hasMany(models.colaborador, {
            foreignKey: "rolID",
            as: "colaborador"
        });
    };

    return rol;
};
