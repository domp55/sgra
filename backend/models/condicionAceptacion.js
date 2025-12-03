const { UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    const CondicionAceptacion = sequelize.define("condicionAceptacion", {
        descripcion: {
            type: DataTypes.STRING,
            allowNull: false
        },
        historiaUsuarioId: {
            type: DataTypes.INTEGER,
            allowNull: false 
        },
        external: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4
        }
    }, { freezeTableName: true });

    CondicionAceptacion.associate = (models) => {
  
      
            CondicionAceptacion.belongsTo(models.historiaUsuario, { foreignKey: "historiaUsuarioId" });
    
    };

    return CondicionAceptacion;
};