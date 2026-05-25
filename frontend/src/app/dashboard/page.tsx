"use client";

import React, { useState, useEffect } from "react";
import { StatCards } from "@/components/dashboard/StatCards";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { FilterableTable } from "@/components/dashboard/FilterableTable";
import { SidePanel } from "@/components/dashboard/SidePanel";

// Mock Session (Biasanya didapat dari Context/Hook seperti useSession)
const MOCK_SESSION = {
  // Ubah role ke "Admin Serikat" atau "Staff" untuk melihat hilangnya tombol Hapus dan Log Aktivitas
  role: "Super Admin" as const, 
  perusahaan_id: 1, 
};

export default function DashboardPage() {
  const [user, setUser] = useState(MOCK_SESSION);
  const [activeFilter, setActiveFilter] = useState<{ category: string; value: string } | null>(null);

  // Mock Data Fetching Concept with Multi-Tenancy
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const params = new URLSearchParams();
        
        // Multi-Tenancy Filter: Jika bukan Super Admin, WAJIB mengirim perusahaan_id
        if (user.role !== "Super Admin" && user.perusahaan_id) {
          params.append("perusahaan_id", user.perusahaan_id.toString());
        }

        console.log("Fetching data with params:", params.toString());
        // const response = await fetch(`/api/dashboard?${params.toString()}`);
        // const data = await response.json();
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, [user]);

  const handleChartClick = (category: string, value: string) => {
    setActiveFilter({ category, value });
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Advokasi PAK</h1>
            <p className="text-gray-500 mt-1">Ringkasan operasional dan pemantauan kasus penyakit akibat kerja.</p>
          </div>
          
          {/* Untuk demonstrasi perubahan Role (Hanya untuk testing) */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
            <span className="text-sm text-gray-500">Simulasi Role:</span>
            <select 
              className="text-sm font-medium outline-none bg-transparent"
              value={user.role}
              onChange={(e) => setUser({ ...user, role: e.target.value as any })}
            >
              <option value="Super Admin">Super Admin</option>
              <option value="Admin Serikat">Admin Serikat</option>
              <option value="Staff">Staff</option>
            </select>
          </div>
        </header>

        {/* Bagian 1: Top Stat Cards */}
        <StatCards />

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Charts & Table) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bagian 2: Main Chart Area */}
            <DashboardCharts onChartClick={handleChartClick} />
            
            {/* Bagian 3: Interactive Data Table */}
            <FilterableTable userRole={user.role} activeFilter={activeFilter?.value ?? null} />
          </div>

          {/* Right Column (Side Panel) */}
          <div className="lg:col-span-1">
            {/* Bagian 4: Side Panel (Alert & Logs) */}
            <SidePanel userRole={user.role} />
          </div>
          
        </div>
      </div>
    </div>
  );
}
