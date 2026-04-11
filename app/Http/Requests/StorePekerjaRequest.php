<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
            'email' => ['required', 'string', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            
            // Pekerja Data
            'perusahaan_id' => ['required', 'exists:perusahaan,id'],
            'nik' => ['required', 'string', 'size:16', 'unique:pekerja,nik'],
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'status_kesehatan' => ['required', 'in:sehat,sakit_ringan,sakit_berat,dalam_perawatan'],
            'catatan_admin' => ['nullable', 'string'],
            'tanggal_lahir' => ['nullable', 'date'],
            'jenis_kelamin' => ['nullable', 'in:L,P'],
            'whatsapp' => ['nullable', 'string'],
            'domisili' => ['nullable', 'string'],

            // Riwayat Pekerja Data (Optional)
            'riwayat' => ['nullable', 'array'],
            'riwayat.*.nama_perusahaan' => ['required', 'string'],
            'riwayat.*.deskripsi_usaha' => ['nullable', 'string'],
            'riwayat.*.bagian' => ['nullable', 'string'],
            'riwayat.*.tgl_masuk' => ['nullable', 'date'],
            'riwayat.*.tgl_keluar' => ['nullable', 'date', 'after_or_equal:riwayat.*.tgl_masuk'],

            // Detail Medis Data (Optional)
            'medis' => ['nullable', 'array'],
            'medis.*.tgl_pemeriksaan' => ['required', 'date'],
            'medis.*.tempat_pemeriksa' => ['required', 'string'],
            'medis.*.jenis_pemeriksa' => ['required', 'string'],
            'medis.*.dokter_pemeriksa' => ['required', 'string'],
            'medis.*.hasil_diagnosis' => ['required', 'string'],
            'medis.*.golongan_darah' => ['nullable', 'string', 'in:A,B,AB,O'],
            'medis.*.rhesus' => ['nullable', 'string', 'in:+,-'],
            'medis.*.riwayat_penyakit' => ['nullable', 'string'],
            'medis.*.alergi' => ['nullable', 'string'],
            'medis.*.riwayat_operasi' => ['nullable', 'string'],
            'medis.*.obat_rutin' => ['nullable', 'string'],
        ];
    }
}
