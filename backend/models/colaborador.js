const { UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    const Colaborador = sequelize.define("colaborador", {
        rolID: {
            type: DataTypes.INTEGER,
            allowNull: false // Clave foránea de Rol
        },
        proyectoId: {
            type: DataTypes.INTEGER,
            allowNull: false // Clave foránea de Proyecto
        },
        cuentaID: {
            type: DataTypes.INTEGER,
            allowNull: false // Clave foránea de Cuenta
        },
        fechaAsignacion: { // Atributo específico de Colaborador
            type: DataTypes.DATEONLY, // Usando DATEONLY para solo la fecha
            allowNull: false
        },
        estado: { // Atributo específico de Colaborador
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        external: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4
        },
    }, { freezeTableName: true });

    Colaborador.associate = (models) => {
        // Colaborador pertenece a Cuenta, Proyecto y Rol
        Colaborador.belongsTo(models.cuenta, { foreignKey: "cuentaID" });
        Colaborador.belongsTo(models.proyecto, { foreignKey: "proyectoId" });
        Colaborador.belongsTo(models.rol, { foreignKey: "rolID" });
    };

    return Colaborador;
};