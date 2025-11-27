const db = require("../models"); 
const colaborador = db.colaborador;


class colaboradorController {
    listarColaboradores = async (req, res) => {
        try {
            const colaboradores = await colaborador.findAll({
                include: [{ all: true }]
            });
            res.status(200).json(colaboradores);
        } catch (error) {

            res.status(500).json({ mensaje: "Error al listar colaboradores", error: error.message });
        }
    };
}
// hshshshs
module.exports = new colaboradorController();