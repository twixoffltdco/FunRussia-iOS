/**
 * ============================================================
 *  FUN RUSSIA — DoH Hijacker (Cloudflare Worker)
 * ============================================================
 *  DNS over HTTPS прокси, который подменяет A-запись игрового
 *  домена Black Russia на IP кастомного сервера FUN RUSSIA.
 *
 *  Установка:
 *   1. dash.cloudflare.com → Workers & Pages → Create Worker
 *   2. Вставьте этот файл целиком → Save and Deploy
 *   3. Скопируйте URL воркера вида
 *      https://funrussia-doh.<subdomain>.workers.dev/dns-query
 *      и укажите его в DOH_WORKER_URL iOS-профиля.
 *
 *  Формат: RFC 8484 (DNS over HTTPS), application/dns-message.
 *  iOS Managed DNS (com.apple.dnsSettings.managed) поддерживает
 *  именно этот формат с методом GET (use-implicit-gets-default).
 * ============================================================
 */

// ----------------------------- НАСТРОЙКИ -----------------------------
/** Целевой домен Black Russia, который нужно перехватывать */
const TARGET_DOMAIN = 'play.blackrussia.online';

/** IP сервера FUN RUSSIA, на который перенаправляем клиентов */
const FUN_RUSSIA_IP = '185.207.214.14';

/** Upstream для всех остальных запросов (Cloudflare DoH JSON API) */
const UPSTREAM_DOH = 'https://cloudflare-dns.com/dns-query';

/** Кэшируем подменённые ответы 60 секунд */
const CACHE_TTL_SECONDS = 60;
// ----------------------------------------------------------------------

const encoder = new TextEncoder();

/**
 * Разбираем wire-DNS (RFC 1035) достаточно, чтобы получить
 * QNAME и QTYPE из первого вопроса.
 * @param {Uint8Array} dnsBytes
 * @returns {{ name: string, type: number } | null}
 */
function parseQuestion(dnsBytes) {
  // Header: 12 байт (ID, FLAGS, QDCOUNT, ANCOUNT, NSCOUNT, ARCOUNT)
  if (dnsBytes.length < 12) return null;
  const qdcount = (dnsBytes[4] << 8) | dnsBytes[5];
  if (qdcount < 1) return null;

  let offset = 12;
  const labels = [];

  while (offset < dnsBytes.length) {
    const len = dnsBytes[offset];
    if (len === 0) {
      offset += 1;
      break;
    }
    // Compression pointer или другое расширение не поддерживаем в вопросе
    if ((len & 0xc0) !== 0) return null;
    offset += 1;
    if (offset + len > dnsBytes.length) return null;
    labels.push(new TextDecoder().decode(dnsBytes.slice(offset, offset + len)));
    offset += len;
  }

  if (offset + 4 > dnsBytes.length) return null;
  const qtype = (dnsBytes[offset] << 8) | dnsBytes[offset + 1];

  return { name: labels.join('.').toLowerCase(), type: qtype };
}

/**
 * Собираем wire-DNS ответ с одной A-записью.
 * ID и вопрос копируются из исходного запроса (как требует DoH/RFC 8484).
 * @param {Uint8Array} queryBytes
 * @param {string} ipv4
 * @returns {Uint8Array}
 */
function buildAResponse(queryBytes, ipv4) {
  // Находим конец секции вопросов: после QNAME (оканчивается 0x00) идут QTYPE+QCLASS (4 байта)
  let qEnd = 12;
  while (qEnd < queryBytes.length && queryBytes[qEnd] !== 0) {
    qEnd += 1 + queryBytes[qEnd]; // длина метки + метка
  }
  qEnd += 1 + 4; // 0x00 терминатор + QTYPE(2) + QCLASS(2)

  const question = queryBytes.slice(0, qEnd);

  // Answer RDATA — 4 байта IPv4
  const rdata = ipv4.split('.').map((n) => parseInt(n, 10));

  const answer = new Uint8Array([
    0xc0, 0x0c, // Name: pointer к началу вопроса (offset 12)
    0x00, 0x01, // Type: A
    0x00, 0x01, // Class: IN
    (CACHE_TTL_SECONDS >> 24) & 0xff,
    (CACHE_TTL_SECONDS >> 16) & 0xff,
    (CACHE_TTL_SECONDS >> 8) & 0xff,
    CACHE_TTL_SECONDS & 0xff, // TTL
    0x00, 0x04, // RDLENGTH = 4
    ...rdata, // RDATA = IP FUN RUSSIA
  ]);

  const header = new Uint8Array(12);
  header[0] = queryBytes[0];
  header[1] = queryBytes[1]; // ID — как в запросе
  header[2] = 0x81; // Flags: QR=1, RD=1
  header[3] = 0x80; // RA=1, RCODE=0 (NOERROR)
  header[4] = 0x00;
  header[5] = 0x01; // QDCOUNT = 1
  header[6] = 0x00;
  header[7] = 0x01; // ANCOUNT = 1
  header[8] = 0x00;
  header[9] = 0x00; // NSCOUNT = 0
  header[10] = 0x00;
  header[11] = 0x00; // ARCOUNT = 0

  const out = new Uint8Array(header.length + question.length + answer.length);
  out.set(header, 0);
  out.set(question, header.length);
  out.set(answer, header.length + question.length);
  return out;
}

