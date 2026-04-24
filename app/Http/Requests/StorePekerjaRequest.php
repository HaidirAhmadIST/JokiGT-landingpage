<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePekerjaRequest extends FormRequest
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
            // User Data
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string', 'min:8'],
            
            // Pekerja Data
            'perusahaan_id' => [
                'nullable',
                'exists:perusahaan,id',
                Rule::requiredIf(function () {
                    $status = $this->riwayat[0]['status_pekerjaan'] ?? null;
                    return !in_array($status, ['Borongan', 'Harian Lepas', 'Outsourcing']);
                }),
            ],
            'nik' => ['required', 'string', 'size:16'],
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'status_kesehatan' => ['required', 'in:sehat,sehat_dengan_catatan,tidak_sehat'],
            'catatan_admin' => ['nullable', 'string'],
            'tanggal_lahir' => ['nullable', 'date'],
            'jenis_kelamin' => ['nullable', 'in:L,P'],
            'whatsapp' => ['nullable', 'string'],
            'domisili' => ['nullable', 'string'],

            // Riwayat Pekerja Data (Optional)
            'riwayat' => ['nullable', 'array'],
            'riwayat.*.status_pekerjaan' => ['nullable', 'string'],
            'riwayat.*.nama_perusahaan' => ['required', 'string'],
            'riwayat.*.nama_agen_penyalur' => ['nullable', 'string'],
            'riwayat.*.deskripsi_usaha' => ['nullable', 'string'],
            'riwayat.*.bagian' => ['nullable', 'string'],
            'riwayat.*.jabatan' => ['nullable', 'string'],
            'riwayat.*.tgl_masuk' => ['nullable', 'date'],
            'riwayat.*.tgl_keluar' => ['nullable', 'date', 'after_or_equal:riwayat.*.tgl_masuk'],
            'riwayat.*.tanggal_selesai_kontrak' => ['nullable', 'date', 'after_or_equal:riwayat.*.tgl_masuk'],
            'riwayat.*.jenis_pajanan' => ['nullable', 'string'],
            'riwayat.*.durasi_pajanan' => ['nullable', 'integer'],

            // Riwayat Medis (Baseline) Data (Optional)
            'riwayat_medis' => ['nullable', 'array'],
            'riwayat_medis.golongan_darah' => ['nullable', 'in:A,B,AB,O'],
            'riwayat_medis.rhesus' => ['nullable', 'in:+,-'],
            'riwayat_medis.riwayat_penyakit' => ['nullable', 'array'],
            'riwayat_medis.alergi' => ['nullable', 'array'],
            'riwayat_medis.riwayat_operasi' => ['nullable', 'array'],
            'riwayat_medis.obat_rutin' => ['nullable', 'string'],

            // Detail Medis (Transactional) Data (Optional)
            'medis' => ['nullable', 'array'],
            'medis.*.tanggal_pemeriksaan' => ['required', 'date', 'before_or_equal:today'],
            'medis.*.tempat_pemeriksaan' => ['required', 'string', 'max:255'],
            'medis.*.jenis_pemeriksaan' => ['required', 'string'],
            'medis.*.dokter' => ['required', 'string', 'max:255'],
            'medis.*.status_kesehatan' => ['required', 'in:sehat,sehat_dengan_catatan,tidak_sehat'],
            'medis.*.hasil_diagnosis' => ['required', 'string'],
            'medis.*.golongan_darah' => ['nullable', 'string', 'in:A,B,AB,O'],
            'medis.*.rhesus' => ['nullable', 'string', 'in:+,-'],
            'medis.*.riwayat_penyakit' => ['nullable', 'string'],
            'medis.*.alergi' => ['nullable', 'string'],
            'medis.*.riwayat_operasi' => ['nullable', 'string'],
            'medis.*.obat_rutin' => ['nullable', 'string'],
        ];
    }
    
    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'medis.*.tanggal_pemeriksaan.before_or_equal' => 'Tanggal pemeriksaan tidak boleh mendahului hari ini.',
        ];
    }
}
