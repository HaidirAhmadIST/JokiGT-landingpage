'use client';

import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import Map, { Source, Layer, MapMouseEvent, Popup, MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapTooltip, { getDetailedProvinceData } from './MapTooltip';
import mockProvincesData from '@/data/mock-provinces.json';
import { Landmark, ChevronDown, ChevronRight, MapPin, BarChart3, TrendingUp, Activity, X } from 'lucide-react';
import api from '@/lib/axios';

// Minimalist light-gray/off-white background style
const MAP_STYLE = {
  version: 8 as const,
  sources: {},
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  layers: [
    {
      id: 'background',
      type: 'background' as const,
      paint: { 'background-color': '#f8fafc' }
    }
  ]
};

interface RiskMapProps {
  onProvinceClick: (provinceId: string, properties: any) => void;
  lockedProvinceName: string | null;
}

// Custom offsets/placements for each province to make them look absolutely neat and well-aligned
const CUSTOM_PROVINCE_CENTROIDS: Record<string, [number, number]> = {
  'Di. Aceh': [97.0, 4.2],
  'Sumatera Utara': [99.0, 2.2],
  'Riau': [101.8, 0.5],
  'Kep. Bangka Belitung': [106.0, -2.7],
  'DKI Jakarta': [106.8456, -6.2088],
  'Jawa Barat': [107.6, -6.9],
  'Banten': [106.15, -6.4],
  'DI Yogyakarta': [110.39, -7.95],
  'Jawa Tengah': [110.1, -7.2],
  'Jawa Timur': [112.5, -7.5],
  'Bali': [115.1, -8.3],
  'Nusatenggara Barat': [117.4, -8.6],
  'Nusa Tenggara Timur': [121.5, -8.6],
  'Sulawesi Tenggara': [122.2, -4.2],
  'Sulawesi Selatan': [120.1, -4.0],
  'Sulawesi Tengah': [121.2, -1.6],
  'Sulawesi Utara': [124.7, 1.2],
  'Gorontalo': [122.5, 0.7],
  'Maluku': [129.5, -3.2],
  'Maluku Utara': [127.8, 1.0],
  'Irian Jaya Barat': [132.5, -2.0],
  'Irian Jaya Tengah': [137.0, -4.0],
  'Irian Jaya Timur': [139.5, -5.0],
};

interface CentroidMapItem {
  name: string;
  pointsCount: number;
  avgLng: number;
  avgLat: number;
}

const provinceLineLayer = {
  id: 'province-line',
  type: 'line' as const,
  source: 'provinces',
  paint: {
    'line-color': '#cbd5e1',
    'line-width': 0.8
  }
};

const provinceLabelLayer = {
  id: 'province-label',
  type: 'symbol' as const,
  source: 'province-labels',
  layout: {
    'text-field': ['get', 'province_name'],
    'text-size': [
      'interpolate', ['linear'], ['zoom'],
      3, 8, 4, 10, 5, 12, 8, 16
    ],
    'text-font': ['Open Sans Semibold', 'Open Sans Regular'],
    'text-anchor': 'center',
    'text-max-width': 8,
    'text-justify': 'center',
    'text-allow-overlap': false
  },
  paint: {
    'text-color': '#64748b',
    'text-halo-color': '#ffffff',
    'text-halo-width': 1.5,
    'text-opacity': [
      'interpolate', ['linear'], ['zoom'],
      3.0, 0.0, 3.5, 0.8, 8.0, 1.0
    ]
  }
};

export const RiskMap: React.FC<RiskMapProps> = ({ onProvinceClick, lockedProvinceName }) => {
  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const [cursor, setCursor] = useState<string>('auto');
  const [mapViewport, setMapViewport] = useState<any>({ width: 0, height: 0 });
  const mapRef = useRef<MapRef>(null);

  // Which kabupaten/kota index is expanded in the accordion
  const [expandedRegencyIdx, setExpandedRegencyIdx] = useState<number | null>(null);
  // Which kecamatan is selected inside the expanded regency
  const [selectedDistrictIdx, setSelectedDistrictIdx] = useState<number | null>(null);

  const [dbStats, setDbStats] = useState<any>(null);

  useEffect(() => {
    // Fetch live map stats from database
    api.get('/map-stats')
      .then(res => setDbStats(res.data.data))
      .catch(console.error);
  }, []);

  const onHover = useCallback((event: MapMouseEvent) => {
    const { features, point: { x, y } } = event;
    const hoveredFeature = features && features[0];
    if (hoveredFeature) {
      setHoverInfo({ feature: hoveredFeature, x, y });
      setCursor('pointer');
    } else {
      setHoverInfo(null);
      setCursor('auto');
    }
  }, []);

  const onClick = useCallback((event: MapMouseEvent) => {
    const feature = event.features && event.features[0];
    if (feature && feature.properties) {
      onProvinceClick(feature.properties.province_id, feature.properties);
      // Reset accordion state when switching province
      setExpandedRegencyIdx(null);
      setSelectedDistrictIdx(null);
    }
  }, [onProvinceClick]);

  const mapData = useMemo(() => mockProvincesData, []);

  // Generate deduplicated centroid label dataset
  const labelsData = useMemo(() => {
    const provincesMap: Record<string, CentroidMapItem> = {};

    mapData.features.forEach((feature: any) => {
      const name = feature.properties?.province_name;
      if (!name) return;

      let largestRing: [number, number][] = [];
      let maxPoints = 0;

      const processPolygon = (polygonCoords: any) => {
        const outerRing = polygonCoords[0];
        if (outerRing && outerRing.length > maxPoints) {
          maxPoints = outerRing.length;
          largestRing = outerRing;
        }
      };

      if (feature.geometry.type === 'Polygon') {
        processPolygon(feature.geometry.coordinates);
      } else if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach((polygonCoords: any) => {
          processPolygon(polygonCoords);
        });
      }

      if (largestRing.length > 0) {
        let sumLng = 0, sumLat = 0;
        largestRing.forEach((coord: any) => { sumLng += coord[0]; sumLat += coord[1]; });
        const avgLng = sumLng / largestRing.length;
        const avgLat = sumLat / largestRing.length;
        const existing = provincesMap[name];
        if (!existing || maxPoints > existing.pointsCount) {
          provincesMap[name] = { name, pointsCount: maxPoints, avgLng, avgLat };
        }
      }
    });

    const features = Object.values(provincesMap).map((item) => {
      let coords: [number, number] = [item.avgLng, item.avgLat];
      if (CUSTOM_PROVINCE_CENTROIDS[item.name]) coords = CUSTOM_PROVINCE_CENTROIDS[item.name];
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: coords },
        properties: { province_name: item.name }
      };
    });

    return { type: 'FeatureCollection' as const, features };
  }, [mapData]);

  // Centroid of the locked province
  const lockedCentroid = useMemo(() => {
    if (!lockedProvinceName) return null;
    const feat = labelsData.features.find(
      (f) => f.properties.province_name === lockedProvinceName
    );
    if (feat) {
      return {
        longitude: feat.geometry.coordinates[0],
        latitude: feat.geometry.coordinates[1],
      };
    }
    return null;
  }, [lockedProvinceName, labelsData]);

  // Smoothly center the map on the selected province's centroid with a vertical offset
  useEffect(() => {
    if (lockedCentroid && mapRef.current) {
      // Perbaikan: Kurangi pergerakan drastis. Hanya geser sedikit dengan durasi lebih lambat
      // agar tidak memusingkan pengguna, dan pertahankan zoom yang tidak terlalu dekat.
      mapRef.current.easeTo({
        center: [lockedCentroid.longitude, lockedCentroid.latitude + 0.5],
        zoom: 4.3,
        duration: 1200,
      });
    } else if (!lockedProvinceName && mapRef.current) {
      // Return to original view when province selection is cleared smoothly
      mapRef.current.easeTo({
        center: [118.0, -2.5],
        zoom: 4,
        duration: 1200,
      });
    }
  }, [lockedCentroid, lockedProvinceName]);

  // Dynamic fill — locked = sky-300, hovered = sky-200, base = slate-100
  const dynamicRiskFillLayer = useMemo(() => ({
    id: 'province-fill',
    type: 'fill' as const,
    source: 'provinces',
    paint: {
      'fill-color': [
        'case',
        ['==', ['get', 'province_name'], lockedProvinceName || ''], '#7dd3fc',
        ['==', ['get', 'province_name'], hoverInfo?.feature?.properties?.province_name || ''], '#bae6fd',
        '#f1f5f9'
      ],
      'fill-opacity': 1.0
    }
  }), [hoverInfo, lockedProvinceName]);

  return (
    <div className="relative h-full w-full bg-slate-50 overflow-hidden" ref={(el) => {
      if (el) {
        setMapViewport((prev: any) => {
          if (prev.width === el.clientWidth && prev.height === el.clientHeight) {
            return prev;
          }
          return { width: el.clientWidth, height: el.clientHeight };
        });
      }
    }}>
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        initialViewState={{ longitude: 118.0, latitude: -2.5, zoom: 4 }}
        mapStyle={MAP_STYLE}
        interactiveLayerIds={['province-fill']}
        onMouseMove={onHover}
        onClick={onClick}
        onMouseLeave={() => { setHoverInfo(null); setCursor('auto'); }}
        cursor={cursor}
        style={{ width: '100%', height: '100%' }}
        maxBounds={[[90, -15], [145, 10]]}
      >
        {/* Province fill + border layers */}
        <Source id="provinces" type="geojson" data={mapData as any}>
          <Layer {...dynamicRiskFillLayer as any} />
          <Layer {...provinceLineLayer as any} />
        </Source>

        {/* Province name label layer */}
        <Source id="province-labels" type="geojson" data={labelsData as any}>
          <Layer {...provinceLabelLayer as any} />
        </Source>

      </Map>

      {/* ── Centered overlay for the locked province ── */}
      {lockedProvinceName && (() => {
        const data = getDetailedProvinceData(lockedProvinceName, dbStats);
        
        // Pre-compute stats for the redesigned card
        const maxRegencyReports = Math.max(...data.regencies.map(r => r.reports), 1);
        const sortedRegencies = [...data.regencies].sort((a, b) => b.reports - a.reports);
        const totalDistricts = data.regencies.reduce((s, r) => s + r.districts.length, 0);
        
        // Color palette for heat bars based on percentage AND absolute values
        // Perbaikan: Mencegah warna Kritis (Merah) jika total kasus wilayahnya sangat kecil (misal di bawah 20 kasus)
        const getHeatColor = (pct: number, absoluteValue: number) => {
          if (pct >= 80 && absoluteValue >= 20) return { bg: 'bg-rose-500', text: 'text-rose-700', light: 'bg-rose-50', border: 'border-rose-200' };
          if (pct >= 60 && absoluteValue >= 10) return { bg: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-50', border: 'border-amber-200' };
          if (pct >= 40 || absoluteValue >= 5) return { bg: 'bg-sky-500', text: 'text-sky-700', light: 'bg-sky-50', border: 'border-sky-200' };
          return { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50', border: 'border-emerald-200' };
        };
        const getRankBadge = (idx: number) => {
          if (idx === 0) return { emoji: '🥇', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' };
          if (idx === 1) return { emoji: '🥈', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600' };
          if (idx === 2) return { emoji: '🥉', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' };
          return null;
        };

        return (
          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none p-4 backdrop-blur-sm bg-slate-900/10 transition-all duration-300">
            <div className="flex w-full max-w-[380px] flex-col bg-white rounded-2xl shadow-2xl pointer-events-auto border border-slate-200 p-4 relative" style={{ fontFamily: 'inherit' }}>
              
              {/* Close Button */}
              <button 
                onClick={() => {
                  onProvinceClick('', { province_name: lockedProvinceName });
                  setExpandedRegencyIdx(null);
                  setSelectedDistrictIdx(null);
                }}
                className="absolute -top-3 -right-3 z-50 p-1.5 bg-white border border-slate-200 shadow-md text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-colors"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>

                    {/* ── Gradient Header ── */}
                    <div className="relative overflow-hidden rounded-xl p-4 mb-3" style={{
                      background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #7c3aed 100%)'
                    }}>
                      {/* Decorative circles */}
                      <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-white/10" />
                      <div className="absolute -bottom-4 -left-4 h-14 w-14 rounded-full bg-white/5" />
                      <div className="absolute top-2 right-16 h-6 w-6 rounded-full bg-white/10" />
                      
                      <div className="relative z-10 flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.15em] text-white/70">
                            <MapPin className="h-3 w-3" /> Provinsi
                          </div>
                          <h3 className="text-[15px] font-black text-white leading-snug tracking-tight">
                            {data.provinceName}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-white/90 bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full">
                              <Landmark className="h-2.5 w-2.5" /> {data.regencies.length} Kab/Kota
                            </span>
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-white/90 bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full">
                              <MapPin className="h-2.5 w-2.5" /> {totalDistricts} Kecamatan
                            </span>
                          </div>
                        </div>

                        {/* Circular stat ring */}
                        <div className="shrink-0 flex flex-col items-center">
                          <div className="relative h-[58px] w-[58px]">
                            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                              <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                              <circle cx="18" cy="18" r="15.5" fill="none" stroke="white" strokeWidth="3"
                                strokeDasharray={`${Math.min((data.totalReports / 300) * 97.5, 97.5)} 97.5`}
                                strokeLinecap="round"
                                className="drop-shadow-sm"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-[14px] font-black text-white leading-none tabular-nums">
                                {data.totalReports}
                              </span>
                            </div>
                          </div>
                          <span className="text-[8px] font-bold text-white/60 uppercase tracking-wider mt-0.5">Kasus</span>
                        </div>
                      </div>
                    </div>

                    {/* ── Summary stat cards ── */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="flex flex-col items-center py-2 px-1 rounded-xl bg-gradient-to-b from-sky-50 to-white border border-sky-100/60">
                        <Activity className="h-3.5 w-3.5 text-sky-500 mb-1" />
                        <span className="text-[13px] font-black text-slate-800 tabular-nums leading-none">{data.totalReports}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total</span>
                      </div>
                      <div className="flex flex-col items-center py-2 px-1 rounded-xl bg-gradient-to-b from-violet-50 to-white border border-violet-100/60">
                        <Landmark className="h-3.5 w-3.5 text-violet-500 mb-1" />
                        <span className="text-[13px] font-black text-slate-800 tabular-nums leading-none">{data.regencies.length}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Kab/Kota</span>
                      </div>
                      <div className="flex flex-col items-center py-2 px-1 rounded-xl bg-gradient-to-b from-emerald-50 to-white border border-emerald-100/60">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500 mb-1" />
                        <span className="text-[13px] font-black text-slate-800 tabular-nums leading-none">
                          {Math.round(data.totalReports / data.regencies.length)}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Rata-rata</span>
                      </div>
                    </div>

                    {/* ── Section label with divider ── */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 shrink-0 flex items-center gap-1">
                        <BarChart3 className="h-3 w-3 text-slate-400" /> Sebaran per Kabupaten / Kota
                      </span>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                    </div>

                    {/* ── Accordion list ── */}
                    <div className="flex flex-col gap-1.5 max-h-[270px] overflow-y-auto pr-0.5" style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#cbd5e1 transparent'
                    }}>
                      {sortedRegencies.map((regency, rIdx) => {
                        const origIdx = data.regencies.indexOf(regency);
                        const isExpanded = expandedRegencyIdx === origIdx;
                        const pct = (regency.reports / maxRegencyReports) * 100;
                        const heat = getHeatColor(pct, regency.reports);
                        const rank = getRankBadge(rIdx);
                        const maxDistrictReports = Math.max(...regency.districts.map(d => d.reports), 1);

                        return (
                          <div key={origIdx} className={`shrink-0 rounded-xl border overflow-hidden transition-all duration-200 ${
                            isExpanded ? 'border-sky-200 shadow-md shadow-sky-100/50' : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'
                          }`}>

                            {/* Kabupaten/Kota clickable header row */}
                            <button
                              onClick={() => {
                                setExpandedRegencyIdx(isExpanded ? null : origIdx);
                                setSelectedDistrictIdx(null);
                              }}
                              className={`w-full flex flex-col gap-1.5 px-3 py-2.5 text-left transition-all duration-200 ${
                                isExpanded
                                  ? 'bg-gradient-to-r from-sky-50 via-sky-50/80 to-blue-50/60'
                                  : 'bg-white hover:bg-slate-50/80'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2 min-w-0">
                                  {isExpanded
                                    ? <ChevronDown className="h-3.5 w-3.5 text-sky-500 shrink-0 transition-transform" />
                                    : <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform" />
                                  }
                                  {rank && (
                                    <span className="text-[11px] shrink-0">{rank.emoji}</span>
                                  )}
                                  <Landmark className={`h-3 w-3 shrink-0 ${isExpanded ? 'text-sky-500' : 'text-slate-400'}`} />
                                  <span className={`text-[11px] font-bold truncate ${isExpanded ? 'text-sky-700' : 'text-slate-700'}`}>
                                    {regency.name}
                                  </span>
                                </div>
                                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border shrink-0 ml-2 tabular-nums ${
                                  isExpanded
                                    ? 'bg-sky-100 text-sky-700 border-sky-200'
                                    : `${heat.light} ${heat.text} ${heat.border}`
                                }`}>
                                  {regency.reports} <span className="font-semibold opacity-70">kasus</span>
                                </span>
                              </div>
                              {/* Proportional bar */}
                              <div className="w-full flex items-center gap-2 pl-5">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${isExpanded ? 'bg-gradient-to-r from-sky-400 to-blue-500' : `${heat.bg}`}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 tabular-nums shrink-0 w-7 text-right">
                                  {Math.round(pct)}%
                                </span>
                              </div>
                            </button>

                            {/* ── Kecamatan sub-list (expanded) ── */}
                            {isExpanded && (
                              <div className="flex flex-col bg-white">

                                {/* Column headers */}
                                <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-slate-50 to-sky-50/30 border-y border-slate-100">
                                  <span className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400 flex items-center gap-1.5">
                                    <MapPin className="h-3 w-3 text-sky-400" /> Kecamatan
                                  </span>
                                  <span className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                                    Laporan
                                  </span>
                                </div>

                                {/* Each kecamatan as a clickable row with heat bar */}
                                {[...regency.districts].sort((a, b) => b.reports - a.reports).map((district, dIdx) => {
                                  const origDIdx = regency.districts.indexOf(district);
                                  const isSel = selectedDistrictIdx === origDIdx;
                                  const distPct = (district.reports / maxDistrictReports) * 100;
                                  const distHeat = getHeatColor(distPct, district.reports);
                                  return (
                                    <button
                                      key={origDIdx}
                                      onClick={() => setSelectedDistrictIdx(isSel ? null : origDIdx)}
                                      className={`w-full flex flex-col gap-1 px-4 py-2 text-left transition-all duration-150 border-b border-slate-50/80 last:border-b-0 ${
                                        isSel ? 'bg-sky-50/80' : 'hover:bg-slate-50/60'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                          <div className={`h-2 w-2 rounded-full shrink-0 transition-colors ${
                                            isSel ? 'bg-sky-500 ring-2 ring-sky-200' : distHeat.bg
                                          }`} />
                                          <span className={`text-[11px] font-semibold ${isSel ? 'text-sky-700' : 'text-slate-600'}`}>
                                            {district.name}
                                          </span>
                                          {dIdx === 0 && (
                                            <span className="text-[8px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100">
                                              Tertinggi
                                            </span>
                                          )}
                                        </div>
                                        <span className={`text-[12px] font-black tabular-nums ${isSel ? 'text-sky-700' : 'text-slate-700'}`}>
                                          {district.reports}
                                        </span>
                                      </div>
                                      {/* Mini heat bar */}
                                      <div className="w-full pl-4">
                                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full rounded-full transition-all duration-500 ${isSel ? 'bg-sky-400' : distHeat.bg} opacity-60`}
                                            style={{ width: `${distPct}%` }}
                                          />
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}

                                {/* Total row for this regency */}
                                <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-sky-50 to-blue-50/80 border-t border-sky-100">
                                  <span className="text-[9px] font-black uppercase tracking-[0.12em] text-sky-600 flex items-center gap-1.5">
                                    <Activity className="h-3 w-3" /> Total Kecamatan
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-sky-500">{regency.districts.length} wilayah</span>
                                    <span className="text-[12px] font-black text-sky-700 tabular-nums bg-sky-100 px-2 py-0.5 rounded-md">
                                      {regency.reports}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* ── Footer hint ── */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-center gap-2">
                      <div className="flex items-center gap-1.5 text-[9px] font-medium text-slate-400">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span> Rendah
                        <span className="inline-block h-2 w-2 rounded-full bg-sky-400 ml-1"></span> Sedang
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-400 ml-1"></span> Tinggi
                        <span className="inline-block h-2 w-2 rounded-full bg-rose-400 ml-1"></span> Kritis
                      </div>
                    </div>
                    <div className="pb-0.5 pt-1.5 text-center">
                      <span className="text-[9px] font-medium text-slate-400/80 flex items-center justify-center gap-1">
                        👆 Klik kabupaten/kota untuk detail kecamatan
                      </span>
                    </div>
            </div>
          </div>
        );
      })()}

      {/* Hover tooltip — hidden when hovering over the locked province */}
      {hoverInfo && hoverInfo.feature?.properties?.province_name !== lockedProvinceName && (
        <MapTooltip
          x={hoverInfo.x}
          y={hoverInfo.y}
          feature={hoverInfo.feature}
          dbStats={dbStats}
        />
      )}
    </div>
  );
};
