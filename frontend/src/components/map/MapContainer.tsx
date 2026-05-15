'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { RiskMap } from './RiskMap';
import { MapSidebar, ProvinceData } from './MapSidebar';

export const MapContainer: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvinceData, setSelectedProvinceData] = useState<ProvinceData | null>(null);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy load map when in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Simulated API Call
  const fetchProvinceReports = async (provinceId: string, properties: any) => {
    setIsSidebarOpen(true);
    setIsLoading(true);

    try {
      // Simulate network delay (e.g., fetching from /api/reports/{provinceId})
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock random report data based on ID for demonstration
      const randomReports = Math.floor(Math.random() * 5000) + 100;

      // Dictionary of real cities/districts for major provinces
      const provinceCitiesMap: Record<string, string[]> = {
        'DKI Jakarta': ['Kota Jakarta Selatan', 'Kota Jakarta Timur', 'Kota Jakarta Barat', 'Kota Jakarta Pusat', 'Kota Jakarta Utara'],
        'Jawa Barat': ['Kota Bandung', 'Kabupaten Bogor', 'Kota Bekasi', 'Kota Depok', 'Kabupaten Bandung'],
        'Jawa Tengah': ['Kota Semarang', 'Kota Surakarta', 'Kabupaten Banyumas', 'Kabupaten Cilacap', 'Kabupaten Magelang'],
        'Jawa Timur': ['Kota Surabaya', 'Kota Malang', 'Kabupaten Sidoarjo', 'Kabupaten Gresik', 'Kabupaten Jember'],
        'Banten': ['Kota Tangerang', 'Kota Tangerang Selatan', 'Kabupaten Serang', 'Kota Cilegon', 'Kabupaten Lebak'],
        'DI Yogyakarta': ['Kota Yogyakarta', 'Kabupaten Sleman', 'Kabupaten Bantul', 'Kabupaten Gunungkidul', 'Kabupaten Kulon Progo'],
        'Bali': ['Kota Denpasar', 'Kabupaten Badung', 'Kabupaten Gianyar', 'Kabupaten Buleleng', 'Kabupaten Tabanan'],
        'Lampung': ['Kota Bandar Lampung', 'Kabupaten Lampung Selatan', 'Kabupaten Lampung Tengah', 'Kota Metro', 'Kabupaten Pesawaran'],
        'Sumatera Utara': ['Kota Medan', 'Kabupaten Deli Serdang', 'Kota Binjai', 'Kabupaten Simalungun', 'Kota Pematangsiantar'],
        'Sumatera Selatan': ['Kota Palembang', 'Kabupaten Banyuasin', 'Kabupaten Ogan Ilir', 'Kota Prabumulih', 'Kota Lubuklinggau'],
        'Sumatera Barat': ['Kota Padang', 'Kota Bukittinggi', 'Kabupaten Agam', 'Kota Pariaman', 'Kabupaten Pesisir Selatan'],
        'Riau': ['Kota Pekanbaru', 'Kota Dumai', 'Kabupaten Kampar', 'Kabupaten Bengkalis', 'Kabupaten Siak'],
        'Kep. Bangka Belitung': ['Kota Pangkal Pinang', 'Kabupaten Bangka', 'Kabupaten Belitung', 'Kabupaten Bangka Barat'],
        'Kepulauan Riau': ['Kota Batam', 'Kota Tanjungpinang', 'Kabupaten Bintan', 'Kabupaten Karimun'],
        'Kalimantan Barat': ['Kota Pontianak', 'Kota Singkawang', 'Kabupaten Kubu Raya', 'Kabupaten Ketapang', 'Kabupaten Sambas'],
        'Kalimantan Timur': ['Kota Balikpapan', 'Kota Samarinda', 'Kabupaten Kutai Kartanegara', 'Kota Bontang', 'Kabupaten Berau'],
        'Kalimantan Selatan': ['Kota Banjarmasin', 'Kota Banjarbaru', 'Kabupaten Banjar', 'Kabupaten Tanah Bumbu', 'Kabupaten Tabalong'],
        'Sulawesi Selatan': ['Kota Makassar', 'Kabupaten Gowa', 'Kabupaten Maros', 'Kota Parepare', 'Kabupaten Bone'],
        'Sulawesi Utara': ['Kota Manado', 'Kota Bitung', 'Kabupaten Minahasa', 'Kota Tomohon', 'Kabupaten Minahasa Utara'],
        'Papua': ['Kota Jayapura', 'Kabupaten Jayapura', 'Kabupaten Mimika', 'Kabupaten Merauke', 'Kabupaten Biak Numfor']
      };

      const realCities = provinceCitiesMap[properties.province_name] || [
        `Kota ${properties.province_name.split(' ')[0]}`,
        `Kabupaten ${properties.province_name.split(' ')[0]}`,
        `Kabupaten ${properties.province_name.split(' ')[0]} Barat`,
        `Kabupaten ${properties.province_name.split(' ')[0]} Timur`
      ];

      const mockCities = realCities.map((cityName, index) => {
        // Distribute reports randomly but decreasingly
        const multiplier = 0.4 - (index * 0.08); 
        return {
          name: cityName,
          reports: Math.max(1, Math.floor(randomReports * (multiplier > 0 ? multiplier : 0.05)))
        };
      });

      setSelectedProvinceData({
        province_name: properties.province_name,
        risk_level: properties.risk_level,
        total_reports: randomReports,
        cities: mockCities,
      });
    } catch (error) {
      console.error("Failed to fetch reports", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProvinceClick = useCallback((provinceId: string, properties: any) => {
    fetchProvinceReports(provinceId, properties);
  }, []);

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    // Optionally clear data after animation finishes, but keeping it is fine
  };

  return (
    <div 
      ref={containerRef}
      className="relative h-[80vh] w-full overflow-hidden rounded-3xl border border-slate-200 shadow-xl lg:h-[700px] bg-slate-50"
    >
      {isInView ? (
        <RiskMap onProvinceClick={handleProvinceClick} />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 text-[#0284c7] animate-spin mb-4" />
          <p className="text-slate-500 font-bold">Menyiapkan Visualisasi Peta...</p>
        </div>
      )}
      
      <MapSidebar 
        isOpen={isSidebarOpen} 
        onClose={handleCloseSidebar} 
        isLoading={isLoading} 
        data={selectedProvinceData} 
      />
    </div>
  );
};
