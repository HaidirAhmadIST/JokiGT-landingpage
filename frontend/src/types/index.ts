export interface Perusahaan {
  id: number;
  nama_perusahaan: string;
  alamat_perusahaan?: string;
  email_perusahaan?: string;
  no_telp_perusahaan?: string;
  sektor_industri?: string;
  latitude?: string;
  longitude?: string;
  status_pendamping?: string;
  created_at: string;
  updated_at: string;
}

export interface Pekerja {
  id: number;
  nik: string;
  nama_lengkap: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: string;
  alamat_ktp?: string;
  alamat_domisili?: string;
  no_hp?: string;
  pas_foto?: string;
  status_kesehatan?: string;
  perusahaan_id?: number;
  perusahaan?: Perusahaan;
  riwayat_pekerja?: RiwayatPekerja[];
  created_at: string;
  updated_at: string;
}

export interface RiwayatPekerja {
  id: number;
  pekerja_id: number;
  nama_perusahaan: string;
  jabatan: string;
  bagian: string;
  status_pekerjaan: string;
  tgl_masuk: string;
  tgl_keluar?: string;
}

export interface StatusAdvokasi {
  id: number;
  pekerja_id: number;
  jenis_kasus: string;
  tahap: string;
  status_detail: string;
  tanggal_pelaporan?: string;
  catatan?: string;
  
  // Milestones
  riwayat_pajanan: boolean;
  persetujuan_dokter: boolean;
  perusahaan_lapor: boolean;
  penetapan_pak: boolean;
  kompensasi_bpjstk: boolean;
  rehabilitasi_bpjskes: boolean;

  // Timestamps for milestones
  bukti_pajanan_at?: string;
  bukti_persetujuan_dokter_at?: string;
  bukti_perusahaan_lapor_at?: string;
  bukti_penetapan_pak_at?: string;
  bukti_kompensasi_bpjstk_at?: string;
  bukti_rehabilitasi_bpjskes_at?: string;

  // File paths and names
  bukti_pajanan_path?: string;
  bukti_pajanan_name?: string;
  bukti_persetujuan_dokter_path?: string;
  bukti_persetujuan_dokter_name?: string;
  bukti_perusahaan_lapor_path?: string;
  bukti_perusahaan_lapor_name?: string;
  bukti_penetapan_pak_path?: string;
  bukti_penetapan_pak_name?: string;
  bukti_kompensasi_bpjstk_path?: string;
  bukti_kompensasi_bpjstk_name?: string;
  bukti_rehabilitasi_bpjskes_path?: string;
  bukti_rehabilitasi_bpjskes_name?: string;
  
  pekerja?: Pekerja;
  created_at: string;
  updated_at: string;
  progress_percentage?: number;
}
