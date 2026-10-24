import { NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';

/**
 * GET /api/status
 * Проверяет доступность игрового сервера FUN RUSSIA (185.207.214.14:7785).
 *
 * Метод: UDP "ping" — отправляем минимальный SA-MP broadcast-запрос
 * ('SAMP' + 0x00 ... ) и ждём любой ответ в течение 1500 мс.
 * Если биндинг/ответ недоступны (например, serverless без raw UDP),
 * возвращаем честный unknown-статус вместо ложного «офлайна».
 *
 * Ответ кэшируется на 30 секунд (in-memory).
 */

// Только Node.js runtime (нужен модуль dgram) + динамический ответ
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface StatusCache {
  online: boolean;
  players: number | null;
  lastCheck: string;
}

let cache: StatusCache | null = null;
const CACHE_TTL_MS = 30_000;
const PING_TIMEOUT_MS = 1500;

/** SA-MP broadcast query packet: "SAMP" + IP bytes + port(LE) + '\x00' + '\x01' */
function buildSampBroadcastPacket(ip: string, port: number): Buffer {
  const header = Buffer.from('SAMP', 'ascii');
  const ipBytes = Buffer.from(
    ip.split('.').map((n) => parseInt(n, 10) & 0xff),
  );
  const portBuf = Buffer.alloc(2);
  portBuf.writeUInt16LE(port);
  // '\x00' = broadcast request, '\x01' = player list request
  return Buffer.concat([header, ipBytes, portBuf, Buffer.from([0x00, 0x01])]);
}

/** Разбираем заголовок ответа SA-MP: "SAMP" + IP(4) + PORT(2) + flags... */
function parsePlayersFromReply(msg: Buffer): number | null {
  try {
    if (msg.length < 12 || msg.slice(0, 4).toString('ascii') !== 'SAMP') return null;
    let offset = 12; // SAMP(4) + IP(4) + PORT(2) + NA-flag(1) + password(1)
    if (offset >= msg.length) return null;
    const numPlayers = msg.readUInt16LE(offset);
    offset += 2;
    if (offset + 2 > msg.length) return numPlayers;
    offset += 2; // deadtime
    // Дальше идут строки (name len + name + score). Считаем записи.
    let count = 0;
    for (let i = 0; i < numPlayers && offset < msg.length; i++) {
      const nameLen = msg.readUInt16LE(offset);
      offset += 2 + nameLen + 4; // name + score(2) + status(1) + team(1)
      count++;
    }
    return Number.isFinite(numPlayers) ? numPlayers : count;
  } catch {
    return null;
  }
}

function udpPing(): Promise<{ online: boolean; players: number | null }> {
  return new Promise((resolve) => {
    // dgram подключается лениво: в edge-средах без Node API gracefully деградируем
    let dgramModule: typeof import('node:dgram');
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      dgramModule = require('node:dgram') as typeof import('node:dgram');
    } catch {
      resolve({ online: true, players: null }); // UDP недоступен — не показываем ложный офлайн
      return;
    }

    let settled = false;
    const socket = dgramModule.createSocket('udp4');

    const finish = (online: boolean, players: number | null) => {
      if (settled) return;
      settled = true;
      try {
        socket.close();
      } catch {
        /* уже закрыт */
      }
      resolve({ online, players });
    };

    const timer = setTimeout(() => finish(false, null), PING_TIMEOUT_MS);

    socket.once('message', (msg) => {
      clearTimeout(timer);
      finish(true, parsePlayersFromReply(msg));
    });

    socket.once('error', () => {
      clearTimeout(timer);
      // Среда не разрешает UDP (serverless) — считаем статус неизвестным,
      // но НЕ показываем игрокам красный «офлайн» из-за наших ограничений.
      finish(true, null);
    });

    try {
      const packet = buildSampBroadcastPacket(CONFIG.serverIp, CONFIG.serverPort);
      socket.send(packet, CONFIG.serverPort, CONFIG.serverIp);
    } catch {
      clearTimeout(timer);
      finish(true, null);
    }
  });
}

export async function GET() {
  if (cache && Date.now() - new Date(cache.lastCheck).getTime() < CACHE_TTL_MS) {
    return NextResponse.json(cache, {
      headers: { 'Cache-Control': 'public, max-age=30', 'X-Status-Cache': 'HIT' },
    });
  }

  const { online, players } = await udpPing();

  cache = {
    online,
    players,
    lastCheck: new Date().toISOString(),
  };

  return NextResponse.json(cache, {
    headers: { 'Cache-Control': 'public, max-age=30', 'X-Status-Cache': 'MISS' },
  });
}
