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
            // Boolean status fields
            'riwayat_pajanan' => ['nullable', 'boolean'],
            'persetujuan_dokter' => ['nullable', 'boolean'],
            'perusahaan_lapor' => ['nullable', 'boolean'],
            'penetapan_pak' => ['nullable', 'boolean'],
            'kompensasi_bpjstk' => ['nullable', 'boolean'],
            'rehabilitasi_bpjskes' => ['nullable', 'boolean'],

            // Shared file upload fields (used in the registration loop)
            'step_key' => ['nullable', 'string', 'in:riwayat_pajanan,persetujuan_dokter,perusahaan_lapor,penetapan_pak,kompensasi_bpjstk,rehabilitasi_bpjskes'],
            'file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            
            // Metadata fields
            'jenis_kasus' => ['nullable', 'string'],
            'tahap' => ['nullable', 'string'],
            'status_detail' => ['nullable', 'string'],
            'tanggal_pelaporan' => ['nullable', 'date'],
            'catatan' => ['nullable', 'string'],
            
            // Legacy/Specific file upload fields
            'bukti_pajanan' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'bukti_persetujuan_dokter' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'bukti_perusahaan_lapor' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'bukti_penetapan_pak' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'bukti_kompensasi_bpjstk' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'bukti_rehabilitasi_bpjskes' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ];
    }
}
