"use client";

import React from "react";
import { Activity, AlertTriangle, CheckCircle2, Users } from "lucide-react";

interface StatItem {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export function StatCards() {
  const stats: StatItem[] = [
    {
      title: "Total Kasus",
      value: 1248,
      icon: <Users className="w-6 h-6 text-blue-600" />,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Kasus Aktif/Proses",
      value: 342,
      icon: <Activity className="w-6 h-6 text-amber-600" />,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Risiko Tinggi",
      value: 56,
      icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Klaim JKK Disetujui",
      value: 850,
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300"
        >
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center ${stat.bgColor}`}
          >
            {stat.icon}
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
            <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}
