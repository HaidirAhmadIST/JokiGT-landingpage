'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const geoUrl = 'https://code.highcharts.com/mapdata/countries/id/id-all.topo.json';

// Normalize province names to match between topojson and our database (pekerja.domisili)
const normalizeProvinceName = (name: string) => {
  if (!name) return '';
  return name.toLowerCase()
    .replace('d.k.i. ', 'dki ')
    .replace('d.i. ', 'di ')
    .replace('kepulauan ', 'kep. ')
    .trim();
};

interface IndonesiaMapProps {
  data: Record<string, number>;
}

export default function IndonesiaMap({ data }: IndonesiaMapProps) {
  const [tooltipContent, setTooltipContent] = useState('');
  const [pinnedContent, setPinnedContent] = useState('');
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch topology data only once
  useEffect(() => {
    fetch(geoUrl)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch map data');
        return res.json();
      })
      .then(topology => {
        setGeoData(topology);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching map data:', error);
        setLoading(false);
      });
  }, []);

  // Compute max cases for color scale
  const maxCases = useMemo(() => {
    const values = Object.values(data);
    return values.length > 0 ? Math.max(...values) : 1;
  }, [data]);

  // Color scale from light blue to dark blue based on number of cases
  const colorScale = scaleLinear<string>()
    .domain([0, maxCases])
    .range(['#e0f2fe', '#0369a1']); // Tailwind sky-100 to sky-700

  if (loading) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-100">
        <Loader2 className="h-8 w-8 text-[#0284c7] animate-spin mb-2" />
        <p className="text-xs font-bold text-slate-400 animate-pulse">Memuat Peta Indonesia...</p>
      </div>
    );
  }

  if (!geoData) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100">
        <p className="text-sm font-medium text-slate-400">Gagal memuat data peta.</p>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-[400px] sm:h-[500px] bg-[#f8fafc] rounded-2xl border border-slate-100 overflow-hidden shadow-sm group"
      onClick={(e) => {
        // If they click on the map background (not a geography path), clear pinned content
        if ((e.target as HTMLElement).tagName !== 'path') {
          setPinnedContent('');
        }
      }}
    >
      
      {/* Map Content */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 1200,
          center: [118, -2] // Center of Indonesia
        }}
        className="w-full h-full"
      >
        <ZoomableGroup zoom={1} maxZoom={4}>
          <Geographies geography={geoData}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => {
                const provName = geo.properties.name || geo.properties.Propinsi || '';
                const normalizedProv = normalizeProvinceName(provName);
                
                // Find matching data. Database keys are already lowercase.
                // We do a loose match to handle variations.
                const dbKeys = Object.keys(data);
                const matchedKey = dbKeys.find(k => 
                  k.includes(normalizedProv) || normalizedProv.includes(k)
                );
                
                const caseCount = matchedKey ? data[matchedKey] : 0;
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => {
                      setTooltipContent(`${provName}: ${caseCount} Kasus`);
                    }}
                    onMouseLeave={() => {
                      setTooltipContent('');
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Toggle pin if already pinned to this province, otherwise pin it
                      const content = `${provName}: ${caseCount} Kasus`;
                      if (pinnedContent === content) {
                        setPinnedContent('');
                      } else {
                        setPinnedContent(content);
                      }
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      const content = `${provName}: ${caseCount} Kasus`;
                      setPinnedContent(content);
                    }}
                    style={{
                      default: {
                        fill: caseCount > 0 ? colorScale(caseCount) : '#f1f5f9', // slate-100 if no data
                        stroke: '#cbd5e1', // slate-300
                        strokeWidth: 0.5,
                        outline: 'none',
                        transition: 'all 250ms'
                      },
                      hover: {
                        fill: '#0284c7', // sky-600 on hover
                        stroke: '#0c4a6e',
                        strokeWidth: 1,
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'all 250ms'
                      },
                      pressed: {
                        fill: '#0369a1',
                        outline: 'none',
                      }
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip Overlay */}
      {(pinnedContent || tooltipContent) && (
        <div className={cn(
          "absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl shadow-lg border border-slate-700/50 flex items-center gap-2 pointer-events-none animate-in fade-in zoom-in-95 duration-200",
          pinnedContent ? "ring-2 ring-sky-400/50" : ""
        )}>
           <MapPin className="h-4 w-4 text-sky-400" />
           <span className="text-sm font-bold tracking-wide">{pinnedContent || tooltipContent}</span>
           {pinnedContent && (
             <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded ml-1 text-slate-300">Terkunci</span>
           )}
        </div>
      )}

      {/* Legend / Overlay Text */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-1.5 pointer-events-none">
         <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Intensitas Kasus</p>
         <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500">0</span>
            <div className="h-2 w-24 bg-gradient-to-r from-[#f1f5f9] via-[#e0f2fe] to-[#0369a1] rounded-full" />
            <span className="text-[10px] font-bold text-slate-500">{maxCases > 0 ? maxCases : 'Max'}</span>
         </div>
      </div>
    </div>
  );
}
