import {countries,unique,label,money,number,recordCount,weightedMean} from './utils.js';
const colors=['#6D28D9','#DB2777','#8B5CF6','#C4B5FD','#4C1D95','#B679A5'];const instances=new Map();
function draw(id,type,labels,datasets,{horizontal=false,currency=false}={}){
  instances.get(id)?.destroy();const doughnut=type==='doughnut';
  const chart=new Chart(document.getElementById(id),{type,data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,animation:false,indexAxis:horizontal?'y':'x',cutout:doughnut?'72%':undefined,
    plugins:{legend:{display:doughnut||datasets.length>1,position:'bottom',labels:{usePointStyle:true,padding:18,boxWidth:8}},tooltip:{callbacks:{label:c=>`${c.dataset.label||c.label}: ${currency?money(c.parsed[doughnut?'':horizontal?'x':'y']??c.parsed):number(c.parsed[doughnut?'':horizontal?'x':'y']??c.parsed)}`}}},
    scales:doughnut?{}:{[horizontal?'x':'y']:{beginAtZero:true,title:{display:true,text:currency?'Precio promedio (USD)':'Promedio por registro'},grid:{color:'#F0ECF5'}},[horizontal?'y':'x']:{grid:{display:false},ticks:{font:{size:11}}}}}});
  instances.set(id,chart);const empty=!datasets.some(d=>d.data.some(v=>Number.isFinite(v)&&v!==0));document.getElementById(id).closest('.chart-card').querySelector('.chart-empty').hidden=!empty;
}
function byCountry(rows,values,key,sumKey){return countries.map((country,i)=>({label:country,data:values.map(v=>weightedMean(rows.filter(r=>r.Country===country&&r[key]===v),sumKey)),borderColor:colors[i],backgroundColor:colors[i],borderRadius:5,tension:.32,pointRadius:4,borderWidth:2}));}
function cityRanking(rows,sumKey){const cities=unique(rows,'City');return cities.map(city=>[city,weightedMean(rows.filter(r=>r.City===city),sumKey)]).filter(([,v])=>Number.isFinite(v)).sort((a,b)=>b[1]-a[1]).slice(0,10);}
export function renderCharts(rows,allRows){
  Chart.defaults.font.family='Inter, sans-serif';Chart.defaults.color='#6B6475';const years=unique(allRows,'Year'),procedures=unique(allRows,'Procedure');
  draw('trend-chart','line',years,byCountry(rows,years,'Year','Average Price Sum'),{currency:true});
  draw('price-chart','bar',procedures.map(label),byCountry(rows,procedures,'Procedure','Average Price Sum'),{currency:true});
  draw('country-chart','doughnut',countries,[{data:countries.map(c=>recordCount(rows.filter(r=>r.Country===c))),backgroundColor:colors,borderWidth:0}]);
  const priceCities=cityRanking(rows,'Average Price Sum');draw('city-chart','bar',priceCities.map(x=>x[0]),[{label:'Precio promedio',data:priceCities.map(x=>x[1]),backgroundColor:colors[0],borderRadius:4}],{horizontal:true,currency:true});
  const surgeonCities=cityRanking(rows,'Surgeons Sum');draw('surgeon-chart','bar',surgeonCities.map(x=>x[0]),[{label:'Cirujanos promedio por observación',data:surgeonCities.map(x=>x[1]),backgroundColor:colors[1],borderRadius:4}],{horizontal:true});
  draw('procedure-chart','doughnut',procedures.map(label),[{data:procedures.map(p=>recordCount(rows.filter(r=>r.Procedure===p))),backgroundColor:colors,borderWidth:2,borderColor:'#fff'}]);
}
