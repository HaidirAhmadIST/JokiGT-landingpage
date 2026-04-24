'use client';

import { useState, useEffect } from 'react';
import {
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  LogIn,
  Monitor,
  Smartphone,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';


function PasswordField({ label, value, onChange, placeholder, show, onToggle, error }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full h-11 pl-4 pr-11 rounded-xl border bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/50 ${
            error ? 'border-rose-500 focus:ring-rose-500/20' : 'border-border'
          }`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Minimal 8 karakter', ok: password.length >= 8 },
    { label: 'Huruf besar (A-Z)', ok: /[A-Z]/.test(password) },
    { label: 'Huruf kecil (a-z)', ok: /[a-z]/.test(password) },
    { label: 'Angka (0-9)', ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['bg-rose-500', 'bg-amber-500', 'bg-amber-400', 'bg-emerald-500', 'bg-emerald-500'];
  const labels = ['', 'Lemah', 'Cukup', 'Baik', 'Kuat'];

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score] : 'bg-border'}`} />
        ))}
        <span className={`text-[10px] font-bold ml-2 self-center ${score >= 3 ? 'text-emerald-500' : score >= 2 ? 'text-amber-500' : 'text-rose-500'}`}>
          {labels[score]}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center shrink-0 ${c.ok ? 'bg-emerald-500' : 'bg-border'}`}>
              {c.ok && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
            </div>
            <span className={`text-[10px] font-medium ${c.ok ? 'text-foreground' : 'text-muted-foreground'}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'security' | 'activity'>('security');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchLogs();
    }
  }, [activeTab]);

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await api.get('/activity-logs');
      if (res.data.status === 'success') {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [showFields, setShowFields] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.current_password) e.current_password = 'Password saat ini wajib diisi.';
    if (!form.new_password) e.new_password = 'Password baru wajib diisi.';
    else if (form.new_password.length < 8) e.new_password = 'Minimal 8 karakter.';
    if (!form.new_password_confirmation) e.new_password_confirmation = 'Konfirmasi password wajib diisi.';
    else if (form.new_password !== form.new_password_confirmation) e.new_password_confirmation = 'Konfirmasi password tidak cocok.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await api.post('/change-password', form);
      toast.success('Password berhasil diubah! Silakan login kembali.');
      // Clear token & redirect to login
      setTimeout(() => {
        Cookies.remove('auth_token', { path: '/' });
        localStorage.removeItem('user');
        window.location.href = '/login';
      }, 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Terjadi kesalahan. Coba lagi.';
      if (err?.response?.status === 422) {
        setErrors({ current_password: msg });
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    setErrors({});
    setShowChangePassword(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Keamanan & Akun</h1>
        <p className="text-muted-foreground font-medium">Kelola proteksi dan aktivitas akun Azure Sentinel Anda.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'security' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck className="h-4 w-4 inline mr-2" />Keamanan Akun
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'activity' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ClipboardList className="h-4 w-4 inline mr-2" />Log Aktivitas
        </button>
      </div>

      {/* SECURITY TAB */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-in fade-in duration-300">

          {/* Change Password Section */}
          <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Ubah Kata Sandi</p>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Perbarui password Anda secara berkala untuk menjaga keamanan.</p>
                </div>
              </div>
              <Button
                variant={showChangePassword ? 'ghost' : 'outline'}
                size="sm"
                onClick={() => showChangePassword ? resetForm() : setShowChangePassword(true)}
                className="rounded-xl font-bold shrink-0"
              >
                {showChangePassword ? <><X className="h-4 w-4 mr-1" /> Tutup</> : 'Ubah Password'}
              </Button>
            </div>

            {/* Inline Change Password Form */}
            {showChangePassword && (
              <div className="border-t border-border p-6 space-y-5 bg-muted/20 animate-in fade-in slide-in-from-top-2 duration-200">
                <PasswordField
                  label="Password Saat Ini"
                  value={form.current_password}
                  onChange={(e: any) => setForm({ ...form, current_password: e.target.value })}
                  placeholder="Masukkan password saat ini"
                  show={showFields.current}
                  onToggle={() => setShowFields(s => ({ ...s, current: !s.current }))}
                  error={errors.current_password}
                />
                <div className="space-y-1.5">
                  <PasswordField
                    label="Password Baru"
                    value={form.new_password}
                    onChange={(e: any) => setForm({ ...form, new_password: e.target.value })}
                    placeholder="Buat password yang kuat"
                    show={showFields.new}
                    onToggle={() => setShowFields(s => ({ ...s, new: !s.new }))}
                    error={errors.new_password}
                  />
                  <PasswordStrength password={form.new_password} />
                </div>
                <PasswordField
                  label="Konfirmasi Password Baru"
                  value={form.new_password_confirmation}
                  onChange={(e: any) => setForm({ ...form, new_password_confirmation: e.target.value })}
                  placeholder="Ulangi password baru"
                  show={showFields.confirm}
                  onToggle={() => setShowFields(s => ({ ...s, confirm: !s.confirm }))}
                  error={errors.new_password_confirmation}
                />

                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={resetForm} className="rounded-xl font-bold flex-1" disabled={isSubmitting}>
                    Batal
                  </Button>
                  <Button
                    onClick={handleChangePassword}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl flex-1 shadow-lg shadow-primary/20 disabled:opacity-70"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Memperbarui...' : 'Simpan Password Baru'}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* 2FA Section */}
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-xl">
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Autentikasi Dua Faktor (2FA)</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block" />
                    <p className="text-[11px] text-rose-500 font-bold uppercase tracking-tighter">Belum Aktif</p>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('Fitur 2FA akan segera hadir di pembaruan berikutnya.')}
                className="rounded-xl font-bold shrink-0 border-amber-500/30 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
              >
                Aktifkan 2FA
              </Button>
            </div>
          </Card>

          {/* Security Info */}
          <Card className="p-5 rounded-2xl border-dashed border-2 border-border bg-transparent">
            <div className="flex gap-4 items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-foreground">Tips Keamanan</h4>
                <ul className="mt-2 space-y-1">
                  {[
                    'Gunakan password yang unik dan minimal 8 karakter.',
                    'Aktifkan 2FA untuk perlindungan berlapis.',
                    'Jangan bagikan kata sandi kepada siapapun.',
                    'Ganti password secara berkala setiap 3 bulan.',
                  ].map((tip, i) => (
                    <li key={i} className="text-xs text-muted-foreground font-medium flex gap-2">
                      <span className="text-primary font-bold shrink-0">•</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ACTIVITY LOG TAB */}
      {activeTab === 'activity' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Riwayat Aktivitas Akun</h3>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Aktivitas terbaru Anda</p>
              </div>
              <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold">
                {logs.length} aktivitas
              </span>
            </div>
            
            <div className="divide-y divide-border min-h-[200px]">
              {isLoadingLogs ? (
                <div className="flex flex-col items-center justify-center p-12">
                   <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                   <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Memuat log...</p>
                </div>
              ) : logs.length > 0 ? (
                logs.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-5 hover:bg-muted/30 transition-colors">
                    <div className="p-2.5 rounded-xl bg-muted shrink-0">
                      {item.category === 'admin' ? (
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      ) : item.action?.toLowerCase().includes('login') ? (
                        <LogIn className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ClipboardList className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{item.action}</p>
                      <p className="text-[11px] text-muted-foreground font-medium truncate">
                        {item.description}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium shrink-0">{item.time_ago}</span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                   <div className="p-4 bg-muted rounded-full mb-4">
                      <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
                   </div>
                   <h4 className="text-sm font-bold text-foreground">Belum ada aktivitas</h4>
                   <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Semua aktivitas akun Anda akan muncul di sini.</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5 rounded-2xl border-dashed border-2 border-border bg-transparent">
            <div className="flex gap-4 items-center">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
              <p className="text-xs text-muted-foreground font-medium">
                Jika Anda melihat aktivitas yang mencurigakan, segera ubah kata sandi Anda dan hubungi administrator sistem.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
