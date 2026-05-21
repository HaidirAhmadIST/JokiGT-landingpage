"use client";

import React, { useMemo } from "react";
import { Edit2, Eye, Trash2 } from "lucide-react";

interface WorkerData {
  id: string;
  name: string;
  company: string;
  organTarget: string;
  cause: string;
  status: string;
  date: string;
}

const mockData: WorkerData[] = [
  { id: "PAK-001", name: "Budi Santoso", company: "PT Industri Kimia", organTarget: "Pernafasan", cause: "Kimia", status: "Riwayat Pajanan", date: "2026-05-10" },
  { id: "PAK-002", name: "Siti Aminah", company: "PT Tambang Makmur", organTarget: "Pernafasan", cause: "Fisika", status: "Penetapan PAK", date: "2026-05-12" },
  { id: "PAK-003", name: "Agus Pratama", company: "PT Konstruksi Maju", organTarget: "Otot & Kerangka", cause: "Fisika", status: "Laporan Perusahaan", date: "2026-05-15" },
  { id: "PAK-004", name: "Dewi Lestari", company: "PT Medika Husada", organTarget: "Kulit", cause: "Biologi", status: "Klaim JKK BPJS", date: "2026-05-18" },
  { id: "PAK-005", name: "Andi Saputra", company: "PT Industri Kimia", organTarget: "Kanker", cause: "Kimia", status: "Rehabilitasi", date: "2026-05-20" },
];

interface FilterableTableProps {
  userRole: "Super Admin" | "Admin Serikat" | "Staff";
  activeFilter: { category: string; value: string } | null;
}

export function FilterableTable({ userRole, activeFilter }: FilterableTableProps) {
  // Client-side filtering based on chart clicks
  const filteredData = useMemo(() => {
    if (!activeFilter) return mockData;

    return mockData.filter((item) => {
      if (activeFilter.category === "organ") {
        return item.organTarget === activeFilter.value;
      }
      if (activeFilter.category === "status") {
        return item.status === activeFilter.value;
      }
      return true;
    });
  }, [activeFilter]);

  const canDelete = userRole === "Super Admin"; // Only Super Admin can delete

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-semibold text-gray-800">
          Daftar Kasus Pekerja
          {activeFilter && (
            <span className="ml-2 text-sm font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Filter: {activeFilter.value}
            </span>
          )}
        </h3>
        {activeFilter && (
          <button 
            onClick={() => window.location.reload()} // For simplicity in mock, normally you'd lift state up to clear filter
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear Filter
          </button>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3">ID Kasus</th>
              <th className="px-6 py-3">Nama Pekerja</th>
              <th className="px-6 py-3">Perusahaan</th>
              <th className="px-6 py-3">Target Organ</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((row) => (
                <tr key={row.id} className="bg-white border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{row.id}</td>
                  <td className="px-6 py-4">{row.name}</td>
                  <td className="px-6 py-4">{row.company}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {row.organTarget}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Lihat Detail">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors" title="Edit Data">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {/* NO DELETE POLICY: Conditional Rendering */}
                    {canDelete && (
                      <button className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Hapus Data">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Tidak ada data yang sesuai dengan filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
