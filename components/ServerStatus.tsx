'use client';

import { useEffect, useState } from 'react';
import { CONFIG } from '@/lib/config';

interface StatusResponse {
  online: boolean;
  players: number | null;
  lastCheck: string;
}

type UiState =
  | { kind: 'loading' }
  | { kind: 'online'; players: number | null }
  | { kind: 'offline' }
  | { kind: 'error' };

/**
 * Индикатор статуса сервера FUN RUSSIA.
 * Опрашивает /api/status (кэш сервера — 30 с) и обновляет себя каждые 60 с.
 */
export default function ServerStatus() {
  const [state, setState] = useState<UiState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch('/api/status', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as StatusResponse;
        if (cancelled) return;
        setState(data.online ? { kind: 'online', players: data.players } : { kind: 'offline' });
      } catch {
        // Gracefully: не умеем проверять — показываем «статус неизвестен»,
        // но сам сайт продолжает работать.
        if (!cancelled) setState({ kind: 'error' });
      }
    }

    check();
    const id = setInterval(check, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const dot =
    state.kind === 'online'
      ? 'bg-emerald-400'
      : state.kind === 'offline'
        ? 'bg-red-500'
        : 'bg-zinc-500';

  const label =
    state.kind === 'loading'
      ? 'Проверяем статус…'
      : state.kind === 'online'
        ? `Сервер онлайн${state.players !== null ? ` · ${state.players} в игре` : ''}`
        : state.kind === 'offline'
          ? 'Сервер офлайн'
          : 'Статус проверяется';

  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-brand-border bg-brand-card px-4 py-2 text-sm">
      <span className={`relative inline-block h-2.5 w-2.5 rounded-full ${dot} ${state.kind === 'online' ? 'ping-dot' : ''}`} />
      <span className="font-medium text-zinc-200">{label}</span>
      <span className="hidden text-zinc-500 sm:inline">·</span>
      <span className="hidden font-mono text-xs text-zinc-500 sm:inline">
        {CONFIG.serverIp}:{CONFIG.serverPort}
      </span>
    </div>
  );
}
