const express = require('express');
const app = express();
const port = 3001;

app.get('/', (req, res) => {
  res.send('API para TDAH Support App');
});

app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});