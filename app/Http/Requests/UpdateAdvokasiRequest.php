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
        $rules = [
            // Boolean status fields
            'riwayat_pajanan' => ['nullable', 'boolean'],
            'persetujuan_dokter' => ['nullable', 'boolean'],
            'perusahaan_lapor' => ['nullable', 'boolean'],
            'penetapan_pak' => ['nullable', 'boolean'],
            'kompensasi_bpjstk' => ['nullable', 'boolean'],
            'rehabilitasi_bpjskes' => ['nullable', 'boolean'],

            // Shared file upload fields
            'step_key' => ['nullable', 'string', 'in:riwayat_pajanan,persetujuan_dokter,perusahaan_lapor,penetapan_pak,kompensasi_bpjstk,rehabilitasi_bpjskes'],
            'jenis_kasus' => ['nullable', 'string', 'in:pak,k3,phk,PAK,K3,PHK'],
            'tahap' => ['nullable', 'string', 'in:UPTD,BPJS,Pengadilan,uptd,bpjs,pengadilan'],
            'status_detail' => ['nullable', 'string', 'max:255'],
            'tanggal_pelaporan' => ['nullable', 'date'],
            'catatan' => ['nullable', 'string'],
        ];

        // Handle flexible 'file' field (single or array)
        if ($this->hasFile('file')) {
            if (is_array($this->file('file'))) {
                $rules['file'] = ['nullable', 'array', 'max:5'];
                $rules['file.*'] = ['file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'];
            } else {
                $rules['file'] = ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'];
            }
        } else {
            $rules['file'] = ['nullable'];
        }

        return $rules;
    }
}
