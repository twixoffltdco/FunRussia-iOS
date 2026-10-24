'use client';

import { useState } from 'react';

interface FaqItem {
  q: string;
  a: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'Почему не работает?',
    a: 'Чек-лист: 1) Профиль установлен, но НЕ включён — зайдите в Настройки → Основные → VPN и управление устройством → FUN RUSSIA DNS и включите переключатель. Это причина №1. 2) Black Russia не была полностью закрыта (свайп вверх в переключателе приложений). 3) Страница открывалась не в Safari, а во встроенном браузере Telegram/VK — профиль тогда не устанавливается. 4) Вы подключены к Wi-Fi с «жестким» DNS (некоторые корпоративные сети) — попробуйте мобильный интернет.',
  },
  {
    q: 'Как удалить профиль?',
    a: 'В любой момент: Настройки → Основные → VPN и управление устройством → FUN RUSSIA DNS → «Удалить управляющий профиль». После удаления игра снова будет подключаться к официальным серверам Black Russia. Никаких следов на устройстве не остаётся.',
  },
  {
    q: 'Безопасно ли это?',
    a: 'Да. Это НЕ VPN: ваш трафик идёт напрямую на сервер игры, как обычно. Профиль меняет только способ разрешения ОДНОГО домена (play.blackrussia.online) — вместо официального IP вы получаете IP сервера FUN RUSSIA. Пароли, переписка и данные других приложений не перехватываются: DoH-запросы шифруются HTTPS, а воркер не видит содержимого вашего трафика — только DNS-имена.',
  },
  {
    q: 'Почему нельзя просто проксировать UDP?',
    a: 'SA-MP (движок Black Russia) работает по UDP. Хостинги вроде Tatnet.ru и Layer0.ru не поддерживают UDP-проксирование для статических тарифов, поэтому классический «перенос порта» невозможен. DNS-перехват через DoH обходит это ограничение: игроку не нужен прокси вообще — меняется только адрес, который получает приложение.',
  },
  {
    q: 'Забанят ли меня за это?',
    a: 'Мы не модифицируем клиент игры и не вмешиваемся в игровой процесс — меняется лишь адрес подключения через штатную функцию iOS («Private DNS / DoH»). Такие же настройки используют родители для блокировки рекламы. Тем не менее используйте решение на своё усмотрение: это open source инструмент, а не официальная фича Black Russia.',
  },
  {
    q: 'Что если официальный домен изменится?',
    a: 'Администратору достаточно поменять TARGET_DOMAIN в Cloudflare Worker и в .env сайта — пересборка не требуется. Игрокам ничего переустанавливать не нужно: профиль указывает на воркер, а правила живут на воркере.',
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section aria-label="Частые вопросы" className="space-y-4">
      <h2 className="text-xl font-bold text-white">❓ Частые вопросы</h2>
      <div className="divide-y divide-brand-border overflow-hidden rounded-2xl border border-brand-border bg-brand-card">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = open === i;
          return (
            <details key={i} open={isOpen} className="group">
              <summary
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(isOpen ? null : i);
                }}
                className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-medium text-zinc-100 transition-colors hover:bg-white/5"
              >
                <span>{item.q}</span>
                <span
                  className={`shrink-0 text-zinc-500 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden
                >
                  ▾
                </span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-400">{item.a}</p>
            </details>
          );
        })}
      </div>
    </section>
  );
}
