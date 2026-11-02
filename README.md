# OCE · Observatorio de Cirugías Estéticas

Dashboard académico de precios, procedimientos y tendencias para México y Estados Unidos. El proyecto contiene un sitio estático y una API Flask. Los registros son agregados y los CSV de Google Trends se publican como archivos estáticos junto al sitio.

## Estructura

- `frontend/`: sitio estático que se despliega en Vercel.
- `backend/`: API Flask y CSV compacto que se despliegan en Render.
- `scripts/build_dashboard_data.py`: reconstruye el CSV compacto desde el CSV original de 64 MB.
- `render.yaml`: configuración del servicio API en Render.

## Probar localmente

Para ver el sitio sin desplegar, abre `frontend/index.html` con Live Server en VS Code. `frontend/js/config.js` viene con `API_BASE_URL` vacío y carga el CSV compacto local. No abras el archivo con doble clic (`file://`).

Para ejecutar también la API, instala Python 3.10 o posterior, crea un entorno virtual en `backend/`, instala `backend/requirements.txt` y ejecuta `python app.py` desde esa carpeta. La API estará en `http://127.0.0.1:5000`; `/api/health` confirma el estado y `/api/procedimientos` entrega los registros.


## Datos y alcances

La tabla y los indicadores usan grupos compactos de `cirugia_estetica.csv`, que representan 932,539 observaciones originales. Los archivos de precios, ciudades y cirujanos son datos agregados descriptivos. Los CSV de Google Trends ofrecen índices relativos (0–100), no volúmenes absolutos ni cirugías realizadas. Consulta “Acerca de los datos” en el dashboard para ver sus alcances.

El CSV original de 64 MB solo es necesario para reconstruir los agregados; la aplicación desplegada no lo lee. El endpoint `/api/procedimientos` publica todos los grupos compactos y las vistas aplican filtros en el navegador.
