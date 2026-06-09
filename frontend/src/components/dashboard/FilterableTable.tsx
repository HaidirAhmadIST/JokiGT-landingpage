"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Edit2, Eye, Trash2 } from "lucide-react";
import api from '@/lib/axios';
import { toast } from "sonner";

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

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerData | null>(null);
  const [selectedFaktor, setSelectedFaktor] = useState("");
  const [savingFaktor, setSavingFaktor] = useState(false);

  const openModal = (worker: WorkerData) => {
    setSelectedWorker(worker);
    setSelectedFaktor(worker.organTarget && worker.organTarget !== 'Belum Ditentukan' ? worker.organTarget : "");
    setIsModalOpen(true);
  };

  const handleSaveFaktor = async () => {
    if (!selectedWorker) return;
    setSavingFaktor(true);
    try {
      const res = await api.post(`/pekerja/${selectedWorker.real_id}/faktor-pak`, {
        faktor_pak: selectedFaktor
      });
      if (res.data.status === 'success') {
        // Update local state
        setAllData(prev => prev.map(w => {
          if (w.real_id === selectedWorker.real_id) {
            // Kita refresh halaman agar seluruh diagram ikut berubah, 
            // atau cukup update state lokal
            return { ...w, organTarget: selectedFaktor };
          }
          return w;
        }));
        setIsModalOpen(false);
        // Toast notification (opsional, jika ada library)
        toast.success('Faktor PAK berhasil disimpan!');
        setTimeout(() => window.location.reload(), 1500); // Paksa reload agar diagram terupdate
      }
    } catch (e) {
      console.error(e);
      toast.error('Gagal menyimpan Faktor PAK');
    } finally {
      setSavingFaktor(false);
    }
  };

  const [fetchedRole, setFetchedRole] = useState<string>("");

  // 1. Ambil SEMUA data HANYA SEKALI saat komponen pertama kali dirender
  useEffect(() => {
    setLoading(true);
    api.get(`/dashboard/pekerja-klasifikasi?filter=all`)
      .then(res => {
        if (res.data.status === 'success') {
          setAllData(res.data.data);
          if (res.data.role) {
            setFetchedRole(res.data.role);
          }
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
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                      row.organTarget === 'Belum Ditentukan' 
                        ? 'bg-gray-50 text-gray-500 border-gray-200'
                        : ['Faktor Kimia', 'Faktor Fisika', 'Faktor Biologi'].includes(row.organTarget)
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : ['Pernafasan', 'Kulit', 'Otot & Kerangka', 'Mental & Perilaku'].includes(row.organTarget)
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : row.organTarget === 'Kanker Akibat Kerja'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {row.organTarget}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {row.status ? row.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : 'Belum Ada Status'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <Link href={`/pekerja/detail?id=${row.real_id}`} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Lihat Detail">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link href={`/pekerja/detail?id=${row.real_id}`} className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors" title="Edit Data">
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    {canDelete && (
                      <button className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Hapus Data">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {(fetchedRole === "Super Admin" || fetchedRole === "Admin Serikat" || userRole === "admin" || userRole === "super_admin") && (
                      <button 
                        onClick={() => openModal(row)}
                        className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" 
                        title="Tentukan Faktor PAK"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
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

      {/* MODAL TENTUKAN PAK */}
      {isModalOpen && selectedWorker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                Klasifikasi Penyakit Akibat Kerja
              </h3>
              <p className="text-sm text-slate-500 mt-1.5 font-medium flex items-center gap-2 flex-wrap">
                Menentukan faktor untuk pekerja: 
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{selectedWorker.name}</span>
                <span>dari</span>
                <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{selectedWorker.company || 'Perusahaan Tidak Diketahui'}</span>
              </p>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {[
                { 
                  title: 'Kategori I (Penyebab)', 
                  options: ['Faktor Kimia', 'Faktor Fisika', 'Faktor Biologi'],
                  activeClass: 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 scale-[1.02]',
                  inactiveClass: 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                },
                { 
                  title: 'Kategori II (Target Organ)', 
                  options: ['Pernafasan', 'Kulit', 'Otot & Kerangka', 'Mental & Perilaku'],
                  activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200 scale-[1.02]',
                  inactiveClass: 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50'
                },
                { 
                  title: 'Kategori III (Kanker)', 
                  options: ['Kanker Akibat Kerja'],
                  activeClass: 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-200 scale-[1.02]',
                  inactiveClass: 'bg-white text-slate-600 border-slate-200 hover:border-rose-300 hover:bg-rose-50'
                },
                { 
                  title: 'Kategori IV (Penyakit Spesifik Lainnya)', 
                  options: ['Nystagmus pada penambang'],
                  activeClass: 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-200 scale-[1.02]',
                  inactiveClass: 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:bg-amber-50'
                }
              ].map((group, idx) => (
                <div key={idx} className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{group.title}</h4>
                  <div className="flex flex-wrap gap-2.5">
                    {group.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSelectedFaktor(opt)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                          selectedFaktor === opt ? group.activeClass : group.inactiveClass
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                {selectedFaktor ? (
                  <p className="text-sm text-slate-500">Terpilih: <span className="font-bold text-slate-800">{selectedFaktor}</span></p>
                ) : (
                  <p className="text-sm text-amber-600 font-medium italic">Pilih salah satu faktor di atas</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveFaktor}
                  disabled={savingFaktor || !selectedFaktor}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm hover:shadow shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingFaktor ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
