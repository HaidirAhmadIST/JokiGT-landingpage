"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Edit2, Eye, Trash2 } from "lucide-react";
import api from '@/lib/axios';

interface WorkerData {
  id: string;
  real_id?: number;
  name: string;
  company: string;
  organTarget: string;
  kategoriName: string;
  status: string;
  date: string;
}

interface FilterableTableProps {
  userRole?: string;
  activeFilter?: string | null;
}

export function FilterableTable({ userRole, activeFilter = 'all' }: FilterableTableProps) {
  const [allData, setAllData] = useState<WorkerData[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Ambil SEMUA data HANYA SEKALI saat komponen pertama kali dirender
  useEffect(() => {
    setLoading(true);
    api.get(`/dashboard/pekerja-klasifikasi?filter=all`)
      .then(res => {
        if (res.data.status === 'success') {
          setAllData(res.data.data);
        }
      })
      .catch(err => {
        console.error("Failed to fetch pekerja klasifikasi:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // 2. Lakukan filtering di sisi Client (Browser) secara instan (0ms)
  const displayData = React.useMemo(() => {
    if (!activeFilter || activeFilter === 'all') {
      return allData;
    }
    return allData.filter(worker => worker.kategoriName === activeFilter);
  }, [allData, activeFilter]);

  // Fallback to role from prop, but API handles security anyway
  const canDelete = userRole === "Super Admin"; // Only Super Admin can delete

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-semibold text-gray-800">
          Daftar Kasus Pekerja
          {activeFilter && activeFilter !== 'all' && (
            <span className="ml-2 text-sm font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Filter: {activeFilter}
            </span>
          )}
        </h3>
        {activeFilter && activeFilter !== 'all' && (
          <button 
            onClick={() => window.location.reload()} // Simplified clear filter
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
              <th className="px-6 py-3">Detail Spesifik</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex justify-center items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin"></div>
                    <span>Memuat Data...</span>
                  </div>
                </td>
              </tr>
            ) : displayData.length > 0 ? (
              displayData.map((row) => (
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
                      {row.status ? row.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : 'Belum Ada Status'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <Link href={`/pekerja/${row.real_id}`} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Lihat Detail">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link href={`/pekerja/${row.real_id}`} className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors" title="Edit Data">
                      <Edit2 className="w-4 h-4" />
                    </Link>
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
