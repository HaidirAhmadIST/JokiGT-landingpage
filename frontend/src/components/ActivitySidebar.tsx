'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import {
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  RotateCcw,
  ShieldAlert,
  Loader2,
  Activity,
  UserCog,
} from 'lucide-react';
import { useRole } from '@/hooks/useRole';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityLogItem {
  id: number;
  action: string;
  description: string;
  category: 'sistem' | 'admin';
  user_name: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  time_ago: string;
}

// ─── Action → Icon/Color map (light theme) ───────────────────────────────────

function getActionMeta(action: string) {
  switch (action) {
    case 'create':
      return {
        icon: Plus,
        bg: 'bg-emerald-50',
        text: 'text-emerald-500',
        border: 'border-emerald-100',
        dot: 'bg-emerald-400',
      };
    case 'update':
      return {
        icon: RefreshCw,
        bg: 'bg-blue-50',
        text: 'text-blue-500',
        border: 'border-blue-100',
        dot: 'bg-blue-400',
      };
    case 'soft_delete':
      return {
        icon: Trash2,
        bg: 'bg-red-50',
        text: 'text-red-500',
        border: 'border-red-100',
        dot: 'bg-red-400',
      };
    case 'restore':
      return {
        icon: RotateCcw,
        bg: 'bg-purple-50',
        text: 'text-purple-500',
        border: 'border-purple-100',
        dot: 'bg-purple-400',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        bg: 'bg-amber-50',
        text: 'text-amber-500',
        border: 'border-amber-100',
        dot: 'bg-amber-400',
      };
    default:
      return {
        icon: CheckCircle2,
        bg: 'bg-indigo-50',
        text: 'text-indigo-500',
        border: 'border-indigo-100',
        dot: 'bg-indigo-400',
      };
  }
}



// ─── Single Activity Item ─────────────────────────────────────────────────────

function ActivityItem({ item }: { item: ActivityLogItem }) {
  const meta = getActionMeta(item.action);
  const Icon = meta.icon;
  const subtitle = item.metadata?.subtitle as string | undefined;

  return (
    <div className="flex gap-3.5 group">
      {/* Icon bubble — matches old dashboard style */}
      <div
        className={`
          shrink-0 h-9 w-9 rounded-full flex items-center justify-center
          ${meta.bg} ${meta.text}
        `}
      >
        <Icon className="h-4 w-4 stroke-[2.5]" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 space-y-0.5 pb-4 border-b border-slate-50 group-last:border-b-0 group-last:pb-0">
        <p className="text-[13px] font-bold text-[#1e293b] leading-tight">
          {item.description}
        </p>
        {subtitle && (
          <p className="text-[13px] text-[#64748b] truncate">{subtitle}</p>
        )}
        <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mt-1">
          {item.time_ago}
          {item.user_name && item.user_name !== 'System' && (
            <span className="normal-case font-normal ml-1.5">· {item.user_name}</span>
          )}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ActivitySidebar() {
  const router = useRouter();
  const { isSuperAdmin } = useRole();
  const [activeTab, setActiveTab] = useState<'sistem' | 'admin'>('sistem');
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async (category: string) => {
    setLoading(true);
    try {
      const res = await api.get('/activity-logs', { params: { category } });
      if (res.data.status === 'success') {
        setLogs(res.data.data.data || res.data.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchLogs(activeTab);
    }
  }, [activeTab, fetchLogs, isSuperAdmin]);

  const displayItems = logs;

  if (!isSuperAdmin) return null;

  return (
    <div className="flex flex-col h-full rounded-[20px] bg-white shadow-sm border border-slate-100 overflow-hidden">

      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-[17px] font-bold text-[#0f172a] mb-4">
          Aktivitas Terkini
        </h2>

        {/* Tab switcher — matches the dashboard active nav style */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(
            [
              { key: 'sistem', label: 'Sistem', Icon: Activity },
              { key: 'admin',  label: 'Admin',  Icon: UserCog },
            ] as const
          ).map(({ key, label, Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                id={`tab-${key}`}
                onClick={() => setActiveTab(key)}
                className={`
                  flex-1 flex items-center justify-center gap-1.5
                  py-2 px-3 rounded-lg text-[12px] font-bold
                  transition-all duration-200
                  ${isActive
                    ? 'bg-white text-[#0284c7] shadow-sm border border-slate-100'
                    : 'text-slate-400 hover:text-slate-600'
                  }
                `}
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-[#0ea5e9]' : ''}`} />
                <span>Aktivitas {label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-6 py-2 space-y-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Loader2 className="h-6 w-6 text-[#0ea5e9] animate-spin" />
            <p className="text-xs text-[#94a3b8] font-medium">Memuat log admin...</p>
          </div>
        ) : displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <ShieldAlert className="h-8 w-8 text-slate-200" />
            <p className="text-xs text-slate-400 font-medium text-center">
              {activeTab === 'admin'
                ? 'Belum ada aktivitas admin tercatat.'
                : 'Tidak ada aktivitas sistem.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {displayItems.slice(0, 5).map((item) => (
              <ActivityItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-6 py-4 border-t border-slate-100 text-center">
        <button
          onClick={() => router.push('/aktivitas')}
          className="text-[13px] font-bold text-[#0ea5e9] hover:text-[#0284c7] transition-colors"
        >
          Lihat Semua Aktivitas
        </button>
      </div>
    </div>
  );
}
