import React from 'react';

interface TooltipProps {
  x: number;
  y: number;
  feature: {
    properties: {
      province_name: string;
      risk_level: string;
    };
  } | null;
}

export const MapTooltip: React.FC<TooltipProps> = ({ x, y, feature }) => {
  if (!feature) return null;

  const { province_name, risk_level } = feature.properties;

  return (
    <div
      className="pointer-events-none absolute z-50 flex flex-col gap-1 rounded-lg bg-white/90 px-3 py-2 text-sm shadow-lg backdrop-blur-sm"
      style={{
        left: x + 15, // Offset slightly so cursor doesn't cover tooltip
        top: y + 15,
      }}
    >
      <span className="font-bold text-slate-800">{province_name}</span>
      <span className="flex items-center gap-2">
        <span className="text-slate-500">Tingkat Risiko:</span>
        <span className="font-semibold text-slate-700">{risk_level}</span>
      </span>
    </div>
  );
};
