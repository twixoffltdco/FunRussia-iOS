/**
 * Общая конфигурация проекта FUN RUSSIA iOS Connect.
 * Значения берутся из переменных окружения (.env / .env.local),
 * по умолчанию — рабочие значения сервера FUN RUSSIA.
 */

export const CONFIG = {
  /** URL Cloudflare Worker'а (DoH-эндпоинт) */
  dohWorkerUrl:
    process.env.DOH_WORKER_URL ??
    'https://funrussia-doh.example.workers.dev/dns-query',

  /** IP игрового сервера FUN RUSSIA */
  serverIp: process.env.SERVER_IP ?? '185.207.214.14',

  /** Порт игрового сервера FUN RUSSIA (SA-MP, UDP) */
  serverPort: Number(process.env.SERVER_PORT ?? 7785),

  /** Официальный игровой домен Black Russia, который перехватываем */
  targetDomain: process.env.TARGET_DOMAIN ?? 'play.blackrussia.online',

  /** Ссылки */
  links: {
    github: process.env.GITHUB_URL ?? 'https://github.com/fun-russia/ios-connect',
    telegram: process.env.TELEGRAM_URL ?? 'https://t.me/funrussia_support',
    telegramChat: process.env.TELEGRAM_CHAT_URL ?? 'https://t.me/funrussia_chat',
  },

  /** "Уже играют" — базовое число + имитация активности (см. lib/players.ts) */
  basePlayers: Number(process.env.BASE_PLAYERS ?? 137),
};
