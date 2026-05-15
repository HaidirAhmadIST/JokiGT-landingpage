<?php

namespace App\Services;

use App\Models\StatusAdvokasi;
use App\Traits\HandlesPdfUploads;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Collection;

class AdvokasiService
{
    use HandlesPdfUploads;

    /**
     * Get aggregate statistics and worker status breakdown for advocacy.
     *
     * @param bool $includeWorkers Whether to include detailed worker lists for each step
     * @param string|null $hazard Optional hazard/exposure filter
     * @return array
     */
    public function getStats(bool $includeWorkers = false, ?string $hazard = null): array
    {
        $now = now();
        $startOfThisMonth = $now->copy()->startOfMonth();

        $baseQuery = StatusAdvokasi::whereNotNull('jenis_kasus');
        
        if ($hazard) {
            $baseQuery->whereHas('pekerja.riwayatPekerja', function ($q) use ($hazard) {
                $q->where('jenis_pajanan', 'LIKE', '%' . $hazard . '%');
            });
        }

        $totalAll = (clone $baseQuery)->count();
        $totalLastMonth = (clone $baseQuery)
            ->where('created_at', '<', $startOfThisMonth)
            ->count();
        
        $selesaiAll = (clone $baseQuery)->where('rehabilitasi_bpjskes', true)->count();
        $selesaiLastMonth = (clone $baseQuery)->where('rehabilitasi_bpjskes', true)
            ->where('created_at', '<', $startOfThisMonth)
            ->count();

        $prosesAll = $totalAll - $selesaiAll;
        $prosesLastMonth = $totalLastMonth - $selesaiLastMonth;

        $summary = [
            'total' => [
                'count' => $totalAll,
                'new' => $totalAll - $totalLastMonth
            ],
            'proses' => [
                'count' => $prosesAll,
                'new' => $prosesAll - $prosesLastMonth
            ],
            'selesai' => [
                'count' => $selesaiAll,
                'new' => $selesaiAll - $selesaiLastMonth
            ]
        ];

        $steps = [
            ['key' => 'riwayat_pajanan', 'label' => 'Riwayat Pajanan', 'column' => 'riwayat_pajanan'],
            ['key' => 'persetujuan_dokter', 'label' => 'Evaluasi Dokter Okupasi', 'column' => 'persetujuan_dokter'],
            ['key' => 'perusahaan_lapor', 'label' => 'Laporan Perusahaan', 'column' => 'perusahaan_lapor'],
            ['key' => 'penetapan_pak', 'label' => 'Penetapan PAK', 'column' => 'penetapan_pak'],
            ['key' => 'kompensasi_bpjstk', 'label' => 'Klaim JKK BPJS', 'column' => 'kompensasi_bpjstk'],
            ['key' => 'rehabilitasi_bpjskes', 'label' => 'Rehabilitasi Medik', 'column' => 'rehabilitasi_bpjskes'],
        ];

        $results = [];
        foreach ($steps as $step) {
            $col = $step['column'];
            $query = StatusAdvokasi::where($col, true);
            
            if ($hazard) {
                $query->whereHas('pekerja.riwayatPekerja', function ($q) use ($hazard) {
                    $q->where('jenis_pajanan', 'LIKE', '%' . $hazard . '%');
                });
            }
            
            $count = $query->count();
            $workers = [];

            if ($includeWorkers && $count > 0) {
                $workers = $query->with(['pekerja:id,nama_lengkap,nik,perusahaan_id', 'pekerja.perusahaan:id,nama_perusahaan'])
                    ->get()
                    ->map(fn ($s) => [
                        'id'            => $s->pekerja?->id,
                        'nama'          => $s->pekerja?->nama_lengkap ?? '-',
                        'nik'           => $s->pekerja?->nik ?? '-',
                        'perusahaan'    => $s->pekerja?->perusahaan?->nama_perusahaan ?? '-',
                        'jenis_kasus'   => $s->jenis_kasus ? strtoupper($s->jenis_kasus) : '-',
                        'status_detail' => $s->status_detail ?? '-',
                        'progress'      => $s->progress_percentage,
                    ])->values();
            }

            $results[] = [
                'key'     => $step['key'],
                'label'   => $step['label'],
                'jumlah'  => $count,
                'pekerja' => $workers,
            ];
        }

        return [
            'summary' => $summary,
            'data' => $results,
            'total' => $totalAll
        ];
    }

    /**
     * Get all active cases.
     *
     * @return Collection
     */
    /**
     * Get paginated active cases.
     *
     * @param int $perPage
     * @return \Illuminate\Pagination\LengthAwarePaginator
     */
    public function getPaginatedCases(int $perPage = 10)
    {
        return StatusAdvokasi::with([
            'pekerja.perusahaan', 
            'pekerja.user', 
            'pekerja.latestDetailMedis', 
            'pekerja.currentJob'
        ])
            ->whereNotNull('jenis_kasus')
            ->latest('updated_at')
            ->paginate($perPage);
    }

    /**
     * Get all active cases.
     *
     * @return Collection
     */
    public function getAllCases(): Collection
    {
        return StatusAdvokasi::with([
            'pekerja.perusahaan', 
            'pekerja.user', 
            'pekerja.latestDetailMedis', 
            'pekerja.currentJob'
        ])
            ->whereNotNull('jenis_kasus')
            ->get()
            ->map(function($case) {
                $case->jenis_kasus = strtoupper($case->jenis_kasus);
                return $case;
            });
    }

