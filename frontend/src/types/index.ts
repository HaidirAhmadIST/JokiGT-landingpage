// =============================================================================
// GLOBAL TYPE DEFINITIONS
// Semua interface dan tipe data utama didefinisikan di sini agar konsisten
// di seluruh aplikasi. Programmer baru bisa membaca file ini untuk memahami
// struktur data yang digunakan di backend (Laravel API).
// =============================================================================

// -----------------------------------------------------------------------------
// USER & AUTENTIKASI
// -----------------------------------------------------------------------------

/** Peran pengguna dalam sistem. */
export type UserRole = 'admin' | 'petugas' | 'viewer';

/** Data pengguna yang tersimpan di localStorage dan dikembalikan oleh /api/me */
export interface User {
  id: number;
  nama: string;
  email: string;
  role: UserRole;
  foto?: string;
  /** ID Pekerja yang terhubung (hanya untuk role 'viewer') */
  pekerja_id?: number;
  pekerja?: {
    id: number;
  };
}

// -----------------------------------------------------------------------------
// PERUSAHAAN
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// RIWAYAT PEKERJAAN
// -----------------------------------------------------------------------------

/** Data APD dan informasi tambahan untuk pekerja informal (Borongan/Harian Lepas). */
export interface InformalData {
  apd_disediakan?: string;
  jenis_apd_sendiri?: string;
  apd_list?: string;
  tugas_spesifik?: string;
  lama_bekerja?: string;
  bpjs_bpu?: string;
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
  jenis_pajanan?: string;
  /** Durasi pajanan dalam satuan tahun. */
  durasi_pajanan?: number | string;
  /** Data tambahan untuk pekerja informal, disimpan sebagai JSON di DB. */
  informal_data?: InformalData | string;
  /** Riwayat pemeriksaan kesehatan yang terkait dengan periode pekerjaan ini. */
  detail_medis?: DetailMedis[];
}

// -----------------------------------------------------------------------------
// DETAIL MEDIS
// -----------------------------------------------------------------------------

export interface DetailMedis {
  id: number;
  pekerja_id: number;
  riwayat_pekerja_id?: number;
  tgl_pemeriksaan: string;
  tempat_pemeriksa?: string;
  jenis_pemeriksa?: string;
  dokter_pemeriksa?: string;
  hasil_diagnosis?: string;
  status_kesehatan?: HealthStatus;
  rekomendasi?: string;
  pendamping?: string;
  updated_at: string;
}

/** Status kesehatan pekerja yang digunakan di database dan UI. */
export type HealthStatus = 'sehat' | 'sehat_dengan_catatan' | 'tidak_sehat';

// -----------------------------------------------------------------------------
// STATUS ADVOKASI
// -----------------------------------------------------------------------------

/**
 * Data status advokasi PAK (Penyakit Akibat Kerja) seorang pekerja.
 * Mencakup 6 tahapan: dari riwayat pajanan hingga rehabilitasi.
 *
 * Index signature `[key: string]: unknown` memungkinkan akses dinamis
 * ke field milestone via variabel string (misal: `adv[step.key]`).
 */
export interface StatusAdvokasi {
  /** Memungkinkan akses key dinamis, misal: adv['riwayat_pajanan'] atau adv[step.key]. */
  [key: string]: unknown;
  id: number;
  pekerja_id: number;
  jenis_kasus?: string;
  tahap?: string;
  status_detail?: string;
  tanggal_pelaporan?: string;
  catatan?: string;
  /** True jika catatan terakhir ditulis oleh admin/petugas, false jika oleh pekerja sendiri. */
  is_admin_note?: boolean;

  // ── Milestone booleans ──────────────────────────────────────────────────────
  riwayat_pajanan: boolean;
  persetujuan_dokter: boolean;
  perusahaan_lapor: boolean;
  penetapan_pak: boolean;
  kompensasi_bpjstk: boolean;
  rehabilitasi_bpjskes: boolean;

  // ── Timestamps per milestone ─────────────────────────────────────────────────
  bukti_pajanan_at?: string;
  bukti_persetujuan_dokter_at?: string;
  bukti_perusahaan_lapor_at?: string;
  bukti_penetapan_pak_at?: string;
  bukti_kompensasi_bpjstk_at?: string;
  bukti_rehabilitasi_bpjskes_at?: string;

  // ── Paths file bukti ─────────────────────────────────────────────────────────
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
  /** Persentase (0–100) dari 6 milestone yang sudah selesai. */
  progress_percentage?: number;
}

// -----------------------------------------------------------------------------
// PEKERJA
// -----------------------------------------------------------------------------

/** Data lengkap pekerja beserta semua relasi (digunakan di halaman detail). */
export interface PekerjaFull {
  id: number;
  nik: string;
  nama_lengkap: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: 'L' | 'P';
  alamat_ktp?: string;
  domisili?: string;
  whatsapp?: string;
  pas_foto?: string;
  status_kesehatan?: HealthStatus;
  catatan_admin?: string;
  user_id?: number;
  perusahaan_id?: number;
  user?: User;
  perusahaan?: Perusahaan;
  riwayat_pekerja?: RiwayatPekerja[];
  latest_detail_medis?: DetailMedis;
  status_advokasi?: StatusAdvokasi;
  created_at: string;
  updated_at: string;
}

/** Data ringkasan pekerja untuk tampilan tabel dan list (tanpa semua relasi). */
export interface Pekerja {
  id: number;
  nik: string;
  nama_lengkap: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: 'L' | 'P';
  alamat_ktp?: string;
  domisili?: string;
  whatsapp?: string;
  pas_foto?: string;
  status_kesehatan?: HealthStatus;
  user_id?: number;
  perusahaan_id?: number;
  perusahaan?: Perusahaan;
  riwayat_pekerja?: RiwayatPekerja[];
  current_job?: RiwayatPekerja;
  latest_detail_medis?: DetailMedis;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// DASHBOARD ADMIN
// -----------------------------------------------------------------------------

/**
 * Statistik utama yang ditampilkan di halaman Dashboard Admin.
 * Dikembalikan oleh endpoint GET /api/dashboard/stats.
 */
export interface DashboardStats {
  total_pekerja: number;
  /** Jumlah pekerja baru yang ditambahkan bulan ini. */
  total_pekerja_new: number;
  total_perusahaan: number;
  total_perusahaan_new: number;
  kasus_aktif: number;
  kasus_aktif_new: number;
  advokasi_selesai: number;
  advokasi_selesai_new: number;
  klaim_disetujui: number;
  klaim_disetujui_new: number;
  kesehatan: {
    fit: number;
    note: number;
    unfit: number;
  };
}

// -----------------------------------------------------------------------------
// ACTIVITY LOG
// -----------------------------------------------------------------------------

export type ActivityCategory = 'sistem' | 'admin';
export type ActivityAction = 'create' | 'update' | 'soft_delete' | 'restore' | 'warning' | 'default';

/** Satu entri log aktivitas dari endpoint GET /api/activity-logs */
export interface ActivityLogItem {
  id: number;
  action: ActivityAction;
  description: string;
  category: ActivityCategory;
  user_name: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  time_ago: string;
}

// -----------------------------------------------------------------------------
// API RESPONSE WRAPPERS
// -----------------------------------------------------------------------------

/** Wrapper standar untuk semua respons API yang sukses. */
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}

/** Wrapper untuk respons API yang menggunakan paginasi Laravel. */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}
