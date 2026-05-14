import React from 'react';
import { MapContainer } from '@/components/map/MapContainer';

export const metadata = {
  title: 'Peta Risiko Asbes Nasional | Rekam Jejak PAK',
  description: 'Peta Choropleth interaktif untuk memantau sebaran risiko asbes di Indonesia.',
};

export default function PetaRisikoPage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
            Peta Sebaran Risiko Asbes Nasional
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-500">
            Peta interaktif ini menampilkan tingkat risiko pajanan asbes di berbagai provinsi. 
            Klik pada area provinsi untuk melihat detail laporan yang masuk.
          </p>
        </div>

        {/* Map Component */}
        <MapContainer />

      </div>
    </div>
  );
}
