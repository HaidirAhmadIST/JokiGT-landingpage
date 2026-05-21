'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { RiskMap } from './RiskMap';

export const MapContainer: React.FC = () => {
  const [isInView, setIsInView] = useState(false);
  const [lockedProvince, setLockedProvince] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy load map when in view for optimized page-load performance
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

  const handleProvinceClick = useCallback((provinceId: string, properties: any) => {
    if (properties && properties.province_name) {
      // Toggle selection or lock new province
      setLockedProvince((prev) => 
        prev === properties.province_name ? null : properties.province_name
      );
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative flex h-[80vh] w-full flex-row overflow-hidden rounded-3xl border border-slate-200 shadow-xl lg:h-[700px] bg-slate-50"
    >
      {/* Map View Section */}
      <div className="flex-1 h-full relative">
        {isInView ? (
          <RiskMap 
            onProvinceClick={handleProvinceClick} 
            lockedProvinceName={lockedProvince} 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
            <Loader2 className="h-10 w-10 text-sky-600 animate-spin mb-4" />
            <p className="text-slate-500 font-bold">Menyiapkan Visualisasi Peta...</p>
          </div>
        )}
      </div>
    </div>
  );
};
