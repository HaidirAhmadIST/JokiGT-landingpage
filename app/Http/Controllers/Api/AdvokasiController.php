<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAdvokasiRequest;
use App\Models\StatusAdvokasi;
use App\Models\Pekerja;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Traits\HandlesPdfUploads;
use App\Services\AdvokasiService;
use Barryvdh\DomPDF\Facade\Pdf;

class AdvokasiController extends Controller
{
    private AdvokasiService $advokasiService;

    public function __construct(AdvokasiService $advokasiService)
    {
        $this->advokasiService = $advokasiService;
    }

    /**
     * Return counts of workers who have completed each advokasi step.
     */
    public function stats(): JsonResponse
    {
        $stats = $this->advokasiService->getStats();
        
<<<<<<< HEAD
=======
        // 2. Selesai (rehabilitasi_bpjskes = true)
        $selesaiAll = StatusAdvokasi::where('rehabilitasi_bpjskes', true)->count();
        $selesaiLastMonth = StatusAdvokasi::where('rehabilitasi_bpjskes', true)
            ->where('created_at', '<', $startOfThisMonth)
            ->count();

        // 3. Dalam Proses (Total - Selesai)
        $prosesAll = $totalAll - $selesaiAll;
        $prosesLastMonth = $totalLastMonth - $selesaiLastMonth;

        $summary = [
            'total' => [
                'count' => $totalAll,
                'trend' => $calcTrend($totalAll, $totalLastMonth)
            ],
            'proses' => [
                'count' => $prosesAll,
                'trend' => $calcTrend($prosesAll, $prosesLastMonth)
            ],
            'selesai' => [
                'count' => $selesaiAll,
                'trend' => $calcTrend($selesaiAll, $selesaiLastMonth)
            ]
        ];

        // Existing step-by-step logic
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
            $workers = StatusAdvokasi::with(['pekerja:id,nama_lengkap,nik,perusahaan_id', 'pekerja.perusahaan:id,nama_perusahaan', 'pekerja.detailMedis'])
                ->where($col, true)
                ->get()
                ->map(fn ($s) => [
                    'id'            => $s->pekerja?->id ?? null,
                    'nama'          => $s->pekerja?->nama_lengkap ?? '-',
                    'nik'           => $s->pekerja?->nik ?? '-',
                    'perusahaan'    => $s->pekerja?->perusahaan?->nama_perusahaan ?? '-',
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

>>>>>>> 6752ea5 (fix: resolve conflicts after pull and apply advocacy dashboard fixes)
        return response()->json([
            'status'  => 'success',
            'summary' => $stats['summary'],
            'data'    => $stats['data'],
        ]);
    }

    public function index(): JsonResponse
    {
<<<<<<< HEAD
=======
        $cases = StatusAdvokasi::with(['pekerja.perusahaan', 'pekerja.user', 'pekerja.detailMedis'])
            ->whereNotNull('jenis_kasus')
            ->latest()
            ->get();

>>>>>>> 6752ea5 (fix: resolve conflicts after pull and apply advocacy dashboard fixes)
        return response()->json([
            'status' => 'success',
            'data' => $this->advokasiService->getAllCases()
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $status = $this->advokasiService->getCaseDetails($id);

        if (!$status) {
            $status = new StatusAdvokasi();
            $status->pekerja_id = $pekerja_id;
        }

        return response()->json([
            'status' => 'success',
            'data' => $status
        ]);
    }

    public function exportPdf(string $id)
    {
        $status = $this->advokasiService->getCaseDetails($id);

        if (!$status) {
            return response()->json(['status' => 'error', 'message' => 'Status advokasi tidak ditemukan.'], 404);
        }

        $pdf = Pdf::loadView('pdf.advokasi-detail', ['advokasi' => $status]);
        
        return $pdf->stream('Laporan-Advokasi-ADV-' . str_pad($status->id, 5, '0', STR_PAD_LEFT) . '.pdf');
    }

    public function update(UpdateAdvokasiRequest $request, string $pekerja_id): JsonResponse
    {
        try {
            $files = $request->hasFile('file') ? $request->file('file') : null;
            $data = $request->all();
            
            $status = $this->advokasiService->updateTracker($pekerja_id, $data, $files);

            return response()->json([
                'status' => 'success',
                'message' => 'Status advokasi berhasil diperbarui.',
                'data' => $status->load(['pekerja.perusahaan', 'pekerja.user']),
                'progress' => $status->progress_percentage
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['status' => 'error', 'message' => 'Status advokasi tidak ditemukan.'], 404);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Gagal memperbarui status advokasi: ' . $e->getMessage()], 500);
        }
    }
}
