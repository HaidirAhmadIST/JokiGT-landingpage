<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Pekerja;
use App\Models\Perusahaan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminPengurusController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'nama_lengkap' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'nama_serikat' => 'required|string|max:255',
            'nama_perusahaan' => 'required|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            $passwordPlain = 'pak' . rand(1000, 9999) . '!';

            $user = User::create([
                'nama' => $request->nama_lengkap,
                'email' => $request->email,
                'password' => Hash::make($passwordPlain),
                'role' => 'petugas',
                'serikat' => $request->nama_serikat,
            ]);

            $perusahaan = Perusahaan::firstOrCreate(
                ['nama_perusahaan' => $request->nama_perusahaan],
                ['status_pendamping' => 'Dalam Pantauan']
            );

            $pekerja = Pekerja::create([
                'user_id' => $user->id,
                'nama_lengkap' => $request->nama_lengkap,
                'is_pengurus_serikat' => true,
                'is_anggota' => true,
                'serikat' => $request->nama_serikat,
                'nama_serikat' => $request->nama_serikat,
                'perusahaan_id' => $perusahaan->id,
                'status_kesehatan' => 'sehat', // Default
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Akun Pengurus Serikat berhasil dibuat.',
                'data' => [
                    'email' => $user->email,
                    'password' => $passwordPlain,
                    'nama_lengkap' => $pekerja->nama_lengkap,
                    'perusahaan' => $perusahaan->nama_perusahaan,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat akun: ' . $e->getMessage()
            ], 500);
        }
    }
}
