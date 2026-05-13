<?php

namespace App\Providers;

use App\Models\Pekerja;
use App\Policies\PekerjaPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

/**
 * AppServiceProvider
 *
 * Mendaftarkan semua Policy dan binding aplikasi.
 * Semua aturan otorisasi (Policy) harus didaftarkan di sini
 * agar Laravel dapat menemukannya saat Controller memanggil `$this->authorize()`.
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * Mendaftarkan Policy untuk setiap model yang perlu dilindungi dari IDOR.
     * Format: Gate::policy(Model::class, PolicyClass::class)
     */
    public function boot(): void
    {
        // Otorisasi akses ke data Pekerja (mencegah IDOR pada GET /pekerja/{id} dan foto)
        Gate::policy(Pekerja::class, PekerjaPolicy::class);
    }
}
