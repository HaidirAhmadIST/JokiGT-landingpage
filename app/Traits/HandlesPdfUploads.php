<?php
 
namespace App\Traits;
 
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
 
trait HandlesPdfUploads
{
    /**
     * Internal helper to convert multiple images to a single PDF and store it.
     */
    protected function processAndStoreFiles(array $files, string $folder, string $id): string
    {
        // If single file and already PDF, just store it directly to save resources
        if (count($files) === 1 && $files[0]->getClientOriginalExtension() === 'pdf') {
            $filename = $folder . '_' . $id . '_' . time() . '.pdf';
            $path = $folder . '/' . $filename;
            Storage::disk('private')->put($path, file_get_contents($files[0]->getRealPath()));
            return $path;
        }
 
        // Convert all to PDF
        $images = [];
        foreach ($files as $file) {
            $extension = strtolower($file->getClientOriginalExtension());
            if (in_array($extension, ['jpg', 'jpeg', 'png', 'webp'])) {
                // Convert to data URI for embedding in PDF
                $data = file_get_contents($file->getRealPath());
                $base64 = 'data:image/' . $extension . ';base64,' . base64_encode($data);
                $images[] = $base64;
            }
        }
 
        // If no images were processed but we have files (maybe all non-images), fallback to regular storage of first file
        if (empty($images) && count($files) > 0) {
            $filename = $folder . '_' . $id . '_' . time() . '.' . $files[0]->getClientOriginalExtension();
            $path = $folder . '/' . $filename;
            Storage::disk('private')->put($path, file_get_contents($files[0]->getRealPath()));
            return $path;
        }
 
        // Generate PDF
        $pdf = Pdf::loadView('pdf.images', ['images' => $images]);
        
        $filename = $folder . '_' . $id . '_' . time() . '.pdf';
        $path = $folder . '/' . $filename;
        
        Storage::disk('private')->put($path, $pdf->output());
 
        return $path;
    }
}
