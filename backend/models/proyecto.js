module.exports = (sequelize, DataTypes) => {
    const proyecto = sequelize.define("proyecto", {
        nombre: DataTypes.STRING,
        descripcion: DataTypes.STRING,
        tiempoSprint: DataTypes.INTEGER,
        nroSprints: DataTypes.INTEGER,
        estado: { type: DataTypes.BOOLEAN, defaultValue: true },
        external: {
            type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4
        }
    });

    proyecto.associate = (models) => {
        proyecto.hasMany(models.colaborador, {
            foreignKey: "proyectoId",
            as: "colaborador"
        });
    };

    return proyecto;
};