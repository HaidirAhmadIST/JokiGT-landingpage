const fs = require('fs');
const path = require('path');

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return await res.json();
};

const BASE_URL = 'https://emsifa.github.io/api-wilayah-indonesia/api';

async function downloadData() {
  console.log('Downloading provinces...');
  const provinces = await fetchJson(`${BASE_URL}/provinces.json`);
  
  for (const prov of provinces) {
    console.log(`Downloading regencies for province ${prov.id}...`);
    const regencies = await fetchJson(`${BASE_URL}/regencies/${prov.id}.json`);
    fs.writeFileSync(
      path.join(__dirname, 'frontend/public/data-bps/regencies', `${prov.id}.json`),
      JSON.stringify(regencies)
    );
    
    for (const reg of regencies) {
      try {
        const districts = await fetchJson(`${BASE_URL}/districts/${reg.id}.json`);
        fs.writeFileSync(
          path.join(__dirname, 'frontend/public/data-bps/districts', `${reg.id}.json`),
          JSON.stringify(districts)
        );
      } catch (err) {
        console.error(`Failed to download districts for ${reg.id}:`, err);
      }
    }
  }
  
  console.log('Done!');
}

downloadData().catch(console.error);
