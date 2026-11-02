import { unique, label } from './utils.js';
export const filterKeys = ['Year', 'Country', 'Procedure'];
export function filterRows(rows, values) { return rows.filter(row => filterKeys.every(key => !values[key] || String(row[key]) === values[key])); }
export function setupFilters(rows, onChange) {
  const controls = Object.fromEntries(filterKeys.map(key => [key, document.querySelector(`[data-filter="${key}"]`)]));
  const values = () => Object.fromEntries(filterKeys.map(key => [key, controls[key].value]));
  function options(key, source) {
    const previous = controls[key].value;
    controls[key].replaceChildren(new Option('Todos', ''));
    unique(source, key).forEach(value => controls[key].add(new Option(label(String(value)), String(value))));
    controls[key].value = [...controls[key].options].some(option => option.value === previous) ? previous : '';
  }
  function refresh() {
    // Cascade in a fixed order so changing a parent clears unavailable children.
    const selected = {};
    for (const key of filterKeys) {
      options(key, filterRows(rows, selected));
      selected[key] = controls[key].value;
    }
    onChange(filterRows(rows, values()));
  }
  filterKeys.forEach(key => controls[key].addEventListener('change', refresh));
  refresh();
  return () => { filterKeys.forEach(key => { controls[key].value = ''; }); refresh(); };
}
