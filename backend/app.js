const express = require('express');
const cors = require('cors');
const db = require('./models'); 

const app = express();
const PORT = 3001;
const cuentaRouter = require('./routes/cuentaRoutes');
const loginRouter = require('./routes/loginRoutes');

app.use(express.json());
// Middleware para preflight CORS
// Permitir CORS para todas las rutas
app.use(cors({
    origin: "http://localhost:3000", // tu frontend (ajústalo según corresponda)
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Access-Token"]
}));

app.use(express.json());
app.use('/api/cuenta',cuentaRouter);
app.use('/api/colaborador',require('./routes/colaboradorRoutes'));
app.use('/api/privado', loginRouter);

db.sequelize.sync({ alter: true })
  .then(() => {
    console.log('Base de datos sincronizada');
  })
  .catch(error => {
    console.error('Error al sincronizar la base de datos:', error);
  });

app.get('/', (req, res) => {
  res.send('Servidor funcionando');
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
