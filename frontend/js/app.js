import { loadData, validateData } from './data.js';
import { setupFilters } from './filters.js';
import { renderCharts } from './charts.js';
import { indicators, unique, label, money, number, recordCount } from './utils.js';
const kpiDefinitions = [
  ['Registros', 'Observaciones en la selecci\u00f3n', 'layer-group', 'Suma las observaciones representadas por los grupos que coinciden con los filtros. No siempre equivale al numero de filas visibles en la tabla.'],
  ['Precio promedio', 'Media de Average Price', 'coins', 'Promedio ponderado del precio reportado en los datos seleccionados. Se expresa en dolares estadounidenses.'],
  ['Precio menor', 'M\u00ednimo del precio promedio', 'arrow-down', 'Es el menor valor de precio promedio registrado dentro de la seleccion actual; no es necesariamente el precio minimo pagado por una persona.'],
  ['Precio mayor', 'M\u00e1ximo del precio promedio', 'arrow-up', 'Es el mayor valor de precio promedio registrado dentro de la seleccion actual; no representa un precio maximo universal.'],
  ['Piso promedio', 'Media del l\u00edmite inferior reportado', 'arrow-down', 'Promedia los limites inferiores de los rangos de precio reportados en los grupos seleccionados.'],
  ['Techo promedio', 'Media del l\u00edmite superior reportado', 'arrow-up', 'Promedia los limites superiores de los rangos de precio reportados en los grupos seleccionados.'],
  ['Cirujanos por registro', 'Promedio; no representa personas \u00fanicas', 'user-doctor', 'Promedio de cirujanos reportados en los grupos seleccionados. Una misma persona puede aparecer en mas de un registro.'],
  ['Participaci\u00f3n de M\u00e9xico', 'Porcentaje de registros del pa\u00eds', 'chart-pie', 'Porcentaje de las observaciones filtradas que corresponde a Mexico. Sirve para ver como se reparte la muestra por pais.'],
  ['Brecha de precio MX\u2013EE. UU.', 'Diferencia relativa entre promedios; no ajustada por procedimiento', 'arrows-left-right', 'Compara el precio promedio de Mexico con el de Estados Unidos. Es una diferencia descriptiva y no controla por procedimiento ni por otros factores.']
];
const kpis = document.getElementById('kpis');
kpiDefinitions.forEach(([title, note, icon, explanation]) => {
  const card = document.createElement('article'); card.className = 'card kpi'; card.tabIndex = 0; card.setAttribute('role', 'button'); card.setAttribute('aria-expanded', 'false'); card.setAttribute('aria-label', `${title}. Pasa el cursor o activa la tarjeta para ver su significado.`);
  const flipper = document.createElement('div'); flipper.className = 'kpi-flipper';
  const front = document.createElement('div'); front.className = 'kpi-face kpi-front';
  const back = document.createElement('div'); back.className = 'kpi-face kpi-back'; back.setAttribute('aria-hidden', 'true');
  const heading = document.createElement('h3'); heading.className = 'kpi-label'; heading.textContent = title;
  const value = document.createElement('div'); value.className = 'kpi-value'; value.textContent = 'N/D';
  const description = document.createElement('p'); description.className = 'kpi-note'; description.textContent = note;
  const symbol = document.createElement('i'); symbol.className = 'fa-solid fa-' + icon; symbol.setAttribute('aria-hidden', 'true');
  const backHeading = document.createElement('h3'); backHeading.className = 'kpi-back-title'; backHeading.textContent = 'Que significa';
  const backText = document.createElement('p'); backText.className = 'kpi-explanation'; backText.textContent = explanation;
  const hint = document.createElement('span'); hint.className = 'kpi-hint'; hint.textContent = 'Toca o activa para volver';
  front.append(heading, value, description, symbol); back.append(backHeading, backText, hint); flipper.append(front, back); card.append(flipper); kpis.append(card);
  const setFlipped = flipped => { card.classList.toggle('is-flipped', flipped); card.setAttribute('aria-expanded', String(flipped)); back.setAttribute('aria-hidden', String(!flipped)); };
  card.addEventListener('focus', () => setFlipped(true));
  card.addEventListener('blur', () => setFlipped(false));
  card.addEventListener('pointerenter', () => { if (matchMedia('(hover: hover)').matches) setFlipped(true); });
  card.addEventListener('pointerleave', () => { if (matchMedia('(hover: hover)').matches) setFlipped(false); });
  let flippedBeforeTap = false;
  card.addEventListener('pointerdown', () => { flippedBeforeTap = card.classList.contains('is-flipped'); });
  card.addEventListener('click', () => { if (matchMedia('(hover: none)').matches) setFlipped(!flippedBeforeTap); });
  card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setFlipped(!card.classList.contains('is-flipped')); } });
});
let filtered = [], page = 1, sortKey = '', ascending = true;
const pageSize = 20;
const search = document.getElementById('search');
const columns = ['Country','City','Year','Procedure','Record Count','Number of Surgeons','Price Range','Average Price'];
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function renderTable() {
  const query = normalize(search.value.trim());
  const rows = filtered.filter(row => columns.some(key => normalize(key === 'Procedure' ? label(row[key]) + ' ' + row[key] : row[key]).includes(query)));
  if (sortKey) rows.sort((a,b) => {
    if (a[sortKey] == null) return b[sortKey] == null ? 0 : 1;
    if (b[sortKey] == null) return -1;
    const comparison = typeof a[sortKey] === 'number' ? a[sortKey] - b[sortKey] : label(a[sortKey]).localeCompare(label(b[sortKey]), 'es');
    return comparison * (ascending ? 1 : -1);
  });
  const pages = Math.ceil(rows.length / pageSize); page = Math.max(1, Math.min(page, pages));
  const body = document.getElementById('table-body'); body.replaceChildren();
  rows.slice((page - 1) * pageSize, page * pageSize).forEach(row => {
    const tr = document.createElement('tr');
    columns.forEach(key => { const td = document.createElement('td'); td.textContent = key === 'Average Price' ? money(row[key]) : key === 'Procedure' ? label(row[key]) : key === 'Number of Surgeons' ? number(row[key]) : key === 'Record Count' ? number(row[key]) : row[key] ?? 'N/D'; tr.append(td); });
    body.append(tr);
  });
  if (!rows.length) { const tr = document.createElement('tr'), td = document.createElement('td'); td.colSpan = columns.length; td.textContent = 'No hay registros que coincidan con los filtros y la búsqueda.'; tr.append(td); body.append(tr); }
  document.getElementById('table-count').textContent = rows.length ? `${number((page - 1) * pageSize + 1)}–${number(Math.min(page * pageSize, rows.length))} de ${number(rows.length)} registros` : '0 registros';
  document.getElementById('page-label').textContent = `Página ${pages ? page : 0} de ${pages}`;
  document.getElementById('previous').disabled = page <= 1;
  document.getElementById('next').disabled = page >= pages;
}
search.addEventListener('input', () => { page = 1; renderTable(); });
document.getElementById('previous').addEventListener('click', () => { page--; renderTable(); });
document.getElementById('next').addEventListener('click', () => { page++; renderTable(); });
document.querySelectorAll('[data-sort]').forEach(button => button.addEventListener('click', () => {
  ascending = sortKey === button.dataset.sort ? !ascending : true; sortKey = button.dataset.sort; page = 1;
  document.querySelectorAll('[aria-sort]').forEach(th => th.setAttribute('aria-sort', 'none'));
  button.closest('th').setAttribute('aria-sort', ascending ? 'ascending' : 'descending'); renderTable();
}));
function renderMetadata(rows) {
  const container = document.getElementById('metadata'); container.replaceChildren();
  for (const [key, title] of [['Year','Años'],['Country','Países'],['City','Ciudades'],['Procedure','Procedimientos']]) {
    const details = document.createElement('details'), summary = document.createElement('summary'), ul = document.createElement('ul');
    const values = unique(rows, key); summary.textContent = `${title} (${values.length})`;
    (values.length ? values : ['N/D']).forEach(value => { const li = document.createElement('li'); li.textContent = value; ul.append(li); });
    details.append(summary, ul); container.append(details);
  }
}
const menu = document.getElementById('menu-toggle'), sidebar = document.getElementById('sidebar');
function closeMenu() { sidebar.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }
menu.addEventListener('click', () => { const open = sidebar.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
const dashboardViews = new Set(['overview', 'prices', 'procedures', 'cities', 'surgeons', 'google-trends', 'about']);
const chartGrid = document.getElementById('analysis-charts');
const viewDescriptions = {
  overview: 'Indicadores clave del conjunto filtrado: resumen rápido de registros, precios y cobertura.',
  prices: 'Compara precios promedio por procedimiento y su evolución anual. Útil para explorar diferencias y cambios en los datos.',
  procedures: 'Explora cómo se distribuyen los registros entre procedimientos y consulta sus precios comparativos.',
  cities: 'Muestra las ciudades con mayores precios promedio para ubicar diferencias geográficas en los registros.',
  surgeons: 'Compara el promedio reportado de cirujanos por ciudad. Es un promedio de registros, no un conteo de personas únicas.',
  'google-trends': 'Explora el interés relativo por procedimiento y región. El panel incluye una explicación sencilla de la escala y de sus límites.',
  about: 'Consulta cómo se prepararon los datos, qué representa la tabla y cuáles son sus alcances.'
};
function activateView(view, updateHash = false) {
  if (!dashboardViews.has(view)) view = 'overview';
  document.querySelectorAll('[data-tab-view]').forEach(section => {
    const views = section.dataset.tabView.split(/\s+/);
    section.classList.toggle('tab-view-hidden', !views.includes(view));
  });
  if (chartGrid) {
    const cards = [...chartGrid.querySelectorAll('.chart-card')];
    const visibleCount = cards.filter(card => !card.classList.contains('tab-view-hidden')).length;
    chartGrid.hidden = visibleCount === 0;
    chartGrid.classList.toggle('tab-grid-single', visibleCount === 1);
    chartGrid.classList.toggle('tab-grid-dual', visibleCount === 2);
  }
  const trendsView = view === 'google-trends';
  document.getElementById('global-filters')?.classList.toggle('tab-view-hidden', trendsView);
  document.getElementById('status')?.classList.toggle('tab-view-hidden', trendsView);
  document.getElementById('reset')?.classList.toggle('tab-view-hidden', trendsView);
  const description = document.getElementById('view-description');
  if (description) description.textContent = viewDescriptions[view];
  document.querySelectorAll('nav a').forEach(link => {
    const active = link.getAttribute('href') === `#${view}`;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  if (updateHash) history.pushState({ view }, '', `#${view}`);
  closeMenu();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  window.dispatchEvent(new Event('resize'));
  document.dispatchEvent(new CustomEvent('dashboard:viewchange', { detail: { view } }));
}
document.querySelectorAll('nav a').forEach(link => link.addEventListener('click', event => {
  const view = link.getAttribute('href')?.slice(1);
  if (!dashboardViews.has(view)) return;
  event.preventDefault();
  activateView(view, true);
}));
document.querySelector('.brand')?.addEventListener('click', event => {
  event.preventDefault();
  activateView('overview', true);
});
window.addEventListener('popstate', () => activateView(location.hash.slice(1) || 'overview'));
activateView(location.hash.slice(1) || 'overview');
async function start() {
  const status = document.getElementById('status');
  try {
    const rows = await loadData();
    if (!globalThis.Chart) throw new Error('No se pudo cargar Chart.js. Revisa tu conexión a Internet y recarga la página.');
    const checks = validateData(rows), failures = checks.filter(([,valid]) => !valid);
    checks.forEach(([title, valid]) => { const li = document.createElement('li'); li.textContent = `${valid ? '✓' : 'Revisar:'} ${title}`; document.getElementById('validation').append(li); });
    const reset = setupFilters(rows, selection => {
      filtered = selection; page = 1;
      indicators(filtered).forEach((value, index) => { kpis.children[index].querySelector('.kpi-value').textContent = value; });
      renderCharts(filtered, rows); renderTable(); renderMetadata(filtered);
      document.getElementById('scope').textContent = `${number(recordCount(filtered))} de ${number(recordCount(rows))} observaciones`;
      status.textContent = !filtered.length ? 'No hay resultados para esta combinación. Prueba otros filtros o restablece la selección.' : failures.length ? 'Archivo optimizado cargado. Hay validaciones pendientes: consulta Acerca de los datos.' : `Datos listos · ${number(recordCount(rows))} observaciones resumidas en ${number(rows.length)} grupos · Selecciona un filtro para explorar.`;
    });
    document.querySelectorAll('[data-filter], #reset').forEach(control => { control.disabled = false; });
    document.getElementById('reset').addEventListener('click', () => { search.value = ''; sortKey = ''; ascending = true; document.querySelectorAll('[aria-sort]').forEach(th => th.setAttribute('aria-sort', 'none')); reset(); });
  } catch (error) {
    status.classList.add('error'); status.setAttribute('role', 'alert'); status.textContent = error.message + ' Revisa la configuración de datos y vuelve a cargar el sitio.';
  }
}
renderTable();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
