# API OCE

La API sirve el archivo compacto `data/cirugia_estetica_dashboard.csv` desde `/api/procedimientos` y expone `/api/health` para comprobar el servicio. `FRONTEND_ORIGIN` acepta uno o varios orígenes separados por comas; en producción se configura con el dominio del frontend en Vercel.

En Render, el directorio raíz del servicio es `backend`, el comando de instalación es `pip install -r requirements.txt` y el de inicio es `gunicorn app:app`. El Blueprint del proyecto ya contiene esa configuración. El archivo CSV debe acompañar al backend en `data/`.
