# Propuesta técnica de escalabilidad

## Contexto

El servicio procesa un archivo línea por línea, acumulando registros en batches que se insertan en SQL Server vía bulk insert. Corre en un pod de Kubernetes con 200m de CPU y 256Mi de memoria.

## Estrategias de escalamiento

### 1. Optimización dentro de la instancia actual

Sin cambios de arquitectura, se pueden ajustar parámetros para reducir el tiempo de procesamiento:

- **Aumentar batch size**: Cambiar la constante `BATCH_SIZE` a 5.000-10.000 en archivos grandes para reducir llamados a la base de datos. El costo es mayor consumo de memoria por batch, pero con 256Mi hay margen de sobra.
- **Aumentar pool de conexiones**: Pasar de 2 a 4-8 conexiones para permitir enviar el siguiente batch mientras el anterior se commitea.
- **Ajustar logging**: Cambiar la constante `PROGRESS_LOG_INTERVAL` a 100.000 para reducir logs de progreso y no saturar la salida estándar.

### 2. Lectura y escritura concurrentes

#### Arquitectura

El cuello de botella es que la lectura se bloquea mientras espera que el bulk insert termine. La solución es separar ambas operaciones con un buffer intermedio:

```
[Lectura + Parsing] → [Buffer (máx N batches)] → [Inserción en DB]
```

#### Funcionamiento

Mientras la base de datos procesa el batch N, el parser ya está preparando el batch N+1. Si el buffer alcanza su límite (por ejemplo 5 batches), la lectura se pausa automáticamente hasta que se libere espacio (backpressure). Esto solapa I/O de archivo con I/O de red sin exceder el consumo de memoria.

#### Implementación

Se mantiene un array de batches pendientes con un límite máximo. Se usa `Promise.all()` con concurrencia controlada: mientras haya espacio en el buffer, se sigue leyendo. Cuando se llena, se espera a que termine al menos una inserción antes de continuar.

#### Ventajas

- **Aprovecha tiempos muertos**: Mientras SQL Server inserta, Node.js sigue leyendo y procesando el siguiente lote
- **Eficiencia en recursos limitados**: Aumenta el throughput sin exceder el consumo de memoria, ya que el buffer está acotado

> **`/ingestion/status`:** Al seguir corriendo en un solo proceso, `ProcessingStateManager` en memoria sigue siendo válido.

### 3. Escalamiento horizontal

#### Arquitectura

La solución utiliza un patrón **producer-consumer** con cola de mensajes:

```
[Lectura + Parsing] ---> [Cola (RabbitMQ/Redis/SQS)] ---> [N Workers] ---> [Inserción en DB]
```

#### Funcionamiento

Un **pod coordinador** lee el archivo y lo divide en chunks de un tamaño específico. Cada chunk se publica como mensaje en una cola. Múltiples **pods workers** consumen estos mensajes en paralelo, procesan las líneas usando streams y realizan inserts en batches.

#### Implementación

El coordinador itera sobre offsets del archivo publicando chunks. Los workers consumen mensajes, crean un `ReadStream` con el rango asignado, procesan líneas y ejecutan batch inserts.

#### Ventajas

- **Tolerancia a fallos**: Si un worker falla, el mensaje vuelve a la cola
- **Escalamiento lineal**: 10 workers = 10x velocidad de procesamiento
- **Sin cambios para archivos más grandes**: Mismo código, solo aumentar cantidad de workers

> **`/ingestion/status`:** Con múltiples pods, el estado en memoria queda fragmentado. Habría que migrar `ProcessingStateManager` a un store compartido (Redis o una tabla en la base de datos) para que el endpoint refleje el progreso global.
