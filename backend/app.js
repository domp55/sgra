const express = require('express');
const cors = require('cors');
const db = require('./models'); 

const app = express();
const PORT = 3001;
const cuentaRouter = require('./routes/cuentaRoutes');
const loginRouter = require('./routes/loginRoutes');
const rolRouter = require('./routes/rolRoutes');

app.use(express.json());
app.use(cors());

app.use(express.json());
app.use('/api/cuenta',cuentaRouter);
app.use('/api/colaborador',require('./routes/colaboradorRoutes'));
app.use('/api/privado', loginRouter);
app.use('/api/rol', rolRouter);

db.sequelize.sync({ alter: false })
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
