# OCE · Observatorio de Cirugías Estéticas

## URL
https://dashboard-cirugias-oce-frontend.vercel.app/

Dashboard académico de precios, procedimientos y tendencias para México y Estados Unidos. El proyecto contiene un sitio estático y una API Flask. Los registros son agregados y los CSV de Google Trends se publican como archivos estáticos junto al sitio.

## Estructura

- `frontend/`: sitio estático que se despliega en Vercel.
- `backend/`: API Flask y CSV compacto que se despliegan en Render.
- `scripts/build_dashboard_data.py`: reconstruye el CSV compacto desde el CSV original de 64 MB.
- La API se crea como Web Service manual en Render. `render.yaml` es opcional y no se usa en ese flujo.

## Probar localmente

Para ver el sitio sin desplegar, abre `frontend/index.html` con Live Server en VS Code. `frontend/js/config.js` viene con `API_BASE_URL` vacío y carga el CSV compacto local. No abras el archivo con doble clic (`file://`).

Para ejecutar también la API, instala Python 3.10 o posterior, crea un entorno virtual en `backend/`, instala `backend/requirements.txt` y ejecuta `python app.py` desde esa carpeta. La API estará en `http://127.0.0.1:5000`; `/api/health` confirma el estado y `/api/procedimientos` entrega los registros.

## Publicar en Render y Vercel

1. **Usa el repositorio en GitHub.** El proyecto ya está en el repositorio privado `Viridiana-2203301/dashboard-cirugias-oce`. Incluye `backend/data/cirugia_estetica_dashboard.csv` y los CSV de Trends dentro de `frontend/data/google-trends/`. No subas `.env`, entornos virtuales ni `__pycache__`.
2. **Crea la API en Render.** En Render elige *New +* → *Web Service*, conecta GitHub y selecciona `dashboard-cirugias-oce`. Configura:
   - **Name:** `oce-api` (o un nombre disponible).
   - **Branch:** `main`.
   - **Root Directory:** `backend`.
   - **Runtime/Language:** Python 3.
   - **Build Command:** `pip install -r requirements.txt`.
   - **Start Command:** `gunicorn app:app`.
   - En **Advanced**, fija **Health Check Path** en `/api/health`.
   - En **Instance Type**, selecciona el plan que quieras usar. Render ofrece servicios web Free con limitaciones; revisa las restricciones actuales antes de usarlo para producción.
   Luego pulsa **Create Web Service** y espera el despliegue. Estos son los campos que Render solicita para un Web Service desde GitHub y un subdirectorio de monorepo. [Documentación de Web Services](https://render.com/docs/web-services), [planes Free y sus límites](https://render.com/docs/free).
3. **Copia la URL de Render.** Espera a que el servicio quede *Live*. La URL tendrá una forma como `https://oce-api.onrender.com`. Abre esa URL y `/api/health`; debe devolver `{"status":"ok","data_file":true}`. `/api/procedimientos` debe devolver una lista JSON.
4. **Crea el sitio en Vercel.** Importa el mismo repositorio. En la configuración del proyecto indica `frontend` como *Root Directory*, framework *Other*, deja vacíos el comando de build y el directorio de salida, y despliega. Vercel servirá `index.html` directamente.
5. **Conecta el frontend con Render.** En el repositorio, edita `frontend/js/config.js` y reemplaza la cadena vacía por la URL pública de Render, sin `/api` ni barra final; por ejemplo: `export const API_BASE_URL = 'https://oce-api.onrender.com';`. Guarda y sube el cambio a GitHub. Vercel volverá a desplegar el sitio automáticamente.
6. **Configura CORS en Render.** En *Environment* del servicio agrega `FRONTEND_ORIGIN` con el origen exacto de Vercel, por ejemplo `https://oce-dashboard.vercel.app` (sin ruta ni barra final). Si usas un dominio propio, incluye también el dominio `www` separado por coma. Guarda; Render reiniciará la API.
7. **Verifica el sitio publicado.** Recarga Vercel y confirma que aparezca el estado de datos listos, explora filtros y gráficos, abre Google Trends y revisa que no haya errores de CORS en las herramientas de desarrollador del navegador.

Si cambias el CSV fuente, reconstruye el compacto ejecutando `python scripts/build_dashboard_data.py` desde `dashboard-cirugias`; después copia el CSV generado a `backend/data/cirugia_estetica_dashboard.csv`, sube ambos CSV y espera los despliegues automáticos.

## Datos y alcances

La tabla y los indicadores usan grupos compactos de `cirugia_estetica.csv`, que representan 932,539 observaciones originales. Los archivos de precios, ciudades y cirujanos son datos agregados descriptivos. Los CSV de Google Trends ofrecen índices relativos (0–100), no volúmenes absolutos ni cirugías realizadas. Consulta “Acerca de los datos” en el dashboard para ver sus alcances.

El CSV original de 64 MB solo es necesario para reconstruir los agregados; la aplicación desplegada no lo lee. El endpoint `/api/procedimientos` publica todos los grupos compactos y las vistas aplican filtros en el navegador.
