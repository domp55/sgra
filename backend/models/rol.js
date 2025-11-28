// models/rol.js
module.exports = (sequelize, DataTypes) => {
    const rol = sequelize.define("rol", {
        nombre: { 
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: "DESARROLLADOR",     // ✔ Valor por defecto
            validate: {
                notEmpty: { msg: "El nombre del rol no puede estar vacío." },
                len: { args: [3, 50], msg: "El rol debe tener entre 3 y 50 caracteres." }
            },
            // Normalización automática: siempre en mayúsculas
            set(value) {
                this.setDataValue("nombre", value.toUpperCase());
            }
        },

        estado: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },

        external: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        }
    }, {
        freezeTableName: true  
    });

    rol.associate = (models) => {
        rol.hasMany(models.colaborador, {
            foreignKey: "rolID",
            as: "colaborador"
        });
    };

    return rol;
};
