import { CONFIG } from '@/lib/config';

/**
 * Генератор iOS Configuration Profile (.mobileconfig) с Managed DNS Settings.
 * Формат: XML plist (Apple Configuration Profile schema).
 *
 * PayloadType com.apple.dnsSettings.managed требует iOS 14+.
 * DoH-режим: DNSTransport = HTTPS, метод — implicit GET (RFC 8484),
 * что полностью совместимо с Cloudflare Worker'ом из /worker.js.
 */

/** Экранирование значений для XML */
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface MobileconfigOptions {
  /** DoH-эндпоинт Cloudflare Worker'а (обязательно https://) */
  dohServerUrl: string;
  /** Название профиля на устройстве */
  displayName?: string;
  /** Организация в профиле */
  organization?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Генерирует .mobileconfig (XML plist) как строку.
 * Бросает Error, если DoH URL некорректен (профиль обязан быть HTTPS).
 */
export function generateMobileconfig(options: MobileconfigOptions): string {
  const {
    dohServerUrl,
    displayName = 'FUN RUSSIA DNS',
    organization = 'FUN RUSSIA Project',
  } = options;

  // Apple требует HTTPS для DoH и валидный домен в URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(dohServerUrl);
  } catch {
    throw new Error(`Некорректный DOH_WORKER_URL: "${dohServerUrl}"`);
  }
  if (parsedUrl.protocol !== 'https:') {
    throw new Error('DoH-сервер обязан работать по HTTPS (требование Apple)');
  }

  // Уникальные идентификаторы профиля (crypto.randomUUID — Node 19+/Edge)
  const configUUID = crypto.randomUUID();
  const payloadUUID = crypto.randomUUID();
  if (!UUID_REGEX.test(payloadUUID)) {
    throw new Error('Генерация UUID вернула некорректное значение');
  }

  const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'); // Apple prefers no millis

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<!--
  FUN RUSSIA iOS Connect — DNS profile
  Перенаправляет ${CONFIG.targetDomain} -> ${CONFIG.serverIp} через DoH.
  Не является VPN. Не перехватывает трафик приложений.
  Удалить: Настройки -> Основные -> VPN и управление устройством.
-->
<plist version="1.0">
<dict>
	<key>PayloadContent</key>
	<array>
		<dict>
			<key>DNSSettingsArray</key>
			<array>
				<dict>
					<key>DNSTransport</key>
					<string>HTTPS</string>
					<key>ServerURL</key>
					<string>${xmlEscape(dohServerUrl)}</string>
					<key>ServerProvisioningEnrollmentUUID</key>
					<string></string>
					<key>Timeout</key>
					<integer>10</integer>
				</dict>
			</array>
			<key>PayloadDescription</key>
			<string>DNS over HTTPS профиль FUN RUSSIA для Black Russia</string>
			<key>PayloadDisplayName</key>
			<string>${xmlEscape(displayName)}</string>
			<key>PayloadIdentifier</key>
			<string>com.funrussia.dns.${payloadUUID}</string>
			<key>PayloadOrganization</key>
			<string>${xmlEscape(organization)}</string>
			<key>PayloadType</key>
			<string>com.apple.dnsSettings.managed</string>
			<key>PayloadUUID</key>
			<string>${payloadUUID}</string>
			<key>PayloadVersion</key>
			<integer>1</integer>
		</dict>
	</array>
	<key>PayloadDescription</key>
	<string>Игроки FUN RUSSIA: перенаправление Black Russia на ${CONFIG.serverIp}:${CONFIG.serverPort}. Безопасно: подменяется только DNS одной игры.</string>
	<key>PayloadDisplayName</key>
	<string>${xmlEscape(displayName)}</string>
	<key>PayloadIdentifier</key>
	<string>com.funrussia.profile.${configUUID}</string>
	<key>PayloadOrganization</key>
	<string>${xmlEscape(organization)}</string>
	<key>PayloadRemovalDisallowed</key>
	<false/>
	<key>PayloadType</key>
	<string>Configuration</string>
	<key>PayloadUUID</key>
	<string>${configUUID}</string>
	<key>PayloadVersion</key>
	<integer>1</integer>
	<key>PayloadCreationDate</key>
	<string>${xmlEscape(now)}</string>
</dict>
</plist>
`;
}
