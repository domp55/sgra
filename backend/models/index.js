"use strict";

const fs = require("fs");
const path = require("path");
const { Sequelize, DataTypes } = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require("../config/configBd")[env];
const db = {};

let sequelize;

sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
        timezone: '-05:00',
        port: process.env.DB_PORT,

    }
)

fs.readdirSync(__dirname)
    .filter((file) => {
        return (
            file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
        );
    })
    .forEach((file) => {
        console.log(`🔍 Cargando modelo: ${file}`);

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

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;