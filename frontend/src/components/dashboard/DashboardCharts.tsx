"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DashboardChartsProps {
  onChartClick: (category: string, value: string) => void;
}

const organData = [
  { name: "Pernafasan", Fisika: 120, Kimia: 300, Biologi: 50 },
  { name: "Kulit", Fisika: 80, Kimia: 250, Biologi: 100 },
  { name: "Otot & Kerangka", Fisika: 400, Kimia: 20, Biologi: 10 },
  { name: "Mental", Fisika: 10, Kimia: 5, Biologi: 5 },
  { name: "Kanker", Fisika: 90, Kimia: 180, Biologi: 30 },
];

const klasifikasiPAKData = [
  {
    kategori: "Penyebab",
    "Faktor Kimia": 150,
    "Faktor Fisika": 200,
    "Faktor Biologi": 85,
  },
  {
    kategori: "Target Organ",
    "Pernafasan": 120,
    "Kulit": 90,
    "Otot & Kerangka": 250,
    "Mental & Perilaku": 40,
  },
  {
    kategori: "Kanker",
    "Kanker Akibat Kerja": 45,
  }
];

export function DashboardCharts({ onChartClick }: DashboardChartsProps) {
  const [activeTab, setActiveTab] = useState<"distribusi" | "klasifikasi">("distribusi");
  const [causeFilter, setCauseFilter] = useState<"Semua" | "Fisika" | "Kimia" | "Biologi">("Semua");

  const handleOrganClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      onChartClick("organ", data.activePayload[0].payload.name);
    }
  };

  const handleKlasifikasiClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      onChartClick("klasifikasi", data.activePayload[0].name);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-gray-100 mb-6 pb-2">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("distribusi")}
            className={`pb-2 font-medium transition-colors relative ${
              activeTab === "distribusi" ? "text-blue-600" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Distribusi PAK
            {activeTab === "distribusi" && (
              <span className="absolute bottom-[-9px] left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("klasifikasi")}
            className={`pb-2 font-medium transition-colors relative ${
              activeTab === "klasifikasi" ? "text-blue-600" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Klasifikasi PAK
            {activeTab === "klasifikasi" && (
              <span className="absolute bottom-[-9px] left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
            )}
          </button>
        </div>

        {/* Filters (Only for Tab 1) */}
        {activeTab === "distribusi" && (
          <select
            value={causeFilter}
            onChange={(e) => setCauseFilter(e.target.value as any)}
            className="border border-gray-200 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500 bg-gray-50"
          >
            <option value="Semua">Semua Penyebab</option>
            <option value="Fisika">Fisika</option>
            <option value="Kimia">Kimia</option>
            <option value="Biologi">Biologi</option>
          </select>
        )}
      </div>

      {/* Chart Content */}
      <div className="h-[350px] w-full">
        {activeTab === "distribusi" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={organData} onClick={handleOrganClick} className="cursor-pointer">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6B7280" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6B7280" }} />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              />
              {causeFilter === "Semua" || causeFilter === "Fisika" ? (
                <Bar dataKey="Fisika" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
              ) : null}
              {causeFilter === "Semua" || causeFilter === "Kimia" ? (
                <Bar dataKey="Kimia" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
              ) : null}
              {causeFilter === "Semua" || causeFilter === "Biologi" ? (
                <Bar
                  dataKey="Biologi"
                  stackId="a"
                  fill="#10B981"
                  radius={causeFilter === "Semua" ? [4, 4, 0, 0] : [4, 4, 0, 0]}
                />
              ) : null}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={klasifikasiPAKData} onClick={handleKlasifikasiClick} className="cursor-pointer">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="kategori" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 13, fontWeight: 500 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6B7280" }} />
              <Tooltip
                cursor={{ fill: "#F3F4F6" }}
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              />
              {/* Penyebab */}
              <Bar dataKey="Faktor Kimia" stackId="a" fill="#3B82F6" />
              <Bar dataKey="Faktor Fisika" stackId="a" fill="#60A5FA" />
              <Bar dataKey="Faktor Biologi" stackId="a" fill="#93C5FD" radius={[4, 4, 0, 0]} />
              
              {/* Target Organ */}
              <Bar dataKey="Pernafasan" stackId="b" fill="#F59E0B" />
              <Bar dataKey="Kulit" stackId="b" fill="#FBBF24" />
              <Bar dataKey="Otot & Kerangka" stackId="b" fill="#FCD34D" />
              <Bar dataKey="Mental & Perilaku" stackId="b" fill="#FDE68A" radius={[4, 4, 0, 0]} />

              {/* Kanker */}
              <Bar dataKey="Kanker Akibat Kerja" stackId="c" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
