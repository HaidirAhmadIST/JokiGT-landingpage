'use client';

interface FaktorPAKModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerName: string;
  companyName: string;
  selectedFaktor: string;
  setSelectedFaktor: (val: string) => void;
  savingFaktor: boolean;
  handleSaveFaktor: () => void;
}

const PAK_CATEGORIES = [
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
];

export default function FaktorPAKModal({
  isOpen, onClose, workerName, companyName, selectedFaktor, setSelectedFaktor, savingFaktor, handleSaveFaktor
}: FaktorPAKModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">
            Klasifikasi Penyakit Akibat Kerja
          </h3>
          <p className="text-sm text-slate-500 mt-1.5 font-medium flex items-center gap-2 flex-wrap">
            Menentukan faktor untuk pekerja: 
            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{workerName}</span>
            <span>dari</span>
            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              {companyName}
            </span>
          </p>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          {PAK_CATEGORIES.map((group, idx) => (
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
              onClick={onClose}
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
  );
}
