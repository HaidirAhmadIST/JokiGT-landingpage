const fs = require('fs');
let file = fs.readFileSync('src/app/pendaftaran/page.tsx', 'utf8');

// 1. Remove Harian Lepas
file = file.replace('<SelectItem value="Harian">Harian Lepas</SelectItem>', '');

// 2. PKWTT Tanggal Masuk
const pkwttFind = `{pekerjaanSaatIni.status_pekerjaan === 'PKWT' && (
                      <>
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <Label className="text-blue-600 font-bold">Tanggal Mulai Kontrak</Label>
                          <Input 
                            type="date"
                            className="h-11 border-blue-200 focus-visible:ring-blue-400 block w-full text-slate-500"
                            value={pekerjaanSaatIni.tgl_masuk}
                            onChange={(e) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, tgl_masuk: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <Label className="text-blue-600 font-bold">Tanggal Selesai Kontrak</Label>
                          <Input 
                            type="date"
                            className="h-11 border-blue-200 focus-visible:ring-blue-400 block w-full text-slate-500"
                            value={pekerjaanSaatIni.tanggal_selesai_kontrak}
                            onChange={(e) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, tanggal_selesai_kontrak: e.target.value })}
                          />
                        </div>
                      </>
                    )}`;
const pkwttReplace = `{(pekerjaanSaatIni.status_pekerjaan === 'PKWT' || pekerjaanSaatIni.status_pekerjaan === 'PKWTT') && (
                      <>
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <Label className="text-blue-600 font-bold">{pekerjaanSaatIni.status_pekerjaan === 'PKWTT' ? 'Tanggal Masuk' : 'Tanggal Mulai Kontrak'}</Label>
                          <Input 
                            type="date"
                            className="h-11 border-blue-200 focus-visible:ring-blue-400 block w-full text-slate-500"
                            value={pekerjaanSaatIni.tgl_masuk}
                            onChange={(e) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, tgl_masuk: e.target.value })}
                          />
                        </div>
                        {pekerjaanSaatIni.status_pekerjaan === 'PKWT' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <Label className="text-blue-600 font-bold">Tanggal Selesai Kontrak</Label>
                          <Input 
                            type="date"
                            className="h-11 border-blue-200 focus-visible:ring-blue-400 block w-full text-slate-500"
                            value={pekerjaanSaatIni.tanggal_selesai_kontrak}
                            onChange={(e) => setPekerjaanSaatIni({ ...pekerjaanSaatIni, tanggal_selesai_kontrak: e.target.value })}
                          />
                        </div>
                        )}
                      </>
                    )}`;
file = file.replace(pkwttFind, pkwttReplace);

// 3. Mutasi Jabatan UI
const mutasiFind = `<div className="col-span-2 space-y-1">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase">Tahun</Label>
                                <Input 
                                  placeholder="2024" 
                                  className="h-9 bg-white text-xs text-center"
                                  value={mut.tahun}
                                  onChange={(e) => {
                                    const newMut = [...pekerjaanSaatIni.mutasi_jabatan];
                                    newMut[idx].tahun = e.target.value;
                                    setPekerjaanSaatIni({ ...pekerjaanSaatIni, mutasi_jabatan: newMut });
                                  }}
                                />
                              </div>`;
const mutasiReplace = `<div className="col-span-2 space-y-1">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase">Thn Mulai</Label>
                                <Input 
                                  placeholder="2020" 
                                  className="h-9 bg-white text-xs text-center px-1"
                                  value={mut.tahun_mulai}
                                  onChange={(e) => {
                                    const newMut = [...pekerjaanSaatIni.mutasi_jabatan];
                                    newMut[idx].tahun_mulai = e.target.value;
                                    setPekerjaanSaatIni({ ...pekerjaanSaatIni, mutasi_jabatan: newMut });
                                  }}
                                />
                              </div>
                              <div className="col-span-2 space-y-1">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase">Thn Selesai</Label>
                                <Input 
                                  placeholder="2024" 
                                  className="h-9 bg-white text-xs text-center px-1"
                                  value={mut.tahun_selesai}
                                  onChange={(e) => {
                                    const newMut = [...pekerjaanSaatIni.mutasi_jabatan];
                                    newMut[idx].tahun_selesai = e.target.value;
                                    setPekerjaanSaatIni({ ...pekerjaanSaatIni, mutasi_jabatan: newMut });
                                  }}
                                />
                              </div>`;
file = file.replace(mutasiFind, mutasiReplace);
file = file.replace(/<div className="col-span-5 space-y-1">/g, '<div className="col-span-4 space-y-1">');
file = file.replace(/<div className="col-span-4 space-y-1">\s*<Label className="text-\[10px\] font-bold text-slate-500 uppercase">Jabatan Baru<\/Label>/g, '<div className="col-span-3 space-y-1">\n                                <Label className="text-[10px] font-bold text-slate-500 uppercase">Jabatan Baru</Label>');
file = file.replace(`mutasi_jabatan: [...(prev.mutasi_jabatan || []), { bagian: '', jabatan: '', tahun: '' }]`, `mutasi_jabatan: [...(prev.mutasi_jabatan || []), { bagian: '', jabatan: '', tahun_mulai: '', tahun_selesai: '' }]`);

// 4. BPS STATES
const hookFind = `  const [isRestored, setIsRestored] = useState(false);
  const [skipRiwayat, setSkipRiwayat] = useState(false);

  // WhatsApp OTP Verification States for Registration Page`;
