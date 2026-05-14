const fs = require('fs');

const file = './src/data/mock-provinces.json';
const geojson = JSON.parse(fs.readFileSync(file, 'utf-8'));

function titleCase(str) {
  return str.toLowerCase().split(' ').map(word => {
    if (word.length === 0) return '';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

geojson.features.forEach(f => {
  let name = f.properties.province_name || '';
  
  // Handle edge cases where province is joined like PROBANTEN
  if (name.toUpperCase() === 'PROBANTEN') {
    name = 'Banten';
  } else if (name.toUpperCase().startsWith('PROVINSI ')) {
    name = name.substring(9);
  } else if (name.toUpperCase().startsWith('PROV.')) {
    name = name.substring(5);
  } else if (name.toUpperCase().startsWith('PROV ')) {
    name = name.substring(5);
  } else if (name.toUpperCase().startsWith('PRO')) {
    // E.g. PROJAWA BARAT -> JAWA BARAT
    name = name.substring(3);
  }

  name = name.trim();
  name = titleCase(name);

  // Fix specific acronyms
  if (name === 'Dki Jakarta' || name.toLowerCase() === 'jakarta') name = 'DKI Jakarta';
  if (name === 'Di Yogyakarta' || name === 'Daerah Istimewa Yogyakarta' || name.toLowerCase() === 'yogyakarta') name = 'DI Yogyakarta';
  if (name === 'Bangka Belitung' || name === 'Kepulauan Bangka Belitung') name = 'Kep. Bangka Belitung';
  
  f.properties.province_name = name;
});

fs.writeFileSync(file, JSON.stringify(geojson, null, 2));
console.log('Fixed province names!');
