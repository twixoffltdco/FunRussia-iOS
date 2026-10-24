import { NextRequest, NextResponse } from 'next/server';
import { generateMobileconfig } from '@/lib/mobileconfig';
import { CONFIG } from '@/lib/config';

/**
 * GET /api/profile
 * Генерирует и отдаёт iOS Configuration Profile (.mobileconfig).
 * Server-side (Node/Web runtime) — UUID создаётся на сервере через crypto.randomUUID().
 */

// Профиль генерируется динамически при каждом запросе
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const plist = generateMobileconfig({
      dohServerUrl: CONFIG.dohWorkerUrl,
      displayName: 'FUN RUSSIA DNS',
      organization: 'FUN RUSSIA Project',
    });

    const fileName = 'FUN-RUSSIA-DNS.mobileconfig';

    return new NextResponse(plist, {
      status: 200,
      headers: {
        // Apple MDM content-type для profiles
        'Content-Type': 'application/x-apple-aspen-config; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Content-Length': String(Buffer.byteLength(plist, 'utf-8')),
        'Cache-Control': 'no-store',
        // Safari на iOS должен предлагать установку профиля, а не скачивание как файл
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Неизвестная ошибка генерации профиля';

    return NextResponse.json(
      {
        error: 'Не удалось сгенерировать профиль',
        details: message,
        hint: 'Проверьте переменную окружения DOH_WORKER_URL (должна начинаться с https://)',
      },
      { status: 500 },
    );
  }
}