const hookReplace = `  const [isRestored, setIsRestored] = useState(false);
  const [skipRiwayat, setSkipRiwayat] = useState(false);

  // BPS Region States
  const [bpsProvinces, setBpsProvinces] = useState([]);
  const [bpsRegencies, setBpsRegencies] = useState([]);
  const [bpsDistricts, setBpsDistricts] = useState([]);
  
  const [selectedProvId, setSelectedProvId] = useState('');
  const [selectedRegId, setSelectedRegId] = useState('');
  const [isLoadingRegencies, setIsLoadingRegencies] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);

  useEffect(() => {
    fetch('https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json')
      .then(r => r.json()).then(d => setBpsProvinces(d)).catch(console.error);
  }, []);

  useEffect(() => {
    const match = bpsProvinces.find(p => p.name.toUpperCase() === baseData.domisili?.toUpperCase());
    if (match) {
      if (selectedProvId !== match.id) {
        setSelectedProvId(match.id);
        setIsLoadingRegencies(true);
        setBaseData(prev => ({ ...prev, kabupaten: '', kecamatan: '' }));
        fetch(\`https://emsifa.github.io/api-wilayah-indonesia/api/regencies/\${match.id}.json\`)
          .then(r => r.json()).then(d => { setBpsRegencies(d); setIsLoadingRegencies(false); }).catch(() => setIsLoadingRegencies(false));
      }
    } else { setBpsRegencies([]); setSelectedProvId(''); }
  }, [baseData.domisili, bpsProvinces, selectedProvId]);

  useEffect(() => {
    const match = bpsRegencies.find(r => r.name.toUpperCase() === baseData.kabupaten?.toUpperCase());
    if (match) {
      if (selectedRegId !== match.id) {
        setSelectedRegId(match.id);
        setIsLoadingDistricts(true);
        setBaseData(prev => ({ ...prev, kecamatan: '' }));
        fetch(\`https://emsifa.github.io/api-wilayah-indonesia/api/districts/\${match.id}.json\`)
          .then(r => r.json()).then(d => { setBpsDistricts(d); setIsLoadingDistricts(false); }).catch(() => setIsLoadingDistricts(false));
      }
    } else { setBpsDistricts([]); setSelectedRegId(''); }
  }, [baseData.kabupaten, bpsRegencies, selectedRegId]);

  // WhatsApp OTP Verification States for Registration Page`;
file = file.replace(hookFind, hookReplace);

// 5. BPS UI (Domisili)
const bpsUiFind = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Kabupaten/Kota</Label>
                        <Input
                          placeholder="Contoh: Kota Bandung"
                          className="h-11"
                          value={baseData.kabupaten || ''}
                          onChange={e => setBaseData({ ...baseData, kabupaten: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Kecamatan</Label>
                        <Input
                          placeholder="Contoh: Coblong"
                          className="h-11"
                          value={baseData.kecamatan || ''}
                          onChange={e => setBaseData({ ...baseData, kecamatan: e.target.value })}
                        />
                      </div>
                    </div>`;
const bpsUiReplace = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Kabupaten/Kota</Label>
                          {bpsProvinces.find(p => p.name.toUpperCase() === baseData.domisili?.toUpperCase()) ? (
                            <Select 
                              value={baseData.kabupaten} 
                              onValueChange={v => setBaseData({ ...baseData, kabupaten: v || '', kecamatan: '' })}
                              disabled={!baseData.domisili || isLoadingRegencies}
                            >
                              <SelectTrigger className="h-11 bg-white">
                                <SelectValue placeholder={isLoadingRegencies ? "Memuat..." : "Pilih Kabupaten/Kota"} />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {bpsRegencies.map((reg) => (
                                  <SelectItem key={reg.id} value={reg.name}>{reg.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              placeholder="Contoh: Kota Bandung"
                              className="h-11"
                              value={baseData.kabupaten || ''}
                              onChange={e => setBaseData({ ...baseData, kabupaten: e.target.value })}
                            />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Kecamatan</Label>
                          {bpsRegencies.find(r => r.name.toUpperCase() === baseData.kabupaten?.toUpperCase()) ? (
                            <Select 
                              value={baseData.kecamatan} 
                              onValueChange={v => setBaseData({ ...baseData, kecamatan: v || '' })}
                              disabled={!baseData.kabupaten || isLoadingDistricts}
                            >
                              <SelectTrigger className="h-11 bg-white">
                                <SelectValue placeholder={isLoadingDistricts ? "Memuat..." : "Pilih Kecamatan"} />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {bpsDistricts.map((dist) => (
                                  <SelectItem key={dist.id} value={dist.name}>{dist.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              placeholder="Contoh: Coblong"
                              className="h-11"
                              value={baseData.kecamatan || ''}
                              onChange={e => setBaseData({ ...baseData, kecamatan: e.target.value })}
                            />
                          )}
                        </div>
                      </div>`;
file = file.replace(bpsUiFind, bpsUiReplace);

// 6. Remove OTP requirement for non-union
// We need to change the submit logic in handleFinalSubmit
const optFind = `if (!isWaVerified && baseData.whatsapp) {
      toast.error("Anda belum memverifikasi nomor WhatsApp!");
      return;
    }`;
const optReplace = `if (!isWaVerified && baseData.whatsapp && baseData.is_anggota) {
      toast.error("Anda belum memverifikasi nomor WhatsApp!");
      return;
    }`;
file = file.replace(optFind, optReplace);

const optUiFind = `{baseData.whatsapp && !isWaVerified && (
                              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">`;
const optUiReplace = `{baseData.whatsapp && !isWaVerified && baseData.is_anggota && (
                              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">`;
file = file.replace(optUiFind, optUiReplace);

fs.writeFileSync('src/app/pendaftaran/page.tsx', file);
console.log('Done replacement');
