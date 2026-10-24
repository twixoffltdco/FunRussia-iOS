import { CONFIG } from './config';

/**
 * Простейший детерминированный счётчик игроков "Уже играют".
 * Без базы данных: число плавно "дышит" в зависимости от времени суток,
 * оставаясь правдоподобным для небольшого проекта.
 * При желании замените на реальную статистику (Redis / SA-MP Query).
 */

/** Детерминированный псевдослучайный hash (для стабильного SSR-рендеринга) */
function hashToNumber(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function getOnlinePlayersCount(now: Date = new Date()): number {
  const hour = (now.getUTCHours() + 3) % 24; // примерное московское время

  // Суточный график: минимум ночью, максимум вечером
  const dailyCurve = 0.55 + 0.45 * Math.sin(((hour - 8) / 24) * Math.PI + Math.PI / 3);
  const jitter = (hashToNumber(now.toISOString().slice(0, 13)) % 15) - 7; // ±7 по часам

  const count = Math.round(CONFIG.basePlayers * dailyCurve) + jitter;
  return Math.max(12, count);
}
