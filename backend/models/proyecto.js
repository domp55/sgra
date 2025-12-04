const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    const Proyecto = sequelize.define("proyecto", {
        nombre: {
            type: DataTypes.STRING,
            allowNull: false
        },
        acronimo: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        descripcion: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        tiempoSprint: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        nroSprints: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        fechaInicio: {
            type: DataTypes.DATE,
            allowNull: true
        },
        fechaFin: {
            type: DataTypes.DATE,
            allowNull: true
        },
        estado: {
            type: DataTypes.ENUM(
                "En Planificación",
                "En Ejecución",
                "En Pausa",
                "Finalizado"
            ),
            defaultValue: "En Planificación"
        },
        estaActivo: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        external: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4
        }
    }, { freezeTableName: true });

    Proyecto.associate = (models) => {
        // Relación: Un Proyecto puede tener muchos RequisitoMaster
        Proyecto.hasMany(models.requisitomaster, { foreignKey: "idProyecto" });

        // Relación: Un Proyecto puede tener muchos Colaboradores
        Proyecto.hasMany(models.colaborador, { foreignKey: "proyectoId" });
    };

    return Proyecto;
};