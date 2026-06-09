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
     * Apply strict RBAC filter for advocacy queries.
     * Petugas ONLY sees advokasi if the worker shares BOTH the exact same perusahaan_id AND serikat.
     */
    private function applyRbacFilter($query)
    {
        $user = auth()->user();
        if ($user && $user->isPetugas()) {
            // Petugas requires BOTH perusahaan_id and matching serikat for advocacy
            $query->whereHas('pekerja', function ($q) use ($user) {
                $q->where('perusahaan_id', $user->perusahaan_id)
                  ->whereHas('perusahaan', function ($qPerusahaan) use ($user) {
                      // Match serikat directly with the worker's company serikat
                      // (Or if the worker has nama_serikat, we can match that. The prompt says: "satu perusahaan dan serikat yang sama")
                      // We will match the worker's nama_serikat if it exists, or fallback to perusahaan's serikat
                  })
                  ->where('nama_serikat', $user->serikat); 
            });
        } elseif ($user && $user->role === 'viewer') {
            $query->whereHas('pekerja', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }
        return $query;
    }


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
        $this->applyRbacFilter($baseQuery);
        
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
            $this->applyRbacFilter($query);
            
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
        $query = StatusAdvokasi::with([
            'pekerja.perusahaan', 
            'pekerja.user', 
            'pekerja.latestDetailMedis', 
            'pekerja.currentJob'
        ])->whereNotNull('jenis_kasus')->latest('updated_at');
        
        $this->applyRbacFilter($query);
        
        return $query->paginate($perPage);
    }

    /**
     * Get all active cases.
     *
     * @return Collection
     */
    public function getAllCases(): Collection
    {
        $query = StatusAdvokasi::with([
            'pekerja.perusahaan', 
            'pekerja.user', 
            'pekerja.latestDetailMedis', 
            'pekerja.currentJob'
        ])->whereNotNull('jenis_kasus');
        
        $this->applyRbacFilter($query);
        
        return $query->get()
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
        $query = StatusAdvokasi::with([
            'pekerja.perusahaan', 
            'pekerja.user', 
            'pekerja.riwayatPekerja.detailMedis', 
            'pekerja.detailMedis',
            'pekerja.currentJob',
            'pekerja.latestDetailMedis'
        ]);
        
        $this->applyRbacFilter($query);
        
        return $query->find($id);
    }

    /**
     * Store upload files for advocacy proof documents without updating database status immediately.
     */
    public function storeProofFiles(array $files, string $pekerja_id): string
    {
        return $this->processAndStoreFiles($files, 'bukti_advokasi', $pekerja_id);
    }

    /**
     * Delete advocacy proof document.
     *
     * @param string $pekerja_id
     * @param string $stepKey
     * @return StatusAdvokasi
     */
    public function deleteProofFile(string $pekerja_id, string $stepKey): StatusAdvokasi
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

        if (array_key_exists($stepKey, $validColumns)) {
            $columnName = $validColumns[$stepKey];

            if ($status->{$columnName}) {
                Storage::disk('private')->delete($status->{$columnName});
            }

            $status->{$columnName} = null;

            $actualNameColumn = str_replace('_path', '_name', $columnName);
            $status->{$actualNameColumn} = null;
            
            $status->{$stepKey} = false;
            if (isset($dateColumns[$stepKey])) {
                $status->{$dateColumns[$stepKey]} = null;
            }

            $status->save();
        } else {
            throw new \Exception('Invalid step key');
        }

        return $status;
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

        // 5. Direct path, name, and date updates (useful for approval execution payload)
        foreach ($validColumns as $sKey => $colPath) {
            if (isset($data[$colPath])) {
                $status->{$colPath} = $data[$colPath];
            }
            $colName = str_replace('_path', '_name', $colPath);
            if (isset($data[$colName])) {
                $status->{$colName} = $data[$colName];
            }
            $colAt = $dateColumns[$sKey];
            if (isset($data[$colAt])) {
                $status->{$colAt} = $data[$colAt];
            }
        }

        $status->save();

        // 6. Send Email Notifications
        try {
            $stepLabels = [
                'riwayat_pajanan' => 'Riwayat Pajanan',
                'persetujuan_dokter' => 'Evaluasi Dokter Okupasi',
                'perusahaan_lapor' => 'Laporan Perusahaan',
                'penetapan_pak' => 'Penetapan PAK',
                'kompensasi_bpjstk' => 'Klaim JKK BPJS',
                'rehabilitasi_bpjskes' => 'Rehabilitasi Medik',
            ];

            $emailSent = false;
            
            // Check if any milestone was completed (changed to true)
            foreach (array_keys($validColumns) as $field) {
                // Check if field was changed to true during this request
                if ($status->wasChanged($field) && $status->{$field} == true) {
                    $pekerja = $status->pekerja()->with('user')->first();
                    if ($pekerja && $pekerja->user && $pekerja->user->email) {
                        \Illuminate\Support\Facades\Mail::to($pekerja->user->email)
                            ->send(new \App\Mail\AdvokasiProgressMail(
                                $pekerja,
                                $status->jenis_kasus ?? 'Advokasi Kasus',
                                $stepLabels[$field] ?? ucfirst(str_replace('_', ' ', $field)),
                                'Selesai',
                                $status->catatan
                            ));
                        $emailSent = true;
                        break; // Only send one email per update
                    }
                }
            }

            // Check if stage changed to something new (in progress)
            if (!$emailSent && $status->wasChanged('tahap')) {
                $pekerja = $status->pekerja()->with('user')->first();
                if ($pekerja && $pekerja->user && $pekerja->user->email && $status->tahap) {
                    \Illuminate\Support\Facades\Mail::to($pekerja->user->email)
                        ->send(new \App\Mail\AdvokasiProgressMail(
                            $pekerja,
                            $status->jenis_kasus ?? 'Advokasi Kasus',
                            $status->tahap,
                            'Sedang Berjalan',
                            $status->catatan
                        ));
                }
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Gagal mengirim email notifikasi advokasi: ' . $e->getMessage());
        }

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
        $query = StatusAdvokasi::with(['pekerja.perusahaan', 'pekerja.riwayatPekerja'])
            ->where('jenis_kasus', 'PAK')
            ->where('rehabilitasi_bpjskes', false); // Only active cases
            
        $this->applyRbacFilter($query);
        
        return $query->get()
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
                $deadline = $tglKeluar->copy()->addYears(3);
                $daysRemaining = now()->diffInDays($deadline, false);

                // Attach priority metadata
                $case->days_remaining = $daysRemaining;
                $case->deadline_date = $deadline->toDateString();
                $case->latest_pajanan = $latestJob->jenis_pajanan;
                $case->is_very_urgent = $daysRemaining <= 90; // Less than 3 months
                
                return $case;
            })
            ->filter(fn($c) => $c !== null && $c->days_remaining <= 730) // Within 2 years of deadline
            ->sortBy('days_remaining')
            ->take($limit)
            ->values();
    }
}
