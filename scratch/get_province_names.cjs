const fs = require('fs');
const path = require('path');

const geojsonPath = path.join(__dirname, '..', 'frontend', 'src', 'data', 'mock-provinces.json');
const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

const provinces = {};

geojsonData.features.forEach(feature => {
  const props = feature.properties;
  const name = props.province_name;
  if (!name) return;

  // Let's calculate a rough centroid for this feature
  let sumLng = 0;
  let sumLat = 0;
  let count = 0;

  const processCoords = (coords) => {
    coords.forEach(coord => {
      if (Array.isArray(coord[0])) {
        processCoords(coord);
      } else {
        sumLng += coord[0];
        sumLat += coord[1];
        count++;
      }
    });
  };

  if (feature.geometry && feature.geometry.coordinates) {
    processCoords(feature.geometry.coordinates);
  }

  if (!provinces[name]) {
    provinces[name] = {
      name: name,
      sumLng: 0,
      sumLat: 0,
      count: 0,
      risk_level: props.risk_level
    };
  }

  provinces[name].sumLng += sumLng;
  provinces[name].sumLat += sumLat;
  provinces[name].count += count;
});

const result = Object.values(provinces).map(p => {
  return {
    province_name: p.name,
    lng: Number((p.sumLng / p.count).toFixed(6)),
    lat: Number((p.sumLat / p.count).toFixed(6)),
    risk_level: p.risk_level
  };
});

console.log(JSON.stringify(result, null, 2));
