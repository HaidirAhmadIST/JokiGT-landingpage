const fs = require('fs');
const https = require('https');

const url = 'https://raw.githubusercontent.com/superpikar/indonesia-geojson/master/indonesia-province-simple.json';
const outputFile = './src/data/mock-provinces.json';

const veryHighProvinces = ['Kepulauan Bangka Belitung', 'Kepulauan Riau', 'DKI Jakarta', 'Banten'];
const highProvinces = ['Lampung', 'Jawa Barat'];
const mediumProvinces = ['Sumatera Selatan', 'Jambi', 'Jawa Tengah', 'Sulawesi Selatan', 'Maluku'];
const lowProvinces = ['Sumatera Utara', 'Riau', 'Kalimantan Barat', 'Kalimantan Timur', 'Sulawesi Tengah', 'Daerah Istimewa Yogyakarta'];

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      const geojson = JSON.parse(data);
      
      geojson.features.forEach(feature => {
        const name = feature.properties.Propinsi || feature.properties.name || feature.properties.NAME_1 || feature.properties.provinsi || '';
        
        let risk = 'Very Low';
        
        if (veryHighProvinces.some(p => name.toLowerCase().includes(p.toLowerCase()))) {
          risk = 'Very High';
        } else if (highProvinces.some(p => name.toLowerCase().includes(p.toLowerCase()))) {
          risk = 'High';
        } else if (mediumProvinces.some(p => name.toLowerCase().includes(p.toLowerCase()))) {
          risk = 'Medium';
        } else if (lowProvinces.some(p => name.toLowerCase().includes(p.toLowerCase()))) {
          risk = 'Low';
        }

        feature.properties.province_name = name;
        feature.properties.province_id = feature.properties.ID_1 || feature.properties.kode || Math.floor(Math.random()*100).toString();
        feature.properties.risk_level = risk;
      });

      fs.writeFileSync(outputFile, JSON.stringify(geojson));
      console.log('Successfully updated mock-provinces.json!');
    } catch (e) {
      console.error('Error processing geojson:', e);
    }
  });
}).on('error', (e) => {
  console.error('Error fetching geojson:', e);
});
