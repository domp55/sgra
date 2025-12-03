const { UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const HistoriaUsuario = sequelize.define(
    "historiaUsuario",
    {
      codigo: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      descripcion: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      estaActiva: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      estado: {
        type: DataTypes.ENUM(
          "sin asignar sprint",
          "por hacer",
          "en progreso",
          "hecho"
        ),
        allowNull: false,
        defaultValue: "sin asignar sprint",
      },
      prioridad: {
        // Se define la lista exacta de valores permitidos
        type: DataTypes.ENUM("alta", "media", "baja", "critica"),
        allowNull: false,
        defaultValue: "media",
      },
      sprintId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      versionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      external: {
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
      },
    },
    { freezeTableName: true }
  );

  HistoriaUsuario.associate = (models) => {
    HistoriaUsuario.belongsTo(models.sprint, { foreignKey: "sprintId" });
    HistoriaUsuario.belongsTo(models.version, { foreignKey: "versionId" });
    HistoriaUsuario.hasMany(models.condicionAceptacion, {
      foreignKey: "historiaUsuarioId",
    });
  };

  return HistoriaUsuario;
};
