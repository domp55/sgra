const { where } = require("sequelize");
const db = require("../models");
const Version = db.version;
const Persona = db.persona;
const Colaborador = db.colaborador;
const RequisitoMaster = db.requisitoMaster

class VersionController{
    
    async get(){}
}

module.exports = new VersionController();