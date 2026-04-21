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
