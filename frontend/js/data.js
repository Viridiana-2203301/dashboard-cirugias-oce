import { API_BASE_URL } from './config.js';

export const CSV_PATH = './data/cirugia_estetica_dashboard.csv';
const numericColumns = ['Year','Record Count','Surgeons Sum','Average Price Sum','Min Price Sum','Max Price Sum','Min Average Price','Max Average Price','Range Min','Range Max'];
const numberFrom = value => {
  if (value == null || String(value).trim() === '') return null;
  const parsed = Number(String(value).replace(/[$,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};
export async function loadData() {
  if (!globalThis.Papa) throw new Error('No se pudo cargar Papa Parse. Revisa tu conexión a Internet y recarga la página.');
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/api/procedimientos`);
    if (!response.ok) throw new Error(`No se pudo leer la API (HTTP ${response.status}).`);
    const rows = await response.json();
    if (!Array.isArray(rows) || !rows.length) throw new Error('La API no devolvió registros.');
    return rows.map((row, index) => {
      for (const key of numericColumns) {
        row[key] = numberFrom(row[key]);
        if (!Number.isFinite(row[key])) throw new Error(`Valor numérico inválido en la fila ${index + 2}: ${key}.`);
      }
      row.Country = ({ 'United States': 'Estados Unidos', Mexico: 'México' })[row.Country] || row.Country;
      const count = row['Record Count'];
      row['Number of Surgeons'] = row['Surgeons Sum'] / count;
      row['Average Price'] = row['Average Price Sum'] / count;
      row['Min Price'] = row['Min Price Sum'] / count;
      row['Max Price'] = row['Max Price Sum'] / count;
      row['Price Range'] = `$${row['Range Min']}-$${row['Range Max']}`;
      return row;
    });
  }
  const response = await fetch(CSV_PATH);
  if (!response.ok) throw new Error(response.status === 404 ? 'No se encontró frontend/data/cirugia_estetica_dashboard.csv.' : `No se pudo leer el CSV (HTTP ${response.status}).`);
  const parsed = Papa.parse(await response.text(), { header:true, skipEmptyLines:'greedy', transformHeader:h=>h.trim().replace(/^\uFEFF/,'') });
  if (parsed.errors.length) throw new Error('El CSV compacto tiene filas con formato incorrecto: ' + parsed.errors[0].message);
  const required = ['Year','Country','City','Procedure',...numericColumns.slice(1)];
  const missing = required.filter(key=>!parsed.meta.fields.includes(key));
  if (missing.length) throw new Error('Faltan columnas en el archivo optimizado: ' + missing.join(', '));
  if (!parsed.data.length) throw new Error('El archivo optimizado no contiene registros.');
  return parsed.data.map((row,index)=>{
    for (const key of numericColumns) {
      row[key]=numberFrom(row[key]);
      if (!Number.isFinite(row[key])) throw new Error(`Valor numérico inválido en la fila ${index+2}: ${key}.`);
    }
    row.Country=({'United States':'Estados Unidos',Mexico:'México'})[row.Country]||row.Country;
    const count=row['Record Count'];
    row['Number of Surgeons']=row['Surgeons Sum']/count;
    row['Average Price']=row['Average Price Sum']/count;
    row['Min Price']=row['Min Price Sum']/count;
    row['Max Price']=row['Max Price Sum']/count;
    row['Price Range']=`$${row['Range Min']}-$${row['Range Max']}`;
    return row;
  });
}
export function validateData(rows) {
  const records=rows.reduce((sum,row)=>sum+row['Record Count'],0);
  const keys=new Set(rows.map(r=>JSON.stringify([r.Year,r.Country,r.City,r.Procedure])));
  return [
    [`${records.toLocaleString('es-MX')} observaciones originales representadas`, records>0],
    [`${rows.length.toLocaleString('es-MX')} grupos compactos sin claves duplicadas`, keys.size===rows.length],
    ['Rangos de precio interpretados',rows.every(r=>Number.isFinite(r['Range Min'])&&Number.isFinite(r['Range Max']))],
    ['Promedios dentro de los rangos observados',rows.every(r=>r['Range Min']<=r['Average Price']&&r['Average Price']<=r['Range Max'])]
  ];
}
