const express = require('express');
const sequelize = require('./config/configBd');
const cors = require('cors')


const app = express();
const PORT = 3000;
sequelize.sync()
    .then(() => {
        console.log('Base de datos sincronizada');
    })
    .catch(error => {
        console.error('Error al sincronizar la base de datos:', error);
    });

app.get('/', (req, res) => {
    res.send('');
});
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});