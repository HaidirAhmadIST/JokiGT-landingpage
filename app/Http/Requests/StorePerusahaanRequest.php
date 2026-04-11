<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePerusahaanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Use middleware to handle authorization
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Saat update, ambil ID perusahaan dari route parameter
        // agar validasi unique mengabaikan record milik sendiri.
        // Parameter {perusahaan} di route akan berisi ID string karena tidak ada Route Model Binding.
        $perusahaanId = $this->route('perusahaan');

        return [
            'nama_perusahaan' => [
                'required', 
                'string', 
                'max:255', 
                Rule::unique('perusahaan', 'nama_perusahaan')
                    ->ignore($perusahaanId)
                    ->whereNull('deleted_at') // Abaikan record yang sudah di-soft delete
            ],
            'sektor_industri' => ['nullable', 'string', 'max:255'],
            'status_pendamping' => ['required', 'in:aktif,tidak_aktif,pending'],
            'alamat' => ['nullable', 'string'],
            'nama_pic' => ['nullable', 'string', 'max:255'],
            'kontak_pic' => ['nullable', 'string', 'max:255'],
            'nama_pic_lion' => ['nullable', 'string', 'max:255'],
            'nara_hubung_lion' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Pre-process input for validation.
     */
    protected function prepareForValidation()
    {
        if ($this->has('nama_perusahaan')) {
            $this->merge([
                'nama_perusahaan' => trim($this->nama_perusahaan),
            ]);
        }
    }
}
