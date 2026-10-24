import Faq from '@/components/Faq';
import ConfigDownloadButton from '@/components/ConfigDownloadButton';
import ServerStatus from '@/components/ServerStatus';
import StepByStepGuide from '@/components/StepByStepGuide';
import { CONFIG } from '@/lib/config';
import { getOnlinePlayersCount } from '@/lib/players';

/**
 * Главная страница FUN RUSSIA iOS Connect.
 * Server Component: счётчик игроков и конфиг рендерятся на сервере,
 * интерактив (кнопка, статус, шаги, FAQ) — клиентские компоненты.
 */

// Страница обновляется раз в минуту (счётчик «уже играют»)
export const revalidate = 60;

const FEATURES = [
  { icon: '🛡️', title: 'Не VPN', text: 'Трафик идёт напрямую. Подменяется только DNS одной игры.' },
  { icon: '⚡', title: '1 минута', text: 'Установка профиля занимает меньше минуты прямо с iPhone.' },
  { icon: '🗑️', title: 'Удаление в любой момент', text: 'Один тап в «Настройках» — и всё как было.' },
  { icon: '🆓', title: 'Бесплатно', text: 'Cloudflare Worker + Tatnet/Vercel: $0 на инфраструктуру.' },
] as const;

export default function Home() {
  const playersNow = getOnlinePlayersCount();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center gap-12 px-4 py-10 sm:py-16">
      {/* ===================== HERO ===================== */}
      <header className="rise flex w-full flex-col items-center gap-5 text-center">
        {/* Логотип FUN RUSSIA */}
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-red to-[#7f0d17] text-3xl shadow-lg shadow-brand-red/30">
            🐺
          </span>
          <div className="text-left leading-none">
            <p className="brand-gradient text-3xl font-black tracking-tight">FUN RUSSIA</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
              iOS Connect
            </p>
          </div>
        </div>

        <h1 className="max-w-xl text-balance text-2xl font-bold leading-snug text-white sm:text-3xl">
          Играй в Black Russia на сервере{' '}
          <span className="text-brand-red">FUN RUSSIA</span>{' '}
          с официального приложения на iPhone
        </h1>

        <p className="max-w-md text-sm leading-relaxed text-zinc-400">
          Установи DNS-профиль — и клиенты Black Russia автоматически подключатся к{' '}
          <span className="font-mono text-zinc-200">
            {CONFIG.serverIp}:{CONFIG.serverPort}
          </span>
          . Без джейлбрейка, без VPN, за 1 минуту.
        </p>

        <ServerStatus />

        {/* Счётчик "Уже играют" */}
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span aria-hidden>🎮</span>
          Уже играют:&nbsp;
          <b className="font-semibold text-emerald-400">{playersNow}</b>&nbsp;человек
        </div>

        <ConfigDownloadButton />
      </header>

      {/* ===================== FEATURES ===================== */}
      <section aria-label="Преимущества" className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-brand-border bg-brand-card p-4 text-center"
          >
            <div className="text-2xl">{f.icon}</div>
            <p className="mt-2 text-sm font-semibold text-white">{f.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{f.text}</p>
          </div>
        ))}
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="w-full space-y-4">
        <h2 className="text-xl font-bold text-white">🧠 Как это работает</h2>
        <div className="rounded-2xl border border-brand-border bg-brand-card p-5 text-sm leading-relaxed text-zinc-400">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Ты устанавливаешь профиль <b className="text-zinc-200">FUN RUSSIA DNS</b> — штатную
              функцию iOS (то же самое, что «Private DNS» на Android).
            </li>
            <li>
              Профиль направляет все DNS-запросы телефона на наш шифрованный DNS-сервер{' '}
              <b className="text-zinc-200">(DNS over HTTPS, Cloudflare Worker)</b>.
            </li>
            <li>
              Worker отвечает на запрос <code className="rounded bg-brand-dark px-1.5 py-0.5 font-mono text-xs text-brand-red">{CONFIG.targetDomain}</code>{' '}
              адресом <code className="rounded bg-brand-dark px-1.5 py-0.5 font-mono text-xs text-brand-red">{CONFIG.serverIp}</code>. Любой другой домен разрешается как обычно через 1.1.1.1.
            </li>
            <li>
              Black Russia думает, что подключается к официальному серверу, — а попадает на{' '}
              <b className="text-zinc-200">FUN RUSSIA</b> 🎉
            </li>
          </ol>
          <p className="mt-4 rounded-xl border border-brand-border bg-brand-dark px-4 py-3 text-xs text-zinc-500">
            Почему не UDP-прокси? Tatnet.ru и Layer0.ru не поддерживают UDP-перенаправление,
            а SA-MP работает именно по UDP. DNS-метод не требует проксирования трафика вообще.
          </p>
        </div>
      </section>

      {/* ===================== GUIDE ===================== */}
      <div className="w-full">
        <StepByStepGuide />
      </div>

      {/* ===================== FAQ ===================== */}
      <Faq />

      {/* ===================== FOOTER ===================== */}
      <footer className="flex w-full flex-col items-center gap-4 border-t border-brand-border pt-8 text-center">
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <a
            href={CONFIG.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 transition-colors hover:text-white"
          >
            ⭐ GitHub (Open Source, MIT)
          </a>
          <a
            href={CONFIG.links.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 transition-colors hover:text-white"
          >
            ✈️ Поддержка в Telegram
          </a>
          <a
            href={CONFIG.links.telegramChat}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 transition-colors hover:text-white"
          >
            💬 Чат сервера
          </a>
        </nav>
        <p className="text-xs text-zinc-600">
          FUN RUSSIA Project · {CONFIG.serverIp}:{CONFIG.serverPort} · Лицензия MIT ·
          Проект не связан с правообладателями Black Russia.
        </p>
      </footer>
    </main>
  );
}
