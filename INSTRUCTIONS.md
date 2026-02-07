# Instrucciones para levantar el proyecto

## Requisitos previos

- **Docker** (v29+)
- **Node.js** (v24+)
- **npm** (v11+)

> Node.js y npm son opcionales para levantar el proyecto con Docker, pero necesarios para generar el archivo de datos y ejecutar los tests.

---

## 1. Generar el archivo de datos

Desde la raíz del proyecto:

```bash
npx ts-node data-generator/src/generateFile.ts
```

Esto crea el archivo en `data-generator/challenge/input/CLIENTES_IN_0425.dat`.

### Parámetros configurables

Dentro de `data-generator/src/generateFile.ts` podés ajustar:

```ts
const RECORDS = 100_000; // Cantidad de líneas
const ERROR_RATE = 0.2; // 20% de líneas con errores intencionales
```

---

## 2. Levantar el proyecto con Docker Compose

Desde la raíz del proyecto:

```bash
docker compose up --build
```

Esto levanta tres servicios en orden:

1. **db** — SQL Server en el puerto `1433`
2. **migrate** — Ejecuta `scripts/init.sql` para crear la base de datos y la tabla
3. **app** — El servicio Node.js en el puerto `3000`

> El servicio `app` espera a que la migración termine exitosamente antes de iniciar.

### Detener el proyecto

```bash
docker compose down
```

Para eliminar también los datos persistidos de SQL Server:

```bash
docker compose down -v
```

---

## 3. Variables de entorno

Las variables tienen valores por defecto definidos en `docker-compose.yml`. Podés sobreescribirlas creando un archivo `.env` en la raíz:

| Variable      | Valor por defecto | Descripción                                        |
|---------------|-------------------|----------------------------------------------------|
| `APP_ENV`     | `development`     | Entorno (`development` / `production` / `test`)    |
| `DB_SERVER`   | `db`              | Host de SQL Server                                 |
| `DB_PORT`     | `1433`            | Puerto de SQL Server                               |
| `DB_NAME`     | `challenge_db`    | Nombre de la base de datos                         |
| `DB_USER`     | `sa`              | Usuario de SQL Server                              |
| `DB_PASSWORD` | `JhQxInScWm!`     | Contraseña de SQL Server                           |
| `LOG_LEVEL`   | `info`            | Nivel de log (`debug` / `info` / `warn` / `error`) |
| `PORT`        | `3000`            | Puerto HTTP de la aplicación Node.js               |

---

## 4. Endpoints disponibles

### `GET /health`

Health check del servicio.

```bash
curl http://localhost:3000/health
```

**Respuesta:**

```json
{ "status": "ok" }
```

---

### `POST /ingestion/start`

Inicia el procesamiento del archivo de forma asíncrona. Responde inmediatamente con HTTP `202`.

```bash
curl -X POST http://localhost:3000/ingestion/start
```

**Respuesta:**

```json
{ "message": "File processing started" }
```

---

### `GET /ingestion/status`

Consulta el estado actual del procesamiento.

```bash
curl http://localhost:3000/ingestion/status
```

**Respuesta:**

```json
{
  "status": "completed",
  "startedAt": "2026-02-07T15:04:40.630Z",
  "finishedAt": "2026-02-07T15:04:40.665Z",
  "totalLinesRead": 100,
  "totalInserted": 80,
  "totalErrors": 20,
  "currentBatch": 1,
  "errors": [
    {
      "line": 1,
      "raw": "callide odio umquam catena terror subiungo talus aspernatur cotidie allatus cena admoneo adversus villa adhaero utrimque brevis ustilo ulterius angelus quaerat territo aestas varietas surgo sint spiritus degenero vis curso adulescens summa maiores umerus traho tempus ulciscor aeger aeger vetus assentator considero vehemens commemoro theologus ubi uredo xiphias amplexus damnatio|tertius viscus aetas adfero alo decumbo via ad aptus cervus thermae cibo nesciunt comedo adopto sumptus vomito statua commodi verto spiculum concedo aliqua dedecor statim vesica voro repellat tandem coerceo illo temeritas verumtamen coadunatio quia crebro amitto celebrer pectus coaegresco torrens suasoria absorbeo abbas via armarium adamo modi deludo super|28761078|Inactivo|8/31/2017|true|false",
      "reason": "Invalid nombreCompleto"
    }
  ]
}
```

---

### `GET /metrics`

Métricas del proceso (uso de memoria, CPU y uptime).

```bash
curl http://localhost:3000/metrics
```

**Respuesta:**

```json
{
  "memory": {
    "rss": 92.57,
    "heapUsed": 21.02
  },
  "cpu": {
    "userSeconds": 0.54,
    "systemSeconds": 0.12
  },
  "uptimeSeconds": 16.67
}
```

---

## 5. Ejecutar los tests

```bash
npm install
npm test
```

---

## 6. Notas adicionales

- El proyecto cuenta con manejo de finalización del proceso mediante señales `SIGTERM` y `SIGINT`, cerrando conexiones activas de forma ordenada antes de finalizar el proceso.
- El servicio implementa rate limiting (100 requests/minuto en producción) y headers de seguridad vía Helmet.
- Las líneas corruptas del archivo se registran como errores, pero no interrumpen el procesamiento. Se almacenan hasta 100 errores en memoria para consulta vía `/ingestion/status`.
- La propuesta de escalabilidad del sistema se encuentra documentada en `SCALABILITY.md`.
