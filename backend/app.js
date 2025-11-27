const express = require('express');
const sequelize = require('./config/configBd');
const cors = require('cors');

// 1. IMPORTAR LAS RUTAS
// Esto conecta tu archivo app.js con el archivo de rutas que creaste
const cuentaRouter = require('./routes/cuenta.routes');

const app = express();
const PORT = 3000;

// 2. MIDDLEWARES (Configuraciones previas)
// ¡OJO! Esto debe ir ANTES de las rutas
app.use(cors()); // Permite que el Frontend (React/Next) se comunique con este Backend
app.use(express.json()); // VITAL: Permite que tu servidor entienda los datos JSON que le envían (el req.body)

// 3. USAR LAS RUTAS
// Aquí definimos el prefijo. Tus rutas quedarán como: http://localhost:3000/api/cuenta/registro
app.use('/api/cuenta', cuentaRouter);

// Ruta de prueba base
app.get('/', (req, res) => {
    res.send('API SGRA funcionando');
});

// 4. SINCRONIZACIÓN DE BASE DE DATOS
// Usamos { force: false } para no borrar los datos cada vez que guardas. 
// Si haces cambios grandes en los modelos y te da error, cambia a { alter: true } temporalmente.
sequelize.sync({ force: false })
    .then(() => {
        console.log('Base de datos y tablas sincronizadas');
    })
    .catch(error => {
        console.error('Error al sincronizar la base de datos:', error);
    });

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});