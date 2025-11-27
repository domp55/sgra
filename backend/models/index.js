"use strict";

const fs = require("fs");//fs libreria para archivos
const path = require("path");
const { Sequelize, DataTypes } = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";//instalar para agegar credenciales ocultas
const config = require("../config/config")[env];
const db = {};

let sequelize;
//if (config.use_env_variable) {
// sequelize = new Sequelize(process.env[config.use_env_variable], config);
//} else {
sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
);

fs.readdirSync(__dirname)
    .filter((file) => {
        return (
            file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
        );
    })
    .forEach((file) => {
        console.log(`🔍 Cargando modelo: ${file}`); // Agregar este log para depuración

        const model = require(path.join(__dirname, file));

        if (typeof model !== "function") {
            console.error(`❌ Error: El archivo '${file}' no exporta una función.`);
            return;
        }

        db[model(sequelize, DataTypes).name] = model(sequelize, DataTypes);
    });

Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;//son modelos
db.Sequelize = Sequelize;//tipos de datos

module.exports = db;