    /**
     * Get details for a specific case by ID.
     *
     * @param string $id
     * @return StatusAdvokasi|null
     */
    public function getCaseDetails(string $id): ?StatusAdvokasi
    {
        return StatusAdvokasi::with([
            'pekerja.perusahaan', 
            'pekerja.user', 
            'pekerja.riwayatPekerja.detailMedis', 
            'pekerja.detailMedis',
            'pekerja.currentJob',
            'pekerja.latestDetailMedis'
        ])->find($id);
    }

    /**
     * Update an advocacy case's metadata, milestones, and handle file uploads.
     *
     * @param string $pekerja_id
     * @param array $data Input data
     * @param mixed $files Uploaded file(s)
     * @return StatusAdvokasi
     */
    public function updateTracker(string $pekerja_id, array $data, $files = null): StatusAdvokasi
    {
        $status = StatusAdvokasi::where('pekerja_id', $pekerja_id)->firstOrFail();

        $validColumns = [
            'riwayat_pajanan' => 'bukti_pajanan_path', 
            'persetujuan_dokter' => 'bukti_persetujuan_dokter_path', 
            'perusahaan_lapor' => 'bukti_perusahaan_lapor_path',
            'penetapan_pak' => 'bukti_penetapan_pak_path',
            'kompensasi_bpjstk' => 'bukti_kompensasi_bpjstk_path',
            'rehabilitasi_bpjskes' => 'bukti_rehabilitasi_bpjskes_path'
        ];

        $dateColumns = [
            'riwayat_pajanan' => 'bukti_pajanan_at',
            'persetujuan_dokter' => 'bukti_persetujuan_dokter_at',
            'perusahaan_lapor' => 'bukti_perusahaan_lapor_at',
            'penetapan_pak' => 'bukti_penetapan_pak_at',
            'kompensasi_bpjstk' => 'bukti_kompensasi_bpjstk_at',
            'rehabilitasi_bpjskes' => 'bukti_rehabilitasi_bpjskes_at'
        ];

        // 1. Process File Uploads (if any)
        if ($files && isset($data['step_key'])) {
            $stepKey = $data['step_key'];
            if (array_key_exists($stepKey, $validColumns)) {
                $columnName = $validColumns[$stepKey];

                if ($status->{$columnName}) {
                    Storage::disk('private')->delete($status->{$columnName});
                }

                if (!is_array($files)) {
                    $files = [$files];
                }

                $path = $this->processAndStoreFiles($files, 'bukti_advokasi', $pekerja_id);
                $status->{$columnName} = $path;

                $actualNameColumn = str_replace('_path', '_name', $columnName);
                $status->{$actualNameColumn} = count($files) > 1 ? 'Dokumen_Gabungan.pdf' : $files[0]->getClientOriginalName();
                
                // Automatically set boolean and date
                $status->{$stepKey} = true;
                if (isset($dateColumns[$stepKey])) {
                    $status->{$dateColumns[$stepKey]} = now();
                }
            }
        }

        // 2. Update basic metadata
        $metaFields = ['jenis_kasus', 'tahap', 'status_detail', 'tanggal_pelaporan', 'catatan'];
        foreach ($metaFields as $field) {
            if (isset($data[$field])) {
                // Convert empty strings to null for database compatibility (especially for dates)
                $value = $data[$field];
                $status->{$field} = ($value === '' || $value === null) ? null : $value;
            }
        }

        // 3. Update boolean milestone indicators directly (via form API)
        $boolFields = array_keys($validColumns);
        foreach ($boolFields as $field) {
            if (isset($data[$field])) {
                $wasFalse = !$status->{$field};
                $status->{$field} = filter_var($data[$field], FILTER_VALIDATE_BOOLEAN);
                
                // If becomes true via checkbox, record date
                if ($wasFalse && $status->{$field} && isset($dateColumns[$field])) {
                    $status->{$dateColumns[$field]} = now();
                }
            }
        }
        
        // 4. Update author indicator
        $user = auth()->user();
        if ($user) {
            // If admin/petugas updates, set to true. If viewer (owner) updates, set to false.
            $status->is_admin_note = in_array($user->role, ['admin', 'petugas']);
        }

        $status->save();
        return $status;
    }

    /**
     * Get prioritized cases based on the 5-year legal deadline for PAK advocacy.
     *
     * @param int $limit
     * @return Collection
     */
    public function getPriorityCases(int $limit = 5): Collection
    {
        return StatusAdvokasi::with(['pekerja.perusahaan', 'pekerja.riwayatPekerja'])
            ->where('jenis_kasus', 'PAK')
            ->where('rehabilitasi_bpjskes', false) // Only active cases
            ->get()
            ->map(function ($case) {
                $pekerja = $case->pekerja;
                if (!$pekerja) return null;

                // Find the relevant job record with a departure date
                $latestJob = $pekerja->riwayatPekerja
                    ->whereNotNull('tgl_keluar')
                    ->sortByDesc('tgl_keluar')
                    ->first();

                if (!$latestJob) return null;

                $tglKeluar = \Carbon\Carbon::parse($latestJob->tgl_keluar);
                $deadline = $tglKeluar->copy()->addYears(5);
                $daysRemaining = now()->diffInDays($deadline, false);

                // Attach priority metadata
                $case->days_remaining = $daysRemaining;
                $case->deadline_date = $deadline->toDateString();
                $case->latest_pajanan = $latestJob->jenis_pajanan;
                $case->is_very_urgent = $daysRemaining <= 180; // Less than 6 months
                
                return $case;
            })
            ->filter(fn($c) => $c !== null && $c->days_remaining <= 365) // Within 1 year of deadline
            ->sortBy('days_remaining')
            ->take($limit)
            ->values();
    }
}
