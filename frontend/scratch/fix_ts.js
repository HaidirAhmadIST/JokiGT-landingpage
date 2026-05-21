const fs = require('fs');
let file = fs.readFileSync('src/app/pendaftaran/page.tsx', 'utf8');

// 1. Fix useState hooks generics
file = file.replace('const [bpsProvinces, setBpsProvinces] = useState([]);', 'const [bpsProvinces, setBpsProvinces] = useState<{id: string, name: string}[]>([]);');
file = file.replace('const [bpsRegencies, setBpsRegencies] = useState([]);', 'const [bpsRegencies, setBpsRegencies] = useState<{id: string, name: string}[]>([]);');
file = file.replace('const [bpsDistricts, setBpsDistricts] = useState([]);', 'const [bpsDistricts, setBpsDistricts] = useState<{id: string, name: string}[]>([]);');

// 2. Fix mutasi_jabatan initial state
const initialFind = `mutasi_jabatan: [] as { bagian: string; jabatan: string; tahun: string }[],`;
const initialReplace = `mutasi_jabatan: [] as { bagian: string; jabatan: string; tahun_mulai: string; tahun_selesai: string }[],`;
file = file.replace(initialFind, initialReplace);

fs.writeFileSync('src/app/pendaftaran/page.tsx', file);
console.log('Fixed TS');
