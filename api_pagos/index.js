const express = require('express');
const app = express();
const port = 3000;

let isDown= false;
let attackSimulated= false;

app.use(express.json())

app.post('/simulate-attack', (req, res) => {
    attackSimulated= true;
    console.log('Intento de ataque')
    res.send('Ataque recibido')}
);

app.get('/status', (req, res) => {
    if (isDown){
        return res
        .status(503)
        .json({status: 'Error', message:'El servicio está caído'});
    }
    const output ={ status: 'OK', service: 'API_PAGOS', timestamp: new Date().toISOString() };

    if (attackSimulated){output.securityAlert= 'Intento de ataque detectado'};

     res.json(output) });

app.post('/simulate-down', (req,res)=> {
    isDown= true;
    console.log('❌ API_PAGOS se ha puesto en estado DOWN ');
    res.send('Servicio en estado DOWN')
});

app.post('/restart', (req, res) => {
  console.log('⚠️ API_PAGOS reiniciado a estado NORMAL');
  res.send('Servicio reiniciado correctamente');
});

app.listen(port, () => {
  console.log(`🟢 API_PAGOS corriendo en http://localhost:${port}`);
});



