"use client";

import React from "react";
import { AlertCircle, Clock } from "lucide-react";

export function PriorityAlert() {
  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-5 border border-red-100 shadow-sm mb-6">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-red-100 rounded-lg text-red-600 mt-0.5">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-red-900 leading-tight">Kasus Prioritas Tinggi</h3>
          <p className="text-sm text-red-700/80 mt-1">2 Kasus mendekati tenggat waktu advokasi BPJS.</p>
        </div>
      </div>
      
      <div className="space-y-3 mt-4">
        <div className="bg-white/60 rounded-lg p-3 border border-red-100/50 flex items-center justify-between text-sm">
          <div>
            <p className="font-medium text-gray-800">PAK-089 (Bpk. Joko)</p>
            <p className="text-xs text-gray-500">Tenggat: 2 Hari Lagi</p>
          </div>
          <button className="text-red-600 hover:text-red-700 font-medium text-xs px-2 py-1 bg-red-50 hover:bg-red-100 rounded transition-colors">
            Tinjau
          </button>
        </div>
        <div className="bg-white/60 rounded-lg p-3 border border-red-100/50 flex items-center justify-between text-sm">
          <div>
            <p className="font-medium text-gray-800">PAK-102 (Ibu Sari)</p>
            <p className="text-xs text-gray-500">Tenggat: 3 Hari Lagi</p>
          </div>
          <button className="text-red-600 hover:text-red-700 font-medium text-xs px-2 py-1 bg-red-50 hover:bg-red-100 rounded transition-colors">
            Tinjau
          </button>
        </div>
      </div>
    </div>
  );
}
