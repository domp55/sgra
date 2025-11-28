// models/rol.js
module.exports = (sequelize, DataTypes) => {
  const Rol = sequelize.define(
    "rol",
    {
      nombre: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: { msg: "El nombre del rol no puede estar vacío." },
          len: { args: [3, 50], msg: "El rol debe tener entre 3 y 50 caracteres." },
        },
        set(value) {
          // Normalización: siempre en mayúsculas
          this.setDataValue("nombre", value.toUpperCase());
        },
      },

      estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      external: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
    },
    {
      freezeTableName: true,
      // underscored: true, // descomenta si quieres columnas snake_case
    }
  );

  // Asociaciones
  Rol.associate = (models) => {
    Rol.hasMany(models.colaborador, {
      foreignKey: "rolID",
      as: "colaboradores", // plural para un hasMany
    });
  };

  return Rol;
};
