const { UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    const Cuenta = sequelize.define("cuenta", {
        correo: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        contrasena: {
            type: DataTypes.STRING,
            allowNull: false
        },
        estado: {
            type: DataTypes.BOOLEAN,
            defaultValue: false // Inicialmente desactivada hasta ser aprobada
        },
        external: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4
        },
        isAdmn: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        // Clave foránea (FK) de Persona
        personaId: {
            type: DataTypes.INTEGER, // Asumiendo que el ID primario es INTEGER
            allowNull: false
        }
    }, { freezeTableName: true });

    Cuenta.associate = (models) => {
        // Relación: Cuenta pertenece a una Persona (pertenece a 1)
        Cuenta.belongsTo(models.persona, { foreignKey: "personaId" });
        
        // Relación: Una Cuenta puede tener muchos Colaboradores
        Cuenta.hasMany(models.colaborador, { foreignKey: "cuentaID" });
    };

    return Cuenta;
};