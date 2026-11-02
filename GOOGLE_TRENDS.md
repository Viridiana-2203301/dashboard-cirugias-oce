Google Trends por región
========================

Copia los archivos CSV exportados desde Google Trends con estos nombres exactos:

- México: frontend/data/google-trends/mexico/by_region_MX.csv
- Estados Unidos: frontend/data/google-trends/eeuu/by_region_US.csv

Estos archivos se publican desde `frontend/data/google-trends/` junto con el sitio de Vercel. Mantén aquí los CSV actualizados; no se necesita una copia adicional.

El lector reconoce la primera columna como región (por ejemplo Region, Subregion, Estado o State) y las columnas restantes como términos con valores numéricos de interés. Encabezados de términos como Rinoplastia, Liposucción, Aumento de senos, Abdominoplastia, Blefaroplastia, Toxina botulínica, Rellenos dérmicos y Botox se detectan automáticamente. Conserva los encabezados de términos que exporte Trends; no hace falta renombrarlos.

Abre el dashboard mediante un servidor HTTP, como Live Server. La carga con file:// está bloqueada por los navegadores.

Este archivo by_region permite comparar interés regional agregado para el periodo elegido en Google Trends. No incluye fechas, así que no permite reconstruir una curva temporal ni comparar años por separado. Para análisis cronológico se requiere además exportar el tipo Interest over time para ambos países y añadir un lector específico; no se inferirá una serie temporal a partir del ranking regional.

Los valores de Trends son índices relativos de interés de búsqueda, no volúmenes absolutos ni procedimientos realizados. La tabla muestra el top 20 de cada término/país; selecciona un país a la vez para consultar sus regiones dentro de la escala de ese CSV.


El mapa usa límites GeoJSON externos de [México](https://github.com/strotgen/mexico-leaflet/blob/master/states.geojson) y [Estados Unidos](https://github.com/PublicaMundi/MappingAPI/blob/master/data/geojson/us-states.json). Se dibujan como SVG directamente en el navegador, sin D3 ni TopoJSON. Requiere conexión a Internet para descargar los archivos. Si falta conexión, la tabla regional permanece disponible.

## Filtros del panel

El país y el procedimiento se enlazan con los filtros principales cuando existe una equivalencia entre el nombre ISAPS y el encabezado del CSV de Trends. La gráfica, tabla y mapa usan únicamente el término seleccionado. El mapa compara estados con una escala de color relativa dentro de ese término; el tooltip muestra solo su índice para el estado elegido.

El panel de Trends usa el periodo agregado que ya contiene el CSV. El filtro anual ISAPS no se aplica a Trends porque estos archivos `by_region` no incluyen fechas; el filtro anual del dashboard sigue afectando las demás visualizaciones ISAPS.
