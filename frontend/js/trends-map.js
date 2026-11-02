const MEXICO = 'M\u00e9xico';
const SOURCES = {
  [MEXICO]: 'https://raw.githubusercontent.com/strotgen/mexico-leaflet/master/states.geojson',
  'Estados Unidos': 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json'
};
const cache = new Map();
let renderVersion = 0;
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function termColor(term,index=0){
  const key=normalize(term);
  if(key.includes('rhinoplast')||key.includes('rinoplast'))return'#3478f6';
  if(key.includes('liposuction')||key.includes('liposuccion'))return'#ef4444';
  if(key.includes('breastaugment')||key.includes('breastimplant')||key.includes('aumentodesenos'))return'#eab308';
  if(key.includes('abdominoplast')||key.includes('tummytuck'))return'#16a34a';
  if(key.includes('blepharoplast')||key.includes('eyelidsurgery'))return'#f97316';
  if(key==='botox')return'#ec4899';
  if(key.includes('botulinum')||key.includes('toxinabotulinica'))return'#8b5cf6';
  if(key.includes('dermalfiller')||key.includes('rellenosdermicos'))return'#06b6d4';
  if(key.includes('facelift')||key.includes('liftingfacial'))return'#a855f7';
  return['#3478f6','#ef4444','#eab308','#16a34a','#f97316','#8b5cf6','#06b6d4','#ec4899'][index%8];
}
function regionKey(name, country) {
  let key=normalize(name);
  if(country===MEXICO){
    if(['stateofmexico','estadodemexico'].includes(key))key='mexico';
    if(['cdmx','mexicocity','distritofederal'].includes(key))key='ciudaddemexico';
    if(key==='michoacan')key='michoacandeocampo';
    if(key==='veracruz')key='veracruzdeignaciodelallave';
    if(key==='coahuila')key='coahuiladezaragoza';
  }
  return key;
}
async function getShapes(country){
  if(cache.has(country))return cache.get(country);
  const pending=(async()=>{
    const url=SOURCES[country];
    if(!url)throw new Error('No hay mapa configurado para este pa\u00eds.');
    const response=await fetch(url);
    if(!response.ok)throw new Error(`HTTP ${response.status} al descargar los l\u00edmites.`);
    const data=await response.json(),features=data.features||[];
    if(!features.length)throw new Error('El archivo geogr\u00e1fico no contiene estados GeoJSON.');
    return features.map(feature=>({name:feature.properties?.state_name||feature.properties?.name||feature.properties?.ADM1_ES||feature.properties?.NOM_ENT,feature})).filter(item=>item.name);
  })();
  cache.set(country,pending);
  try{return await pending;}catch(error){cache.delete(country);throw error;}
}
function rings(feature){
  const geometry=feature.geometry;
  if(!geometry)return[];
  if(geometry.type==='Polygon')return geometry.coordinates;
  if(geometry.type==='MultiPolygon')return geometry.coordinates.flat();
  return[];
}
function coordinates(features){return features.flatMap(item=>rings(item.feature));}
function projectBox(points,rect,cosine){
  const project=([lon,lat])=>[lon*cosine,-lat];
  const projected=points.flat().map(project);
  const xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const scale=Math.min(rect.width/Math.max(maxX-minX,0.001),rect.height/Math.max(maxY-minY,0.001));
  const offsetX=rect.x+(rect.width-(maxX-minX)*scale)/2,offsetY=rect.y+(rect.height-(maxY-minY)*scale)/2;
  return point=>{const [x,y]=project(point);return[offsetX+(x-minX)*scale,offsetY+(y-minY)*scale];};
}
function featurePath(feature,transform){
  return rings(feature).map(ring=>ring.map((point,index)=>{const [x,y]=transform(point);return`${index?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`;}).join('')+'Z').join('');
}
function fillColor(value,base,min,max){
  if(!Number.isFinite(value))return'#e8edf5';
  const ratio=max>min?0.32+Math.pow((value-min)/(max-min),0.65)*0.68:0.68;
  const from=[243,245,250],to=base.match(/[\da-f]{2}/gi).map(x=>parseInt(x,16));
  return`rgb(${from.map((n,i)=>Math.round(n+(to[i]-n)*ratio)).join(',')})`;
}
function appendGroup(svg,items,rect,cosine,values,rows,country,term,base,min,max){
  if(!items.length)return;
  const transform=projectBox(coordinates(items),rect,cosine);
  for(const item of items){
    const key=regionKey(item.name,country),value=values.get(key);
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d',featurePath(item.feature,transform));
    path.setAttribute('fill',fillColor(value,base,min,max));path.setAttribute('stroke','#fff');path.setAttribute('stroke-width','1.4');path.setAttribute('vector-effect','non-scaling-stroke');path.setAttribute('fill-rule','evenodd');path.setAttribute('tabindex','0');
    const title=document.createElementNS('http://www.w3.org/2000/svg','title');
    const related=rows.find(row=>regionKey(row.region,country)===key);
    title.textContent=`${item.name}\n${term}: ${related?`${Number(related.value.toFixed(1))}${related.percent?'%':''}`:'Sin dato'}`;
    path.append(title);svg.append(path);
  }
}
export async function renderRegionMap(country,rows,term){
  const version=++renderVersion,host=document.getElementById('trends-map');
  if(!term||!rows.length){host.replaceChildren();const message=document.createElement('p');message.className='map-error';message.textContent='No hay datos de Trends para esta combinacion de filtros. Revisa el periodo y el procedimiento.';host.append(message);return;}
  host.replaceChildren();const loading=document.createElement('p');loading.className='map-loading';loading.textContent='Cargando mapa de estados\u2026';host.append(loading);
  try{
    const shapes=await getShapes(country);if(version!==renderVersion)return;
    const width=Math.max(320,host.clientWidth||680),height=420;
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.setAttribute('role','img');svg.setAttribute('aria-label',`Inter\u00e9s de b\u00fasqueda por estado en ${country}`);
    const base=termColor(term);
    const values=new Map(rows.map(row=>[regionKey(row.region,country),row.value]));
    const range=[...values.values()].filter(Number.isFinite),min=range.length?Math.min(...range):0,max=range.length?Math.max(...range):100;
    if(country===MEXICO){
      const latitudes=coordinates(shapes).flat().map(p=>p[1]),center=(Math.min(...latitudes)+Math.max(...latitudes))/2;
      appendGroup(svg,shapes,{x:12,y:8,width:width-24,height:height-28},Math.cos(center*Math.PI/180),values,rows,country,term,base,min,max);
    }else{
      const alaska=shapes.filter(x=>x.name==='Alaska'),hawaii=shapes.filter(x=>x.name==='Hawaii'),mainland=shapes.filter(x=>!['Alaska','Hawaii'].includes(x.name));
      appendGroup(svg,mainland,{x:width*.19,y:12,width:width*.79,height:height-30},Math.cos(38*Math.PI/180),values,rows,country,term,base,min,max);
      appendGroup(svg,alaska,{x:10,y:18,width:width*.2,height:height*.27},Math.cos(60*Math.PI/180),values,rows,country,term,base,min,max);
      appendGroup(svg,hawaii,{x:width*.12,y:height*.72,width:width*.17,height:height*.14},Math.cos(20*Math.PI/180),values,rows,country,term,base,min,max);
    }
    host.replaceChildren(svg);
    const legend=document.createElement('div');legend.className='map-legend';legend.innerHTML=`<span>Menor (${min})</span><i></i><span>Mayor (${max})</span><span class="map-no-data">Sin datos</span>`;legend.querySelector('i').style.setProperty('--map-color',base);host.append(legend);
    const matched=shapes.filter(item=>values.has(regionKey(item.name,country))).length;
    const coverage=document.createElement('p');coverage.className='map-coverage';coverage.textContent=`${matched} de ${shapes.length} estados tienen datos para ${term}.`;host.append(coverage);
  }catch(error){
    if(version!==renderVersion)return;
    host.replaceChildren();const notice=document.createElement('p');notice.className='map-error';notice.textContent=`No se pudo cargar el mapa. ${error.message} La tabla regional sigue disponible.`;host.append(notice);
  }
}
