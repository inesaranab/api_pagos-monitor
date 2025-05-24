# Agente de Resiliencia Operativa

Este proyecto incluye:

1. **Microservicio `API_PAGOS`** (simula estado, caídas y reinicios).
2. **Docker Compose** que levanta `API_PAGOS` y `n8n`.
3. **Workflow n8n** (exportado como JSON) con un AI Agent que monitorea, razona y actúa.
4. **Instrucciones** para simulaciones y uso.

---

## Estructura del repositorio

```bash
project/
├── api_pagos/
│   ├── index.js          # Código del microservicio
│   ├── package.json      # Dependencias de Node.js
│   └── Dockerfile        # Imagen Docker para API_PAGOS
├── docker-compose.yml    # Define servicios n8n y api_pagos
├── n8n_workflow.json     # Exportación del workflow de n8n
└── README.md             # Este archivo
```

---

## 1. Levantar los servicios con Docker

En la raíz del proyecto:

```bash
# Construye y arranca los contenedores en segundo plano
docker compose up -d --build
```

* `api_pagos` estará en [http://localhost:3000](http://localhost:3000)
* `n8n` estará en [http://localhost:5678](http://localhost:5678) (user: admin / pass: admin)

Verifica que los contenedores estén `healthy`:

```bash
docker ps
```

Si agregaste healthcheck, verás `(healthy)` o `(unhealthy)`.

---

## 2. Servicio `API_PAGOS`

### Endpoints disponibles:

* `GET /status`
  Responde `{ status: 'OK', ... }` o `503 + { status: 'ERROR', ... }` si está caído o hay alertas.

* `POST /simulate-down`
  Marca el servicio como `down` internamente.

* `POST /restart`
  Reinicia el servicio (restablece a `OK`).

* (Opcionales) otras simulaciones añadidas en tu flujo, p.ej. `/simulate-attack`, `/simulate-cpu-spike`, etc.

### Código de ejemplo (index.js):

```js
const express = require('express');
const app = express();
const port = 3000;
let isDown = false;

app.use(express.json());

app.get('/status', (req, res) => {
  if (isDown) {
    return res.status(503).json({ status: 'ERROR', message: 'Simulado como caído' });
  }
  res.json({ status: 'OK', service: 'API_PAGOS', timestamp: new Date().toISOString() });
});

app.post('/simulate-down', (req, res) => {
  isDown = true;
  console.log('🔴 Simulación: API_PAGOS caído');
  res.send('Simulado DOWN');
});

app.post('/restart', (req, res) => {
  isDown = false;
  console.log('🟢 Reinicio: API_PAGOS OK');
  res.send('Reiniciado');
});

app.listen(port, () => console.log(`API_PAGOS en http://localhost:${port}`));
```

---

## 3. Workflow en n8n

Importa `n8n_workflow.json` desde la interfaz de n8n (`⋯ → Import`).

### Disparadores:

* **Webhook**: recibe eventos externos (p.ej. ataques).
* **Chat Trigger**: mensajes del equipo.
* **Schedule Trigger**: chequeos periódicos.

### Nodo central: AI Agent

* Model: OpenAI GPT-4o (API Key configurada en Credentials).
* Tools:

  * `get_status()` → HTTP GET a `/status`.
  * `restart_service()` → HTTP POST a `/restart`.
  * `send_email(subject, body)` → Gmail/SMTP.

### Lógica del prompt:

1. Detecta si vino `chatInput` o fue cron/webhook.
2. Si es reporte manual (`chatInput` con "error"/...)
3. Llama a `get_status()`.
4. Si no OK: `restart_service()` + `send_email()` + responde en chat.
5. Si OK y hubo chat: `send_email()` informativo + responde en chat.
6. Si webhook de ataque: envía alerta distinta.

---

## 4. Simulaciones y pruebas

```bash
# Simular caída
curl.exe -X POST http://localhost:3000/simulate-down
# Simular ataque (si está implementado)
curl.exe -X POST http://localhost:3000/simulate-attack
# Probar webhook de ataque contra n8n
Invoke-RestMethod `
  -Uri "http://localhost:5678/webhook-test/attack-alert" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{ "detail": "SQLi detectado" }'

# Probar chat trigger: envía mensaje en UI de n8n
# Probar cron: activa Run once o espera al intervalo
```

---


