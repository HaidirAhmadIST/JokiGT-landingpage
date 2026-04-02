<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAdvokasiRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'riwayat_pajanan' => ['nullable', 'boolean'],
            'persetujuan_dokter' => ['nullable', 'boolean'],
            'perusahaan_lapor' => ['nullable', 'boolean'],
            'penetapan_pak' => ['nullable', 'boolean'],
            'kompensasi_bpjstk' => ['nullable', 'boolean'],
            'rehabilitasi_bpjskes' => ['nullable', 'boolean'],
            
            // Bukti Pajanan Upload (Max 5MB, PDF/Images only)
            'bukti_pajanan' => [
                'nullable', 
                'file', 
                'mimes:pdf,jpg,jpeg,png', 
                'max:5120'
            ],
        ];
    }
}
