const { UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    const Proyecto = sequelize.define("proyecto", {
        nombre: {
            type: DataTypes.STRING,
            allowNull: false
        },
        descripcion: {
            type: DataTypes.STRING,
            allowNull: true
        },
        tiempoSprint: {
            type: DataTypes.INTEGER,
            allowNull: true // Se asume que podría ser opcional
        },
        nroSprints: {
            type: DataTypes.INTEGER,
            allowNull: true
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

    Proyecto.associate = (models) => {
        // Relación: Un Proyecto puede tener muchos RequisitoMaster
        Proyecto.hasMany(models.requisitomaster, { foreignKey: "idProyecto" });
        
        // Relación: Un Proyecto puede tener muchos Colaboradores
        Proyecto.hasMany(models.colaborador, { foreignKey: "proyectoId" });
    };

    return Proyecto;
};