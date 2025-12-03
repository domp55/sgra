const { UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    const Sprint = sequelize.define("sprint", {
        nombre: {
            type: DataTypes.STRING,
            allowNull: false
        },
        fechaInicio: {
            type: DataTypes.DATEONLY, 
            allowNull: false,
         
        },
        fechaFin: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        external: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4
        }
    }, { freezeTableName: true });

    Sprint.associate = (models) => {
        
            Sprint.hasMany(models.historiaUsuario, { foreignKey: "sprintId" });
        
    };

    return Sprint;
};