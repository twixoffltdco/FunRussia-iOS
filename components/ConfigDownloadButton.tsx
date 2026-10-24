'use client';

import { useState } from 'react';

type ButtonState = 'idle' | 'preparing' | 'done' | 'error';

/**
 * Кнопка скачивания iOS-профиля (.mobileconfig).
 * Скачивание идёт через скрытый iframe на /api/profile — так Safari
 * корректно предлагает «Установить профиль», а не сохраняет файл.
 */
export default function ConfigDownloadButton() {
  const [state, setState] = useState<ButtonState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  async function handleInstall() {
    setState('preparing');
    setErrorMessage('');

    try {
      // Предварительно проверяем, что сервер может отдать профиль
      const probe = await fetch('/api/profile', { method: 'GET', cache: 'no-store' });
      if (!probe.ok) {
        let hint = 'Сервер вернул ошибку. Попробуйте позже.';
        try {
          const body = (await probe.json()) as { details?: string; hint?: string };
          hint = [body.details, body.hint].filter(Boolean).join(' · ') || hint;
        } catch {
          /* тело не JSON — используем подсказку по умолчанию */
        }
        throw new Error(hint);
      }

      // Передаём установку Safari через iframe (стандартный способ для профилей)
      const frame = document.createElement('iframe');
      frame.style.display = 'none';
      frame.src = '/api/profile';
      document.body.appendChild(frame);
      setTimeout(() => frame.remove(), 60_000);

      setState('done');
    } catch (err) {
      setState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Неизвестная ошибка');
    }
  }

  return (
    <div className="w-full max-w-md space-y-3">
      <button
        type="button"
        onClick={handleInstall}
        disabled={state === 'preparing'}
        className={`glow group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-brand-red to-[#c1121f] px-6 py-5 text-lg font-bold text-white shadow-xl transition-all duration-200 active:scale-[0.98] disabled:cursor-wait disabled:opacity-80 ${
          state === 'done' ? 'ring-2 ring-emerald-400/70' : ''
        }`}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {state === 'idle' && <>📲 Установить профиль для iOS</>}
          {state === 'preparing' && (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Готовим профиль…
            </>
          )}
          {state === 'done' && <>✅ Загрузка началась! Смотри «Настройки»</>}
          {state === 'error' && <>⚠️ Не получилось — нажмите ещё раз</>}
        </span>
        {/* Блик на кнопке */}
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      </button>

      {state === 'error' && errorMessage && (
        <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </p>
      )}

      {state === 'done' && (
        <p className="text-center text-sm text-emerald-300/90">
          Теперь открой <b>Настройки → Профиль загружен</b> и установи его (шаги ниже 👇)
        </p>
      )}

      <p className="text-center text-xs text-zinc-500">
        Требуется iOS 14+ · Только Safari · Не VPN — безопасно
      </p>
    </div>
  );
}
