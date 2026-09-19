'use client';
import { ShieldAlert, CheckCircle2, Circle, FileText, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface AdvokasiStep {
  key: string;
  label: string;
}

interface AdvokasiSidebarProps {
  advSteps: AdvokasiStep[];
  activeStepIndex: number;
  isStepCompleted: (key: string) => boolean;
  getFilePath: (key: string) => string | undefined;
  getUploadDate: (key: string) => string | null | undefined;
  formatDate: (d: string) => string;
  isStaffOrAbove: boolean;
  toggleAdvokasi: (field: string, checked: boolean) => void;
  uploadLoading: string | null;
  deleteLoading: string | null;
  fileToDelete: string | null;
  setFileToDelete: (key: string | null) => void;
  handleFileUpload: (stepKey: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  downloadFile: (stepKey: string) => void;
  handleDeleteAdvokasiFile: (stepKey: string) => void;
  confirmDeleteAdvokasiFile: () => void;
}

export default function AdvokasiSidebar({
  advSteps, activeStepIndex, isStepCompleted, getFilePath, getUploadDate, formatDate,
  isStaffOrAbove, toggleAdvokasi, uploadLoading, deleteLoading,
  fileToDelete, setFileToDelete, handleFileUpload, downloadFile,
  handleDeleteAdvokasiFile, confirmDeleteAdvokasiFile,
}: AdvokasiSidebarProps) {
  return (
    <>
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
        <h3 className="text-sm font-bold text-[#1e293b] flex items-center mb-6">
          <ShieldAlert className="h-4 w-4 text-[#0ea5e9] mr-2" /> Status Advokasi
        </h3>
        
        <div className="relative pl-3 space-y-6">
          {/* Timeline line connecting items */}
          <div className="absolute top-2 bottom-5 left-[19px] w-[2px] bg-slate-100 rounded-full" />
          
          {advSteps.map((step, idx) => {
            const isCompleted = isStepCompleted(step.key);
            const hasFile = !!getFilePath(step.key);
            const isCurrent = idx === activeStepIndex;
            
            return (
              <div key={step.key} className="relative z-10 flex items-start group">
                <button 
                  onClick={() => { if (isStaffOrAbove) toggleAdvokasi(step.key, !isCompleted); }}
                  disabled={!isStaffOrAbove}
                  className={`mt-0.5 z-20 flex-shrink-0 mr-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0ea5e9] rounded-full transition-transform transform ${isStaffOrAbove ? 'active:scale-90' : 'cursor-default'}`}
                  title={isStaffOrAbove ? "Klik untuk mengubah status" : ""}
                >
                  {hasFile ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 bg-white" />
                  ) : isCurrent ? (
                    <div className="h-6 w-6 rounded-full border-[3px] border-[#0ea5e9] bg-white flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-[#0ea5e9]" />
                    </div>
                  ) : (
                    <Circle className="h-6 w-6 text-slate-200 fill-white" />
                  )}
                </button>

                <div className="flex-1 pb-1">
                  <p className={`text-[13px] font-bold ${hasFile ? 'text-slate-800' : isCurrent ? 'text-[#0ea5e9]' : 'text-slate-400'}`}>
                    {step.label}
                  </p>
                  <p className={`text-[10px] mt-1 ${hasFile ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>
                    {hasFile ? 'Dokumen Terunggah' : isCurrent ? 'Sedang Berjalan' : 'Belum Dimulai'}
                  </p>

                  <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dokumen / Bukti Pendukung</span>
                      {!!getFilePath(step.key) && !!getUploadDate(step.key) && (
                        <span className="text-[9px] font-medium text-slate-400 italic">
                          Diunggah: {formatDate(getUploadDate(step.key) as string)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {!isStaffOrAbove ? (
                        <div className="h-10 w-full border border-slate-200 border-dashed rounded-md flex items-center justify-center px-3 text-[10px] font-medium text-slate-400 italic">
                          Akses unggah hanya untuk Staff
                        </div>
                      ) : (
                        <div className="relative w-full">
                          <input 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(step.key, e)}
                            disabled={uploadLoading === step.key}
                          />
                          <div className={`h-10 w-full bg-white border ${uploadLoading === step.key ? 'border-[#0ea5e9] bg-blue-50' : 'border-slate-200 border-dashed'} rounded-md flex items-center justify-center px-3 text-[10px] font-bold text-[#0ea5e9] hover:bg-blue-50 transition-colors whitespace-nowrap`}>
                            {uploadLoading === step.key ? 'Mengunggah...' : '+ Pilih File Bukti (Max 5MB)'}
                          </div>
                        </div>
                      )}

                      {getFilePath(step.key) ? (
                        <div className="flex gap-2">
                          <button onClick={() => downloadFile(step.key)} className="h-10 flex-1 bg-white border border-slate-200 rounded-md flex items-center justify-center text-[10px] font-bold text-slate-600 hover:text-[#0ea5e9] hover:border-[#0ea5e9] transition-colors cursor-pointer">
                            <FileText className="h-3.5 w-3.5 mr-1.5" /> Lihat Terunggah
                          </button>
                          {isStaffOrAbove && (
                            <button 
                              onClick={() => handleDeleteAdvokasiFile(step.key)} 
                              disabled={deleteLoading === step.key}
                              className="h-10 px-3 bg-white border border-slate-200 rounded-md flex items-center justify-center text-[10px] font-bold text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                              title="Hapus Dokumen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ) : isStaffOrAbove ? (
                        <div className="h-10 w-full border border-slate-200 border-dashed rounded-md flex items-center justify-center px-3 text-[10px] font-medium text-slate-400 italic">
                          Belum ada dokumen terunggah
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Document Confirmation Dialog */}
      <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 mb-2">
              <Trash2 className="h-7 w-7 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-xl font-black text-slate-900 text-center">Hapus Dokumen?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-center text-sm px-2">
              Apakah Anda yakin ingin menghapus dokumen ini? Status advokasi tahap ini akan kembali menjadi Belum Dimulai.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-3 mt-4">
            <AlertDialogCancel className="rounded-xl border-slate-200 text-slate-500 font-bold hover:bg-slate-50 px-6">
              Batalkan
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteAdvokasiFile}
              className="rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-200 border-none px-6"
            >
              Ya, Hapus Dokumen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
