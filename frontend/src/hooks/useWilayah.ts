import { useState, useEffect, useCallback } from 'react';
import { PROVINCE_CODE_MAP } from '@/lib/provinces';

export interface WilayahItem {
  id: string;
  name: string;
}

interface UseWilayahReturn {
  kabupatenList: WilayahItem[];
  kecamatanList: WilayahItem[];
  loadingKabupaten: boolean;
  loadingKecamatan: boolean;
  selectedKabupatenId: string;
  setSelectedKabupatenId: (id: string) => void;
}

/**
 * Hook untuk fetch kabupaten/kota dan kecamatan dari API BPS (api-wilayah-indonesia)
 * berdasarkan nama provinsi yang dipilih.
 *
 * @param provinsiNama - Nama provinsi (e.g. "Jawa Barat") yang sesuai dengan PROVINCES list
 * @param initialKabupaten - Nilai kabupaten awal (nama) saat edit profil
 */
export function useWilayah(provinsiNama: string, initialKabupaten?: string): UseWilayahReturn {
  const [kabupatenList, setKabupatenList] = useState<WilayahItem[]>([]);
  const [kecamatanList, setKecamatanList] = useState<WilayahItem[]>([]);
  const [loadingKabupaten, setLoadingKabupaten] = useState(false);
  const [loadingKecamatan, setLoadingKecamatan] = useState(false);
  const [selectedKabupatenId, setSelectedKabupatenId] = useState('');

  // Fetch daftar kabupaten/kota saat provinsi berubah
  useEffect(() => {
    if (!provinsiNama) {
      setKabupatenList([]);
      setKecamatanList([]);
      setSelectedKabupatenId('');
      return;
    }

    const kodeProvinsi = PROVINCE_CODE_MAP[provinsiNama];
    if (!kodeProvinsi) {
      setKabupatenList([]);
      setKecamatanList([]);
      setSelectedKabupatenId('');
      return;
    }

    setLoadingKabupaten(true);
    setKabupatenList([]);
    setKecamatanList([]);
    setSelectedKabupatenId('');

    fetch(`/data-bps/regencies/${kodeProvinsi}.json`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data: WilayahItem[]) => {
        setKabupatenList(data || []);

        // Jika ada nilai awal (edit mode), cari ID-nya dan trigger fetch kecamatan
        if (initialKabupaten) {
          const found = (data || []).find(
            (k) => k.name.toLowerCase() === initialKabupaten.toLowerCase()
          );
          if (found) {
            setSelectedKabupatenId(found.id);
          }
        }
      })
      .catch(() => setKabupatenList([]))
      .finally(() => setLoadingKabupaten(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinsiNama]);

  // Fetch daftar kecamatan saat kabupaten dipilih
  useEffect(() => {
    if (!selectedKabupatenId) {
      setKecamatanList([]);
      return;
    }

    setLoadingKecamatan(true);
    setKecamatanList([]);

    fetch(`/data-bps/districts/${selectedKabupatenId}.json`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data: WilayahItem[]) => {
        setKecamatanList(data || []);
      })
      .catch(() => setKecamatanList([]))
      .finally(() => setLoadingKecamatan(false));
  }, [selectedKabupatenId]);

  return {
    kabupatenList,
    kecamatanList,
    loadingKabupaten,
    loadingKecamatan,
    selectedKabupatenId,
    setSelectedKabupatenId,
  };
}
