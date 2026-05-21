const fs = require('fs');
const data = JSON.parse(fs.readFileSync('frontend/src/data/mock-provinces.json', 'utf8'));
const provinces = data.features.map(f => ({
  id: f.properties.province_id || f.properties.ID_1 || f.properties.id,
  name: f.properties.province_name || f.properties.NAME_1 || f.properties.name,
  risk: f.properties.risk_level
}));
console.log(JSON.stringify(provinces, null, 2));
