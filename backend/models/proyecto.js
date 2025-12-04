const { DataTypes, UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    const Proyecto = sequelize.define("proyecto", {
        //General
        nombre: { type: DataTypes.STRING, allowNull: false },
        acronimo: { type: DataTypes.STRING(100), allowNull: true },
        descripcion: { type: DataTypes.STRING(255), allowNull: true },
        //Cronograma
        fechaInicio: { type: DataTypes.DATE, allowNull: true },
        fechaFin: { type: DataTypes.DATE, allowNull: true },
        estado: { type: DataTypes.ENUM("En Planificación", "En Ejecución", "En Pausa", "Finalizado"), defaultValue: "En Planificación" },
        tiempoSprint: { type: DataTypes.INTEGER, allowNull: true },
        nroSprints: { type: DataTypes.INTEGER, allowNull: true },
        objetivosCalidad: { type: DataTypes.TEXT, allowNull: true },
        definicionDone: { type: DataTypes.TEXT, allowNull: true },
        criteriosEntradaQA: { type: DataTypes.TEXT, allowNull: true },
        coberturaPruebasMinima: { type: DataTypes.INTEGER, allowNull: true },

        estaActivo: { type: DataTypes.BOOLEAN, defaultValue: false },
        external: { type: DataTypes.UUID, defaultValue: UUIDV4 }
    }, { freezeTableName: true });

    Proyecto.associate = (models) => {
        // Relación: Un Proyecto puede tener muchos RequisitoMaster
        Proyecto.hasMany(models.requisitomaster, { foreignKey: "idProyecto" });

        // Relación: Un Proyecto puede tener muchos Colaboradores
        Proyecto.hasMany(models.colaborador, { foreignKey: "proyectoId" });
    };

    return Proyecto;
};