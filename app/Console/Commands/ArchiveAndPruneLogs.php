<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class ArchiveAndPruneLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logs:archive {--months=6 : Number of months to keep in database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Archive old activity logs to CSV and prune them from the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $months = (int) $this->option('months');
        $cutoffDate = Carbon::now()->subMonths($months);

        $this->info("Mencari log yang lebih lama dari: {$cutoffDate->format('d M Y')}");

        $query = ActivityLog::where('created_at', '<', $cutoffDate);
        $count = $query->count();

        if ($count === 0) {
            $this->info("Tidak ada log lama yang perlu diarsipkan.");
            return 0;
        }

        $this->info("Ditemukan {$count} log. Memulai proses pengarsipan...");

        // 1. Siapkan Folder
        $directory = 'archives/logs';
        if (!Storage::exists($directory)) {
            Storage::makeDirectory($directory);
        }

        $filename = "logs_archive_" . Carbon::now()->format('Y_m_d_His') . ".csv";
        $filePath = "{$directory}/{$filename}";
        
        // Pastikan folder fisik ada di storage/app/archives/logs
        $physicalPath = storage_path("app/" . $directory);
        if (!file_exists($physicalPath)) {
            mkdir($physicalPath, 0755, true);
        }

        $fullPath = storage_path("app/{$filePath}");

        // 2. Tulis ke CSV (Stream untuk menghemat RAM)
        $file = fopen($fullPath, 'w');
        
        // Header CSV
        fputcsv($file, ['ID', 'User ID', 'User Name', 'Action', 'Description', 'Category', 'Loggable Type', 'Loggable ID', 'Metadata', 'Created At']);

        $query->chunk(500, function ($logs) use ($file) {
            foreach ($logs as $log) {
                fputcsv($file, [
                    $log->id,
                    $log->user_id,
                    $log->user_name,
                    $log->action,
                    $log->description,
                    $log->category,
                    $log->loggable_type,
                    $log->loggable_id,
                    json_encode($log->metadata),
                    $log->created_at,
                ]);
            }
        });

        fclose($file);

        $this->info("Arsip berhasil disimpan di: {$fullPath}");

        // 3. Hapus dari Database
        $this->warn("Menghapus {$count} data dari database...");
        $query->delete();

        $this->info("Proses pemeliharaan selesai dengan sukses.");

        return 0;
    }
}
