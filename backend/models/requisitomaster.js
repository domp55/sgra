const { UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    const RequisitoMaster = sequelize.define("requisitomaster", {
        external: { 
            type: DataTypes.UUID, 
            defaultValue: UUIDV4 
        },
        // Clave foránea (FK) de Proyecto (idProyecto: FK)
        idProyecto: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
               estado: {
            type: DataTypes.BOOLEAN,
            defaultValue: false // Inicialmente desactivada hasta ser aprobada
        },
    }, { freezeTableName: true });

    RequisitoMaster.associate = (models) => {
        // Relación: RequisitoMaster pertenece a un Proyecto
        RequisitoMaster.belongsTo(models.proyecto, { foreignKey: "idProyecto" });
        // Relación: Un RequisitoMaster tiene muchas Versiones
        RequisitoMaster.hasMany(models.version, { foreignKey: "idMaster" });
    };

    return RequisitoMaster;
};