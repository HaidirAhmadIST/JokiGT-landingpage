const fs = require('fs');

const newRiskMap = {
  // Very High (Red)
  "DKI Jakarta": "Very High",
  "Jawa Barat": "Very High",
  "Jawa Timur": "Very High",
  "Nusatenggara Barat": "Very High",
  "Bali": "Very High",
  "DI Yogyakarta": "Very High",
  "Banten": "Very High",
  "Sumatera Utara": "Very High",
  "Lampung": "Very High",
  "Jawa Tengah": "Very High",

  // High (Orange)

  // Medium (Yellow)
  "Sumatera Selatan": "Medium",
  "Sumatera Barat": "Medium",
  "Kalimantan Selatan": "Medium",
  "Sulawesi Selatan": "Medium",
  "Sulawesi Utara": "Medium",
  "Sulawesi Tenggara": "Medium",
  "Nusa Tenggara Timur": "Medium",
  "Riau": "Medium",
  "Bengkulu": "Medium",
  "Kep. Bangka Belitung": "Medium",

  // Low (Blue)
  "Di. Aceh": "Low",
  "Kalimantan Timur": "Low",
  "Sulawesi Tengah": "Low",
  "Irian Jaya Barat": "Low",
  "Gorontalo": "Low",
  "Maluku": "Low",

  // Very Low (Green)
  "Kalimantan Barat": "Very Low",
  "Kalimantan Tengah": "Very Low",
  "Irian Jaya Tengah": "Very Low",
  "Irian Jaya Timur": "Very Low",
  "Jambi": "Very Low",
  "Maluku Utara": "Very Low"
};

const data = JSON.parse(fs.readFileSync('frontend/src/data/mock-provinces.json', 'utf8'));

let updatedCount = 0;
data.features.forEach(f => {
  const name = f.properties.province_name || f.properties.NAME_1 || f.properties.name;
  if (newRiskMap[name]) {
    f.properties.risk_level = newRiskMap[name];
    updatedCount++;
  } else {
    console.warn(`WARNING: Province "${name}" not found in map!`);
  }
});

fs.writeFileSync('frontend/src/data/mock-provinces.json', JSON.stringify(data, null, 2), 'utf8');
console.log(`Successfully updated ${updatedCount} provinces!`);
