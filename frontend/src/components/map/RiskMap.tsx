'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import Map, { Source, Layer, MapMouseEvent, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapTooltip } from './MapTooltip';
import mockProvincesData from '@/data/mock-provinces.json';

// Using a blank white background style to mimic the GIS reference image
const MAP_STYLE = {
  version: 8 as const,
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background' as const,
      paint: { 'background-color': '#ffffff' }
    }
  ]
};

interface RiskMapProps {
  onProvinceClick: (provinceId: string, properties: any) => void;
}

const riskFillLayer = {
  id: 'province-fill',
  type: 'fill' as const,
  source: 'provinces',
  paint: {
    'fill-color': [
      'match',
      ['get', 'risk_level'],
      'Very High', '#e31a1c',
      'High', '#fd8d3c',
      'Medium', '#ffffb2',
      'Low', '#41b6c4',
      'Very Low', '#74c476',
      /* other */ '#cccccc'
    ],
    'fill-opacity': [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      0.9,
      0.6
    ]
  }
};

const provinceLineLayer = {
  id: 'province-line',
  type: 'line' as const,
  source: 'provinces',
  paint: {
    'line-color': '#000000',
    'line-width': 0.5
  }
};

export const RiskMap: React.FC<RiskMapProps> = ({ onProvinceClick }) => {
  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const [cursor, setCursor] = useState<string>('auto');

  const onHover = useCallback((event: MapMouseEvent) => {
    const {
      features,
      point: { x, y }
    } = event;
    
    const hoveredFeature = features && features[0];

    // Note: To use feature-state for dynamic styling (like hover opacity), 
    // the GeoJSON features MUST have unique 'id' properties at the top level.
    // Our mock geojson currently doesn't have top-level IDs, so the opacity change won't work perfectly
    // without data manipulation, but the tooltip will.

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
    }
  }, [onProvinceClick]);

  const mapData = useMemo(() => mockProvincesData, []);

  // No token warning needed for MapLibre
  useEffect(() => {}, []);

  return (
    <div className="flex h-full w-full bg-white p-2 sm:p-6 gap-2 sm:gap-4 flex-col lg:flex-row">
      
      {/* ─── LEFT: MAP CONTAINER WITH GIS BORDERS ─── */}
      <div className="relative flex-1 border-[3px] border-black bg-white flex flex-col">
        {/* Top Coordinate Ticks (Decorative) */}
        <div className="absolute top-0 left-0 w-full h-0 z-10 flex justify-around pointer-events-none">
          <div className="relative h-2 border-l border-black -top-2">
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0.5 text-[8px] sm:text-[10px] font-bold">100°0'0"E</span>
          </div>
          <div className="relative h-2 border-l border-black -top-2">
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0.5 text-[8px] sm:text-[10px] font-bold">110°0'0"E</span>
          </div>
          <div className="relative h-2 border-l border-black -top-2">
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0.5 text-[8px] sm:text-[10px] font-bold">120°0'0"E</span>
          </div>
          <div className="relative h-2 border-l border-black -top-2">
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0.5 text-[8px] sm:text-[10px] font-bold">130°0'0"E</span>
          </div>
        </div>

        {/* Left Coordinate Ticks (Decorative) */}
        <div className="absolute top-0 left-0 h-full w-0 z-10 flex flex-col justify-around pointer-events-none">
          <div className="relative w-2 border-t border-black -left-2">
            <span className="absolute right-full top-1/2 -translate-y-1/2 mr-0.5 text-[8px] sm:text-[10px] font-bold -rotate-90 origin-right whitespace-nowrap">10°0'0"N</span>
          </div>
          <div className="relative w-2 border-t border-black -left-2">
            <span className="absolute right-full top-1/2 -translate-y-1/2 mr-0.5 text-[8px] sm:text-[10px] font-bold -rotate-90 origin-right whitespace-nowrap">0°0'0"</span>
          </div>
          <div className="relative w-2 border-t border-black -left-2">
            <span className="absolute right-full top-1/2 -translate-y-1/2 mr-0.5 text-[8px] sm:text-[10px] font-bold -rotate-90 origin-right whitespace-nowrap">10°0'0"S</span>
          </div>
        </div>

        {/* Bottom Coordinate Ticks (Decorative) */}
        <div className="absolute bottom-0 left-0 w-full h-0 z-10 flex justify-around pointer-events-none">
          <div className="relative h-2 border-l border-black top-0">
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 text-[8px] sm:text-[10px] font-bold">100°0'0"E</span>
          </div>
          <div className="relative h-2 border-l border-black top-0">
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 text-[8px] sm:text-[10px] font-bold">110°0'0"E</span>
          </div>
          <div className="relative h-2 border-l border-black top-0">
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 text-[8px] sm:text-[10px] font-bold">120°0'0"E</span>
          </div>
          <div className="relative h-2 border-l border-black top-0">
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 text-[8px] sm:text-[10px] font-bold">130°0'0"E</span>
          </div>
        </div>

        {/* Right Coordinate Ticks (Decorative) */}
        <div className="absolute top-0 right-0 h-full w-0 z-10 flex flex-col justify-around pointer-events-none">
          <div className="relative w-2 border-t border-black top-0">
            <span className="absolute left-full top-1/2 -translate-y-1/2 ml-0.5 text-[8px] sm:text-[10px] font-bold -rotate-90 origin-left whitespace-nowrap">10°0'0"N</span>
          </div>
          <div className="relative w-2 border-t border-black top-0">
            <span className="absolute left-full top-1/2 -translate-y-1/2 ml-0.5 text-[8px] sm:text-[10px] font-bold -rotate-90 origin-left whitespace-nowrap">0°0'0"</span>
          </div>
          <div className="relative w-2 border-t border-black top-0">
            <span className="absolute left-full top-1/2 -translate-y-1/2 ml-0.5 text-[8px] sm:text-[10px] font-bold -rotate-90 origin-left whitespace-nowrap">10°0'0"S</span>
          </div>
        </div>

        {/* Inner Map Box (Slightly padded to simulate inner boundary) */}
        <div className="flex-1 relative m-0.5 border border-black">
          <Map
            initialViewState={{
              longitude: 118.0, 
              latitude: -2.5,
              zoom: 4 
            }}
            mapStyle={MAP_STYLE}
            interactiveLayerIds={['province-fill']}
            onMouseMove={onHover}
            onClick={onClick}
            onMouseLeave={() => {
              setHoverInfo(null);
              setCursor('auto');
            }}
            cursor={cursor}
            style={{ width: '100%', height: '100%' }}
            // Restrict panning too far outside Indonesia to keep the coordinate illusion somewhat intact
            maxBounds={[
              [90, -15], // Southwest coordinates
              [145, 10]  // Northeast coordinates
            ]}
          >
            {/* Grid/Graticule lines overlay directly on the map */}
            <Source id="grid" type="geojson" data={{
              type: "FeatureCollection",
              features: [
                // Vertical lines (Longitudes)
                { type: "Feature", geometry: { type: "LineString", coordinates: [[100, -15], [100, 10]] }, properties: {} },
                { type: "Feature", geometry: { type: "LineString", coordinates: [[110, -15], [110, 10]] }, properties: {} },
                { type: "Feature", geometry: { type: "LineString", coordinates: [[120, -15], [120, 10]] }, properties: {} },
                { type: "Feature", geometry: { type: "LineString", coordinates: [[130, -15], [130, 10]] }, properties: {} },
                { type: "Feature", geometry: { type: "LineString", coordinates: [[140, -15], [140, 10]] }, properties: {} },
                // Horizontal lines (Latitudes)
                { type: "Feature", geometry: { type: "LineString", coordinates: [[90, 10], [145, 10]] }, properties: {} },
                { type: "Feature", geometry: { type: "LineString", coordinates: [[90, 0], [145, 0]] }, properties: {} },
                { type: "Feature", geometry: { type: "LineString", coordinates: [[90, -10], [145, -10]] }, properties: {} }
              ]
            }}>
              <Layer id="grid-line" type="line" paint={{ "line-color": "#a1a1aa", "line-width": 0.5 }} />
            </Source>

            <Source id="provinces" type="geojson" data={mapData as any}>
              <Layer {...riskFillLayer as any} />
              <Layer {...provinceLineLayer as any} />
            </Source>
          </Map>

          <MapTooltip 
            x={hoverInfo?.x} 
            y={hoverInfo?.y} 
            feature={hoverInfo?.feature} 
          />
        </div>
      </div>

      {/* ─── RIGHT: GIS INFORMATION & LEGEND PANEL ─── */}
      <div className="w-full lg:w-[320px] shrink-0 border-[3px] border-black bg-white flex flex-col overflow-y-auto">
        {/* Header Box */}
        <div className="p-3 border-b-[3px] border-black flex items-center justify-center">
          <h2 className="text-center font-black text-sm uppercase leading-snug tracking-wide text-black">
            MAP OF ASBESTOS EXPOSURE RISK<br/>BASED ON ASBESTOS ROOF USAGE<br/>LEVELS IN INDONESIA
          </h2>
        </div>

        {/* Info Box */}
        <div className="p-3 border-b-[3px] border-black text-center space-y-3">
          <p className="font-bold text-xs leading-relaxed text-black">
            The Risk of Asbestos Exposure<br/>Based on Asbestos Roof Usage<br/>Levels
          </p>
          <div className="text-xs text-black space-y-3 font-bold">
            <p>
              Very High Risk Provinces:<br/>
              Bangka Belitung Islands, Riau<br/>Island, DKI Jakarta, Banten
            </p>
            <p>
              High Risk Provinces:<br/>
              Lampung, West Java
            </p>
          </div>
        </div>

        {/* Legend Box */}
        <div className="p-3 border-b-[3px] border-black flex-1">
          <h4 className="font-black text-sm text-black mb-3 text-center">
            The Risk levels :
          </h4>
          <div className="flex flex-col gap-2 max-w-[200px] mx-auto">
            <div className="flex items-center gap-4">
              <div className="w-10 h-5 bg-[#e31a1c] border-[1.5px] border-black" />
              <span className="text-xs font-bold text-black">Very High</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-5 bg-[#fd8d3c] border-[1.5px] border-black" />
              <span className="text-xs font-bold text-black">High</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-5 bg-[#ffffb2] border-[1.5px] border-black" />
              <span className="text-xs font-bold text-black">Medium</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-5 bg-[#41b6c4] border-[1.5px] border-black" />
              <span className="text-xs font-bold text-black">Low</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-5 bg-[#74c476] border-[1.5px] border-black" />
              <span className="text-xs font-bold text-black">Very Low</span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="w-10 h-[3px] bg-black" />
              <span className="text-[10px] font-bold text-black uppercase">Province Boundary</span>
            </div>
          </div>
        </div>

        {/* Compass / Scale Box (Static UI matching the image) */}
        <div className="p-2 flex flex-col items-center justify-center relative bg-white pb-4">
          <div className="mb-2">
            {/* Simple static compass graphic */}
            <svg width="40" height="40" viewBox="0 0 100 100" className="mx-auto">
              <path d="M50 0 L60 50 L50 100 L40 50 Z" fill="#333" />
              <path d="M50 0 L50 100 L40 50 Z" fill="#999" />
              <text x="45" y="-5" fontSize="20" fill="black" transform="translate(0, 10)">N</text>
              <text x="45" y="110" fontSize="20" fill="black">S</text>
              <text x="-15" y="55" fontSize="20" fill="black">W</text>
              <text x="105" y="55" fontSize="20" fill="black">E</text>
            </svg>
          </div>
          <div className="text-center font-bold text-black mt-2">
            <div className="text-xs">Scale</div>
            <div className="text-xs mb-1">1:25.000.000</div>
          </div>
        </div>
      </div>

    </div>
  );
};
