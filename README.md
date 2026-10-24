# FUN RUSSIA iOS Connect

<p align="center">
  <img src="./public/logo.svg" alt="FUN RUSSIA" width="72" />
</p>

**Open Source решение для перенаправления iOS-клиентов [Black Russia](https://blackrussia.online) на кастомный сервер FUN RUSSIA (`185.207.214.14:7785`) через DNS over HTTPS.**

Игроки скачивают официальное приложение Black Russia из App Store — и по умолчанию попадают на официальные сервера. FUN RUSSIA iOS Connect позволяет им за **1 минуту** и **без джейлбрейка** играть на сервере FUN RUSSIA, используя штатную возможность iOS — управляемый DNS (DoH).

---

## 💡 Почему именно DNS, а не UDP-прокси?

Black Russia построена на SA-MP, который работает **только по UDP**. Хостинги вроде **Tatnet.ru** и **Layer0.ru** (популярные у Russian-GTA-сообществ) **не поддерживают UDP-проксирование**, поэтому классическое «перенести порт на свой сервер» на iOS недоступно.

**Решение:** вместо проксирования трафика мы подменяем **DNS-ответ** для игрового домена клиента:

1. Пользователь устанавливает iOS Configuration Profile (`.mobileconfig`).
2. Профиль настраивает **DoH (DNS over HTTPS)** на наш Cloudflare Worker.
3. Worker перехватывает запросы к домену Black Russia (`play.blackrussia.online`) и возвращает IP **FUN RUSSIA**. Все остальные домены прозрачно проксируются на Cloudflare DNS (1.1.1.1).
4. Приложение Black Russia подключается к нашему серверу — трафик при этом идёт **напрямую**, без VPN и без прокси.

### 🛡️ Это безопасно

- **Это НЕ VPN.** Трафик приложений не проходит через наши серверы — подменяется только DNS-имя одной игры.
- **Никакого перехвата личных данных.** DoH-запросы шифруются HTTPS; воркер видит только запрашиваемые доменные имена (как любой DNS-сервер) и отвечает на них.
- **Удаляется в любой момент:** Настройки → Основные → VPN и управление устройством → *FUN RUSSIA DNS* → «Удалить управляющий профиль». Никаких следов.
- Open Source: весь код публичен и проверяем (MIT License).

---

## 🚀 Установка

### Для администратора (развёртывание)

**Шаг 1. Cloudflare Worker (DoH Hijacker) — бесплатно**

1. Зарегистрируйся на [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create Worker**.
2. Скопируй код из [`worker.js`](./worker.js) в редактор Worker.
3. Настрой константы в начале файла:
   - `TARGET_DOMAIN` — игровой домен Black Russia (по умолчанию `play.blackrussia.online`);
   - `FUN_RUSSIA_IP` — IP твоего сервера (по умолчанию `185.207.214.14`).
4. **Save and Deploy**, скопируй URL вида `https://funrussia-doh.<subdomain>.workers.dev`.
5. Быстрая проверка из терминала (должна вернуться A-запись с твоим IP):

   ```bash
   dig @1.1.1.1 play.blackrussia.online # реальный IP BR (для сравнения)
   # или через JSON API Cloudflare c Compare/DoH — см. RFC 8484
   curl -s -H 'accept: application/dns-json' \
     'https://<your-worker>/dns-query?...' 
   ```

**Шаг 2. Next.js приложение (генератор профилей)**

```bash
git clone https://github.com/fun-russia/ios-connect
cd ios-connect
npm install
cp .env.example .env.local
```

Открой `.env.local` и обнови `DOH_WORKER_URL` на URL своего воркера (обязательно `https://.../dns-query`):

```
DOH_WORKER_URL=https://funrussia-doh.twixoff.workers.dev/dns-query
SERVER_IP=185.207.214.14
SERVER_PORT=7785
TARGET_DOMAIN=play.blackrussia.online
```

Локальный запуск и проверка:

```bash
npm run dev
# открой http://localhost:3000
# профиль можно скачать с кнопки или напрямую: http://localhost:3000/api/profile
```

Продакшен-сборка:

```bash
npm run build
```

**Шаг 3. Деплой сайта**

- **Vercel** (рекомендуется для старта): импортируй репозиторий, добавь переменные окружения из `.env.example` в Project Settings → Environment Variables.
- **Tatnet.ru / VPS**: собери `NEXT_OUTPUT=standalone npm run build`, залей `.next/standalone` + `.next/static` на сервер, запускай `node server.js` за nginx (Next.js требует Node.js ≥ 18; статический хостинг **не подойдёт** — у нас API-роуты).
- ⚠️ Важно: сайт должен открываться **по HTTPS** — Safari отказывается устанавливать профили с HTTP-страниц.

### Для игрока (iOS)

1. Открой **Safari** (не Telegram/VK!) на сайте `[твой домен]`.
2. Нажми **«📲 Установить профиль для iOS»** и разреши загрузку.
3. **Настройки → Профиль загружен → Установить** (введи пароль экрана).
4. **ВАЖНО:** Настройки → Основные → VPN и управление устройство → включи **«FUN RUSSIA DNS»**.
5. Полностью закрой Black Russia (свайп вверх в переключателе приложений).
6. Открой Black Russia — ты на сервере **FUN RUSSIA**! 🎮

Требования: iOS 14+.

---

## 🗂 Структура проекта

```
├── worker.js                    # Cloudflare Worker: DoH-перехват (RFC 8484)
├── app/
│   ├── layout.tsx               # Корневой layout (dark theme, metadata)
│   ├── page.tsx                 # Главная: hero, инструкция, FAQ, счётчик
│   ├── globals.css              # Tailwind + фирменные стили
│   └── api/
│       ├── profile/route.ts     # Генератор .mobileconfig (com.apple.dnsSettings.managed)
│       └── status/route.ts      # UDP ping сервера + кэш 30 с
├── components/
│   ├── ConfigDownloadButton.tsx # Кнопка установки профиля с анимацией
│   ├── ServerStatus.tsx         # Индикатор онлайн/офлайн (зелёный/красный)
│   ├── StepByStepGuide.tsx      # Пошаговая инструкция с чекбоксами
│   └── Faq.tsx                  # FAQ-аккордеон
├── lib/
│   ├── config.ts                # Единая конфигурация из ENV
│   ├── mobileconfig.ts          # Генерация XML plist + crypto.randomUUID()
│   └── players.ts               # Счётчик «Уже играют» (без БД)
├── .env.example                 # Шаблон переменных окружения
├── LICENSE                      # MIT
└── README.md
```

## ⚙️ Технологии

| Слой | Технология |
|---|---|
| Фронтенд/бэкенд | Next.js 14 (App Router), React 18, TypeScript |
| Стили | TailwindCSS 3 (тёмная тема по умолчанию, mobile-first) |
| DNS | Cloudflare Workers (DoH, RFC 8484 wire-format) |
| Клиент | iOS Configuration Profile (`com.apple.dnsSettings.managed`) |

## 🔧 Конфигурация (ENV)

| Переменная | Описание | По умолчанию |
|---|---|---|
| `DOH_WORKER_URL` | URL воркера (`https://…/dns-query`) | пример |
| `SERVER_IP` | IP сервера FUN RUSSIA | `185.207.214.14` |
| `SERVER_PORT` | Порт (UDP) | `7785` |
| `TARGET_DOMAIN` | Перехватываемый домен BR | `play.blackrussia.online` |
| `GITHUB_URL` / `TELEGRAM_URL` / `TELEGRAM_CHAT_URL` | Ссылки на сайте | — |
| `BASE_PLAYERS` | База счётчика «Уже играют» | `137` |

## ❓ Troubleshooting

| Симптом | Решение |
|---|---|
| Профиль установлен, но игра не переключилась | Не включён сам профиль: Настройки → Основные → VPN и управление устройством → FUN RUSSIA DNS → включить |
| «Не удалось соединиться» при скачивании | Открывай только в Safari и только по HTTPS |
| Работает дома, не работает в гостях | Некоторые Wi-Fi сети принудительно перехватывают DNS — попробуй мобильный интернет |
| Статус сервера всегда «проверяется» | Хостинг блокирует исходящий UDP (serverless) — это нормально, индикатор просто деградирует gracefully |
| Домен BR сменился | Обнови `TARGET_DOMAIN` в воркере и `.env` — игрокам ничего переустанавливать не нужно |

## 🤝 Вклад в проект

PR приветствуются! Большие изменения — сначала через Issue.

## 📄 Лицензия

[MIT License](./LICENSE) — используй, копируй, модифици freely.

## 🆘 Поддержка

- Telegram (поддержка): [@funrussia_support](https://t.me/funrussia_support)
- Telegram (чат сервера): [@funrussia_chat](https://t.me/funrussia_chat)
- GitHub Issues: [issues](https://github.com/fun-russia/ios-connect/issues)

---

> ⚠️ **Disclaimer.** Проект не связан с правообладателями Black Russia. Решение меняет только адрес подключения клиента и не вмешивается в игровой процесс. Используйте на своё усмотрение и ознакомьтесь с правилами серверов, на которые подключаетесь.
