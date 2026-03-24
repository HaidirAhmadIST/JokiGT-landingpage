<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
        return [
            'nama_perusahaan' => ['required', 'string', 'max:255', 'unique:perusahaan,nama_perusahaan'],
            'sektor_industri' => ['nullable', 'string', 'max:255'],
            'status_pendamping' => ['required', 'in:aktif,tidak_aktif,pending'],
            'alamat' => ['nullable', 'string'],
            'nama_pic' => ['nullable', 'string', 'max:255'],
            'kontak_pic' => ['nullable', 'string', 'max:255'],
        ];
    }
}
