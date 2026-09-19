import React from 'react';
import { Card } from '@/components/ui/card';
import { FileStack, Clock, CheckCircle2, Download, Upload, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  key: string;
  label: string;
  icon: any;
  color: string;
}

interface DocKey {
  key: string;
  name: string;
  pathKey: string;
  dateKey: string;
}

interface AdvokasiDocumentsProps {
  adv: any;
  requests: any[];
  pekerja: any;
  STEPS: Step[];
  DOC_KEYS: DocKey[];
  fmt: (d?: string) => string;
  handleViewFile: (path: string) => void;
  setUploadForm: (form: any) => void;
  setUploadModal: (val: boolean) => void;
}

export default function AdvokasiDocuments({
  adv, requests, pekerja, STEPS, DOC_KEYS, fmt,
  handleViewFile, setUploadForm, setUploadModal
}: AdvokasiDocumentsProps) {
  if (!adv) return null;

  return (
    <Card className="rounded-[24px] border-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileStack className="h-4 w-4 text-[#0284c7]" />
          <h2 className="text-xs font-black text-[#94a3b8] tracking-widest uppercase">Dokumen Bukti</h2>
        </div>
      </div>
      <div className="space-y-4">
        {STEPS.map((step, i) => {
          const isDone = !!(adv?.[step.key]);
          const isPending = requests.some(r => 
            r.model_type === 'StatusAdvokasi' && 
            r.status === 'PENDING' && 
            r.payload?.step_key === step.key
          );
          const isActive = !isDone && !isPending && (i === 0 || !!(adv?.[STEPS[i-1]?.key]));
          const docKey = DOC_KEYS.find(d => d.key === step.key);
          const hasDoc = docKey ? (adv?.[docKey.pathKey] as string | undefined) : undefined;
          const docDate = docKey ? (adv?.[docKey.dateKey] as string | undefined) : undefined;
          const Icon = step.icon;
          return (
            <div key={step.key} className={cn(
              "flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border transition-all",
              isDone ? "bg-emerald-50/40 border-emerald-100" :
              isPending ? "bg-amber-50/40 border-amber-100 ring-1 ring-amber-500/10 shadow-sm animate-pulse" :
              isActive ? "bg-white border-blue-100 ring-1 ring-blue-500/10 shadow-sm" :
              "bg-slate-50/50 border-slate-100 opacity-60"
            )}>
              <div className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                isDone ? step.color + " text-white" :
                isPending ? "bg-white border-2 border-amber-500 text-amber-500" :
                isActive ? "bg-white border-2 border-blue-500 text-blue-600" :
                "bg-slate-200 text-slate-400"
              )}>
                {isDone ? <CheckCircle2 className="h-6 w-6" /> : isPending ? <Clock className="h-5 w-5 text-amber-500" /> : <Icon className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className={cn("text-sm font-black", (isDone ? "text-slate-800" : isPending ? "text-amber-700" : isActive ? "text-blue-700" : "text-slate-400"))}>
                    {docKey?.name ?? step.label}
                  </h4>
                  <span className={cn(
                    "text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider",
                    isDone ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                    isPending ? "bg-amber-100 text-amber-700 border-amber-200" :
                    isActive ? "bg-blue-100 text-blue-700 border-blue-200" :
                    "bg-slate-100 text-slate-400 border-slate-200"
                  )}>
                    {isDone ? 'SELESAI' : isPending ? 'KONFIRMASI' : isActive ? 'DI PROSES' : 'MENUNGGU'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {isDone && docDate && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                      <Calendar className="h-3 w-3" /> {fmt(docDate)}
                    </div>
                  )}
                  {isPending && <p className="text-[10px] text-amber-600 font-bold italic">Menunggu konfirmasi berkas oleh Admin</p>}
                  {isActive && !hasDoc && <p className="text-[10px] text-blue-500 font-bold italic">Unggah dokumen untuk memulai</p>}
                  {isActive && hasDoc && <p className="text-[10px] text-emerald-600 font-bold italic">Dokumen terunggah</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasDoc && (
                  <button
                    onClick={() => handleViewFile('/pekerja/' + pekerja?.id + '/files/advokasi/' + step.key)}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                )}
                {(isActive || isDone) && (
                  <button
                    onClick={() => { setUploadForm({ step_key: step.key, file: null, tanggal: '' }); setUploadModal(true); }}
                    className={cn(
                      "p-2.5 rounded-xl border transition-all shadow-sm",
                      (isActive && !hasDoc ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" : "bg-white border-slate-200 text-slate-400 hover:text-blue-600")
                    )}
                    title="Upload"
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
