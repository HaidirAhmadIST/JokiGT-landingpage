<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAdvokasiRequest;
use App\Models\StatusAdvokasi;
use App\Models\Pekerja;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdvokasiController extends Controller
{
    /**
     * Return counts of workers who have completed each advokasi step.
     * The 6 steps map directly to boolean columns in status_advokasi.
     */
    public function stats(): JsonResponse
    {
        $steps = [
            [
                'key'    => 'riwayat_pajanan',
                'label'  => 'Riwayat Pajanan',
                'column' => 'riwayat_pajanan',
            ],
            [
                'key'    => 'persetujuan_dokter',
                'label'  => 'Evaluasi Dokter Okupasi',
                'column' => 'persetujuan_dokter',
            ],
            [
                'key'    => 'perusahaan_lapor',
                'label'  => 'Laporan Perusahaan',
                'column' => 'perusahaan_lapor',
            ],
            [
                'key'    => 'penetapan_pak',
                'label'  => 'Penetapan PAK',
                'column' => 'penetapan_pak',
            ],
            [
                'key'    => 'kompensasi_bpjstk',
                'label'  => 'Klaim JKK BPJS',
                'column' => 'kompensasi_bpjstk',
            ],
            [
                'key'    => 'rehabilitasi_bpjskes',
                'label'  => 'Rehabilitasi Medik',
                'column' => 'rehabilitasi_bpjskes',
            ],
        ];

        $results = [];

        foreach ($steps as $step) {
            $col = $step['column'];

            // Workers who have COMPLETED this step (boolean = true)
            $workers = StatusAdvokasi::with([
                    'pekerja:id,nama_lengkap,nik',
                    'pekerja.perusahaan:id,nama_perusahaan',
                ])
                ->where($col, true)
                ->get()
                ->map(fn ($s) => [
                    'id'            => $s->pekerja->id ?? null,
                    'nama'          => $s->pekerja->nama_lengkap ?? '-',
                    'nik'           => $s->pekerja->nik ?? '-',
                    'perusahaan'    => $s->pekerja->perusahaan->nama_perusahaan ?? '-',
                    'jenis_kasus'   => $s->jenis_kasus,
                    'status_detail' => $s->status_detail,
                    'progress'      => $s->progress_percentage,
                ]);

            $results[] = [
                'key'     => $step['key'],
                'label'   => $step['label'],
                'jumlah'  => $workers->count(),
                'pekerja' => $workers->values(),
            ];
        }

        // Total unique workers with at least one step done
        $totalUnique = StatusAdvokasi::where(function ($q) {
            $q->where('riwayat_pajanan', true)
              ->orWhere('persetujuan_dokter', true)
              ->orWhere('perusahaan_lapor', true)
              ->orWhere('penetapan_pak', true)
              ->orWhere('kompensasi_bpjstk', true)
              ->orWhere('rehabilitasi_bpjskes', true);
        })->count();

        return response()->json([
            'status' => 'success',
            'total'  => $totalUnique,
            'data'   => $results,
        ]);
    }

    /**
     * Display a listing of advocacy cases.
     */
    public function index(): JsonResponse
    {
        // Get all workers who have an advocacy case started (non-null jenis_kasus)
        // or just all workers with their status
        $cases = StatusAdvokasi::with(['pekerja.perusahaan', 'pekerja.user'])
            ->whereNotNull('jenis_kasus')
            ->latest()
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $cases
        ]);
    }

    /**
     * Update the advocacy status and handle evidence uploads.
     */
    public function update(UpdateAdvokasiRequest $request, string $pekerja_id): JsonResponse
    {
        $status = StatusAdvokasi::where('pekerja_id', $pekerja_id)->first();

        if (!$status) {
            return response()->json(['status' => 'error', 'message' => 'Status advokasi tidak ditemukan untuk pekerja ini.'], 404);
        }

        // Handle file upload securely into the 'private' disk
        if ($request->hasFile('file') && $request->has('step_key')) {
            $stepKey = $request->input('step_key');
            
            $validColumns = [
                'riwayat_pajanan' => 'bukti_pajanan_path', 
                'persetujuan_dokter' => 'bukti_persetujuan_dokter_path', 
                'perusahaan_lapor' => 'bukti_perusahaan_lapor_path',
                'penetapan_pak' => 'bukti_penetapan_pak_path',
                'kompensasi_bpjstk' => 'bukti_kompensasi_bpjstk_path',
                'rehabilitasi_bpjskes' => 'bukti_rehabilitasi_bpjskes_path'
            ];

            if (array_key_exists($stepKey, $validColumns)) {
                $columnName = $validColumns[$stepKey];

                // Delete old file if exists
                if ($status->{$columnName}) {
                    Storage::disk('private')->delete($status->{$columnName});
                }

                $path = $request->file('file')->store('bukti_advokasi', 'private');
                $status->{$columnName} = $path;
            }
        }

        // Update fields including new metadata
        $fields = [
            'jenis_kasus', 'tahap', 'status_detail', 'tanggal_pelaporan', 'catatan',
            'riwayat_pajanan', 'persetujuan_dokter', 'perusahaan_lapor',
            'penetapan_pak', 'kompensasi_bpjstk', 'rehabilitasi_bpjskes'
        ];

        // 1. Update String Metadata
        $metaFields = ['jenis_kasus', 'tahap', 'status_detail', 'tanggal_pelaporan', 'catatan'];
        foreach ($metaFields as $field) {
            if ($request->has($field)) {
                $status->{$field} = $request->input($field);
            }
        }

        // 2. Update Boolean Progress Steps
        $boolFields = [
            'riwayat_pajanan', 'persetujuan_dokter', 'perusahaan_lapor',
            'penetapan_pak', 'kompensasi_bpjstk', 'rehabilitasi_bpjskes'
        ];

        foreach ($boolFields as $field) {
            if ($request->has($field)) {
                $status->{$field} = filter_var($request->input($field), FILTER_VALIDATE_BOOLEAN);
            }
        }

        $status->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Status advokasi berhasil diperbarui.',
            'data' => $status->load(['pekerja.perusahaan', 'pekerja.user']),
            'progress' => $status->progress_percentage
        ]);
    }
}
