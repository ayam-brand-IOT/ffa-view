# user-interface

Frontend operativo del sistema FFA. Esta aplicacion Vue 3 permite administrar lotes, ejecutar analisis, revisar historico, calibrar vision y ajustar parametros por especie.

## Stack

- Vue 3
- Vue Router 4
- Vuex 4
- Vuetify 3
- Axios
- Socket.IO Client
- Vue CLI 5

## Estructura relevante

```text
user-interface/
├── src/
│   ├── App.vue
│   ├── config/index.js
│   ├── router/index.js
│   ├── store/index.js
│   ├── components/
│   └── views/
├── public/
├── package.json
└── vue.config.js
```

## Instalacion

```bash
cd user-interface
npm install
```

## Comandos

### Desarrollo

```bash
npm run serve
```

Servidor local en `http://localhost:8080`.

### Build

```bash
npm run build
```

La salida queda en `user-interface/dist/`.

## Integracion con backend

La aplicacion habla con dos servicios:

- `ffa-app` para video, sockets, calibraciones y configuracion de vision
- `ffa-server` para lotes, muestras, imagenes extra, tension y exportacion

### Configuracion actual en codigo

`src/config/index.js` define hoy:

- entorno de desarrollo:
  - `DEV_URL = http://192.168.99.134`
  - `DEV_PORT = 3002`
  - `URL_SERVER = http://192.168.99.134:3030/`
- entorno de produccion:
  - `ffa-app` por ruta relativa `/`
  - `ffa-server` en `http://<hostname>:3002`

Esto significa que para trabajar en otro host o IP hay que editar manualmente `src/config/index.js`.

## Navegacion real

Rutas definidas en `src/router/index.js`:

| Ruta | Vista | Uso |
| --- | --- | --- |
| `/` | `LotInfo.vue` | Alta, edicion, busqueda y seleccion de lotes |
| `/analyse-lot` | `HomeView.vue` | Pantalla principal de analisis |
| `/log` | `Log.vue` | Historial del lote seleccionado |
| `/broken-belly-test` | `BrokenBellyTest.vue` | Prueba de resistencia/rotura |
| `/muestra/:id` | `Muestra.vue` | Detalle de una muestra |
| `/lot-images` | `LotImages.vue` | Imagenes extra del lote |
| `/config` | `ConfigWrapper.vue` | Contenedor de configuracion |
| `/config/weight-calibration` | `LoadCell.vue` | Calibracion de load cell |
| `/config/zoi-calibration` | `ZOICalib.vue` | Calibracion de zona de interes |
| `/config/export-lot-data` | `ExportLot.vue` | Descarga de Excel por lote |
| `/config/length-calibration` | `LengthCalib.vue` | Calibracion de longitud |
| `/config/fish-parameters` | `FishParameters.vue` | Parametros por especie y tipo |

## Flujo principal de uso

1. En `/` se consulta la lista de lotes y se puede buscar por `wms_code`, `lot_no` o `supplier`.
2. El icono verde arranca analisis y manda `fish_species` y `type` por socket para cargar parametros de vision.
3. `/analyse-lot` muestra video en vivo, imagen analizada, peso, acciones de captura y accesos al log.
4. `/log` consulta muestras, imagenes extra y pruebas de tension del lote activo.
5. `/config` agrupa calibraciones y configuraciones persistentes.

## Estado global

`src/store/index.js` guarda:

- `socket_instance`
- `analyzing_lot`
- `last_analysed_id`

## Endpoints y eventos que consume

### Desde `ffa-app`

- Socket.IO:
  - `weight_update`
  - `tension_update`
  - `frame_ready`
  - `analysis_data`
- HTTP:
  - `/video_feed`
  - `/analyzed_image`
  - `/length_calibration`
  - `/calibrate_zoi`
  - `/get_config`
  - `/update_config`

### Desde `ffa-server`

- `/lots`
- `/add_lot`
- `/edit_lot`
- `/lot_samples/:lot_no`
- `/lot_samples_full/:lot_no`
- `/lot_images/:lot_no`
- `/lot_tension/:lot_no`
- `/download-lot-samples/:lot_no`
- `/muestra_image/:path`
- `/lot_image/:path`

## Despliegue junto con `ffa-app`

Cuando la UI se va a servir desde la Raspberry o desde el equipo de operacion:

1. compilar frontend
   ```bash
   npm run build
   ```
2. copiar `user-interface/dist/` dentro de `ffa-app/dist/`
3. arrancar `ffa-app`

`ffa-app/app.py` sirve `index.html` y `dist/static/` desde esa carpeta.

## Limitaciones actuales

- no hay script de tests en `package.json`
- la configuracion de desarrollo esta hardcodeada
- varias vistas asumen que `ffa-app` y `ffa-server` estan disponibles y no usan capa de env moderna

## Load Cell Calibration Feedback

The calibration dialog at `/config` requires the diagnostic backend that echoes
`request_id`, `step`, and `args` in `calibration_step_commited` and
`calibration_error`. Older uncorrelated replies are not accepted as success.

- Backend rejections remain visible in the dialog instead of leaving a spinner open.
- Each step has a unique request ID. Duplicate, unrelated, or late replies cannot
  advance the wizard or create a second history entry.
- The reference step is not completion: only a confirmed step 4 shows that the
  transmitter saved and verified the calibration. History recording errors are
  reported separately.
- Disconnects, session expiry, and a 30-second response timeout stop the wizard.
  No calibration command is retried automatically or queued while disconnected.
- Stopping while a request is pending does not roll back transmitter changes.
  Another calibration is disabled until that request receives a terminal reply.
  If no reply arrives, inspect the transmitter and server before reloading.
- Socket listeners follow late initialization and replacement, and are removed
  when leaving the page. Cancellation releases the client's calibration session.

`TLB_STATUS_MAP_VERIFIED=false` intentionally blocks guided calibration in the
diagnostic backend. This frontend fix does not change that flag or validate the
firmware status map. Do not enable it simply to dismiss the error. The previous
bench result of 999.0 g after a power cycle, against a nominal 1000 g reference,
remains outside the diagnostic +/-0.5 g acceptance check. The bottle used was not
a certified reference weight, so these checks do not establish physical accuracy.

Run the isolated component regression tests (mock socket and clock, no hardware):

```bash
node --test tests/calibrateScale.test.cjs
npm run build
```

### Debug Station Rollout (2026-09-25)

The compiled UI was copied into `/app/dist` in the existing `ffa-app` container
on `raspberry.local:3030`. The container was restarted to invalidate Flask's
cached HTML template. Existing hashed assets were retained for already-open tabs.
`ffa-server` and the transmitter configuration were not changed.

Backup and build archive on the debug station:
`/home/pi/ffa-debug-backups/ui-feedback-20260925.79TmwA/`.
`dist-before` contains the previous UI; `dist-new` contains this build.

This is a running-container update, not a rebuilt Docker image. Recreating the
container from its current image will restore the old UI. Include the frontend
build in the next image before promoting it elsewhere.

To restore the previous UI on this debug station:

```bash
docker cp /home/pi/ffa-debug-backups/ui-feedback-20260925.79TmwA/dist-before/. ffa-app:/app/dist/
docker restart ffa-app
```

The local build and deployed files matched SHA-256 checksums. Browser checks use
a mocked socket with the real Socket.IO connection blocked; they do not validate
physical calibration or authorize enabling the firmware-status gate.