/** application/dns-message из Uint8Array */
function dnsResponse(bytes) {
  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/dns-message',
      'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
      'X-FUN-RUSSIA': 'doh-hijacker',
    },
  });
}

/** Прокси оригинального запроса на upstream Cloudflare DoH (RFC 8484) */
async function proxyToUpstream(request) {
  const upstreamUrl = new URL(UPSTREAM_DOH);
  for (const [k, v] of new URL(request.url).searchParams) {
    upstreamUrl.searchParams.set(k, v);
  }

  const init = {
    method: request.method,
    headers: {
      Accept: 'application/dns-message',
      'User-Agent': 'FUN-RUSSIA-DoH/1.0',
    },
    body: request.method === 'POST' ? await request.arrayBuffer() : undefined,
  };

  try {
    const res = await fetch(upstreamUrl.toString(), init);
    // Просто передаём ответ клиенту (iOS сам разберёт wire-format)
    return new Response(res.body, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'application/dns-message',
        'Cache-Control': 'public, max-age=30',
      },
    });
  } catch (e) {
    // Upstream недоступен — отдаём 502, iOS корректно обработает ошибку DNS
    return new Response(encoder.encode('DNS upstream error'), { status: 502 });
  }
}

/** Читаем DNS-сообщение из GET(?dns=base64url) или POST(body) */
async function readDnsBytes(request) {
  const url = new URL(request.url);
  const dnsParam = url.searchParams.get('dns');
  if (dnsParam) {
    // base64url без паддинга
    const b64 = dnsParam.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '='));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  if (request.method === 'POST') {
    return new Uint8Array(await request.arrayBuffer());
  }
  return null;
}

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Основной обработчик.
 * @param {Request} request
 */
async function handleRequest(request) {
  const url = new URL(request.url);

  // CORS preflight для веб-тестов
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Человек открыл worker в браузере — показываем информацию
  if (!url.pathname.startsWith('/dns-query') && request.headers.get('Accept')?.includes('text/html')) {
    return new Response(
      `<!doctype html><html lang="ru"><head><meta charset="utf-8">
       <title>FUN RUSSIA DoH</title><meta name="viewport" content="width=device-width,initial-scale=1">
       <style>body{background:#0a0a0f;color:#e6e6ee;font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0}
       .c{text-align:center;padding:24px}h1{color:#e63946}code{background:#14141c;padding:2px 8px;border-radius:6px}</style></head>
       <body><div class="c"><h1>⚡ FUN RUSSIA DoH Worker</h1>
       <p>Эндпоинт: <code>${url.origin}/dns-query</code></p>
       <p>Перехват: <code>${TARGET_DOMAIN}</code> → <code>${FUN_RUSSIA_IP}</code></p>
       <p>Это DNS-сервер, а не сайт. Подключите его через iOS-профиль.</p>
       </div></body>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  const dnsBytes = await readDnsBytes(request);
  if (!dnsBytes) {
    return new Response(encoder.encode('Missing DNS message'), { status: 400 });
  }

  const question = parseQuestion(dnsBytes);

  // Перехват целевого домена (и любых поддоменов, например server.play.blackrussia.online)
  const isTarget =
    question &&
    (question.name === TARGET_DOMAIN || question.name.endsWith(`.${TARGET_DOMAIN}`));

  if (isTarget) {
    // Type 1 = A (IPv4). Для AAAA (28) возвращаем пустой NOERROR-ответ,
    // чтобы iOS/iPhone выбрал IPv4-путь (SA-MP работает только по IPv4 UDP).
    if (question.type === 1) {
      return dnsResponse(buildAResponse(dnsBytes, FUN_RUSSIA_IP));
    }
    if (question.type === 28) {
      // Пустой ответ: ANCOUNT=0, тот же вопрос
      const header = dnsBytes.slice(0, 12).slice();
      header[2] = 0x81;
      header[3] = 0x80;
      header[6] = 0x00;
      header[7] = 0x00; // ANCOUNT = 0
      return dnsResponse(header);
    }
  }

  // Всё остальное — прозрачный прокси на Cloudflare DNS (1.1.1.1)
  return proxyToUpstream(request);
}
