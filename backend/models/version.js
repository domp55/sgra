const { UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    const Version = sequelize.define("version", {
        nombre: {
            type: DataTypes.STRING,
            allowNull: false
        },
        descripcion: {
            type: DataTypes.STRING,
            allowNull: false
        },
        prioridad: {
            type: DataTypes.ENUM('Alta', 'Media', 'Baja'), // Usamos ENUM para prioridades
            allowNull: false
        },
        tipo: { // RF (Funcional), RNF (No Funcional)
            type: DataTypes.ENUM('RF', 'RNF'),
            allowNull: false
        },
        estado: {
            type: DataTypes.INTEGER, // El diagrama dice INT para estado
            defaultValue: 1
        },
        external: { 
            type: DataTypes.UUID, 
            defaultValue: UUIDV4 
        },
        version: { // Número de versión
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        // Clave foránea (FK) de RequisitoMaster (idMaster: FK)
        idMaster: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, { freezeTableName: true });

    Version.associate = (models) => {
        // Relación: Version pertenece a un RequisitoMaster
        Version.belongsTo(models.requisitomaster, { foreignKey: "idMaster" });
    };

    return Version;
};