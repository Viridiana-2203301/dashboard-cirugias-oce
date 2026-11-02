export const countries=['México','Estados Unidos'];
export const number=value=>Number.isFinite(value)?new Intl.NumberFormat('es-MX',{maximumFractionDigits:1}).format(value):'N/D';
export const money=value=>Number.isFinite(value)?new Intl.NumberFormat('es-MX',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value):'N/D';
export const unique=(rows,key)=>[...new Set(rows.map(r=>r[key]).filter(v=>v!==''&&v!=null))].sort((a,b)=>String(a).localeCompare(String(b),'es',{numeric:true}));
export const labels={'Breast Reduction':'Reducción mamaria','Breast Implants':'Implantes mamarios','Eyelid Surgery':'Cirugía de párpados','Rhinoplasty':'Rinoplastia','Botulinum Toxin':'Toxina botulínica','Liposuction':'Liposucción','Tummy Tuck':'Abdominoplastia','Facelift':'Lifting facial'};
export const label=value=>labels[value]||value;
export const recordCount=rows=>rows.reduce((sum,r)=>sum+r['Record Count'],0);
export const weightedMean=(rows,sumKey)=>{const sum=rows.reduce((total,r)=>total+r[sumKey],0),count=recordCount(rows);return count?sum/count:null;};
export function indicators(rows){
  let min=Infinity,max=-Infinity;
  for(const r of rows){if(r['Min Average Price']<min)min=r['Min Average Price'];if(r['Max Average Price']>max)max=r['Max Average Price'];}
  const count=recordCount(rows),mx=weightedMean(rows.filter(r=>r.Country==='México'),'Average Price Sum'),us=weightedMean(rows.filter(r=>r.Country==='Estados Unidos'),'Average Price Sum');
  const pct=(n,d)=>d?number(n/d*100)+' %':'N/D';
  return [number(count),money(weightedMean(rows,'Average Price Sum')),money(Number.isFinite(min)?min:null),money(Number.isFinite(max)?max:null),money(weightedMean(rows,'Min Price Sum')),money(weightedMean(rows,'Max Price Sum')),number(weightedMean(rows,'Surgeons Sum')),pct(recordCount(rows.filter(r=>r.Country==='México')),count),Number.isFinite(mx)&&us>0?number((mx/us-1)*100)+' %':'N/D'];
}
