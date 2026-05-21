"use client";

import React from "react";
import { Activity, FileText, CheckSquare, Users } from "lucide-react";

export function RecentActivities() {
  const activities = [
    {
      id: 1,
      user: "Admin Serikat (PT A)",
      action: "Mendaftarkan kasus baru PAK-105",
      time: "10 menit yang lalu",
      icon: <FileText className="w-4 h-4 text-blue-500" />,
      bg: "bg-blue-50",
    },
    {
      id: 2,
      user: "Dokter OK",
      action: "Memperbarui status evaluasi PAK-092",
      time: "1 jam yang lalu",
      icon: <Activity className="w-4 h-4 text-amber-500" />,
      bg: "bg-amber-50",
    },
    {
      id: 3,
      user: "BPJS Ketenagakerjaan",
      action: "Menyetujui klaim JKK untuk PAK-041",
      time: "3 jam yang lalu",
      icon: <CheckSquare className="w-4 h-4 text-emerald-500" />,
      bg: "bg-emerald-50",
    },
    {
      id: 4,
      user: "Staff Internal",
      action: "Mengunggah dokumen Laporan Perusahaan PAK-088",
      time: "Kemarin",
      icon: <Users className="w-4 h-4 text-purple-500" />,
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-gray-400" />
        Aktivitas Sistem Terkini
      </h3>
      
      <div className="relative border-l border-gray-200 ml-3 space-y-6">
        {activities.map((item) => (
          <div key={item.id} className="relative pl-6">
            <span className={`absolute -left-3 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ${item.bg} ring-4 ring-white`}>
              {item.icon}
            </span>
            <div className="flex flex-col">
              <span className="text-sm text-gray-800">
                <span className="font-medium text-gray-900">{item.user}</span> {item.action}
              </span>
              <span className="text-xs text-gray-500 mt-1">{item.time}</span>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-6 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">
        Lihat Semua Log
      </button>
    </div>
  );
}
