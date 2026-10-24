'use client';

import { useState } from 'react';

interface Step {
  icon: string;
  title: string;
  description: string;
  important?: boolean;
}

const STEPS: Step[] = [
  {
    icon: '📲',
    title: 'Нажми кнопку и разреши загрузку в Safari',
    description:
      'Открой эту страницу именно в Safari (не в приложении Black Russia / VK / Telegram — там установка профиля не работает). Нажми «Установить профиль» и подтверди загрузку.',
  },
  {
    icon: '⚙️',
    title: 'Настройки → Профиль загружен → Установить',
    description:
      'После загрузки в «Настройках» появится пункт «Профиль загружен». Открой его, нажми «Установить» (сверху справа) и введи пароль блокировки экрана.',
  },
  {
    icon: '✅',
    title: 'ВАЖНО: включи профиль вручную',
    description:
      'Настройки → Основные → VPN и управление устройством → найди «FUN RUSSIA DNS» и включи переключатель «DNS-настройки». Без этого шага ничего не заработает!',
    important: true,
  },
  {
    icon: '🔄',
    title: 'Полностью закрой Black Russia',
    description:
      'Свайп вверх по карточке приложения в переключателе приложений (или двойное нажатие Home → свайп). Игра кэширует DNS, поэтому её нужно закрыть полностью.',
  },
  {
    icon: '🎮',
    title: 'Открой Black Russia — ты на FUN RUSSIA!',
    description:
      'Запусти игру как обычно. Клиент получит IP 185.207.214.14 от нашего DoH-сервера и подключится к серверу FUN RUSSIA. Приятной игры!',
  },
];

/**
 * Пошаговая инструкция с чекбоксами «Выполнено».
 * Прогресс сохраняется в localStorage — можно отмечать прямо на телефоне.
 */
export default function StepByStepGuide() {
  const [done, setDone] = useState<boolean[]>(() => STEPS.map(() => false));

  const toggle = (index: number) =>
    setDone((prev) => prev.map((v, i) => (i === index ? !v : v)));

  const completedCount = done.filter(Boolean).length;
  const progress = Math.round((completedCount / STEPS.length) * 100);

  return (
    <section aria-label="Инструкция по установке" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Как установить · 5 шагов</h2>
        <span className="text-sm text-zinc-400">
          {completedCount}/{STEPS.length} выполнено
        </span>
      </div>

      {/* Прогресс-бар */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-border">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-red to-[#ff758f] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className="space-y-3">
        {STEPS.map((step, i) => {
          const isDone = done[i];
          return (
            <li
              key={i}
              className={`rise rounded-2xl border p-4 transition-colors ${
                step.important && !isDone
                  ? 'border-brand-red/60 bg-brand-red/5'
                  : 'border-brand-border bg-brand-card'
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-pressed={isDone}
                  aria-label={isDone ? `Шаг ${i + 1}: отменить` : `Шаг ${i + 1}: отметить выполненным`}
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-lg transition-all active:scale-90 ${
                    isDone
                      ? 'border-emerald-400/60 bg-emerald-400/15'
                      : 'border-brand-border bg-brand-dark hover:border-zinc-500'
                  }`}
                >
                  {isDone ? '✓' : step.icon}
                </button>

                <div className={`min-w-0 ${isDone ? 'opacity-50' : ''}`}>
                  <p className="font-semibold leading-snug text-white">
                    <span className="mr-1.5 text-brand-red">{i + 1}.</span>
                    {step.title}
                    {step.important && (
                      <span className="ml-2 rounded-md bg-brand-red/20 px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-brand-red">
                        важно
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                    {step.description}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
