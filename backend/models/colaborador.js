// models/colaborador.js
module.exports = (sequelize, DataTypes) => {
    const Colaborador = sequelize.define("colaborador", {
        rolID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        proyectoId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        cuentaID: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    },{ freezeTableName: true});

    Colaborador.associate = (models) => {
        Colaborador.belongsTo(models.cuenta, { foreignKey: "cuentaID" });
        Colaborador.belongsTo(models.proyecto, { foreignKey: "proyectoId" });
        Colaborador.belongsTo(models.rol, { foreignKey: "rolID" });
    };

    return Colaborador;
};
