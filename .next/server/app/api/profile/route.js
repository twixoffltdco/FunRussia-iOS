"use strict";(()=>{var e={};e.id=442,e.ids=[442],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},7946:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>m,patchFetch:()=>S,requestAsyncStorage:()=>u,routeModule:()=>d,serverHooks:()=>U,staticGenerationAsyncStorage:()=>k});var n={};t.r(n),t.d(n,{GET:()=>c,dynamic:()=>g});var a=t(9303),i=t(8716),o=t(670),s=t(7070),p=t(4068);function l(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}let y=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,g="force-dynamic";async function c(e){try{let e=function(e){let r;let{dohServerUrl:t,displayName:n="FUN RUSSIA DNS",organization:a="FUN RUSSIA Project"}=e;try{r=new URL(t)}catch{throw Error(`Некорректный DOH_WORKER_URL: "${t}"`)}if("https:"!==r.protocol)throw Error("DoH-сервер обязан работать по HTTPS (требование Apple)");let i=crypto.randomUUID(),o=crypto.randomUUID();if(!y.test(o))throw Error("Генерация UUID вернула некорректное значение");let s=new Date().toISOString().replace(/\.\d{3}Z$/,"Z");return`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<!--
  FUN RUSSIA iOS Connect — DNS profile
  Перенаправляет ${p.k.targetDomain} -> ${p.k.serverIp} через DoH.
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
					<string>${l(t)}</string>
					<key>ServerProvisioningEnrollmentUUID</key>
					<string></string>
					<key>Timeout</key>
					<integer>10</integer>
				</dict>
			</array>
			<key>PayloadDescription</key>
			<string>DNS over HTTPS профиль FUN RUSSIA для Black Russia</string>
			<key>PayloadDisplayName</key>
			<string>${l(n)}</string>
			<key>PayloadIdentifier</key>
			<string>com.funrussia.dns.${o}</string>
			<key>PayloadOrganization</key>
			<string>${l(a)}</string>
			<key>PayloadType</key>
			<string>com.apple.dnsSettings.managed</string>
			<key>PayloadUUID</key>
			<string>${o}</string>
			<key>PayloadVersion</key>
			<integer>1</integer>
		</dict>
	</array>
	<key>PayloadDescription</key>
	<string>Игроки FUN RUSSIA: перенаправление Black Russia на ${p.k.serverIp}:${p.k.serverPort}. Безопасно: подменяется только DNS одной игры.</string>
	<key>PayloadDisplayName</key>
	<string>${l(n)}</string>
	<key>PayloadIdentifier</key>
	<string>com.funrussia.profile.${i}</string>
	<key>PayloadOrganization</key>
	<string>${l(a)}</string>
	<key>PayloadRemovalDisallowed</key>
	<false/>
	<key>PayloadType</key>
	<string>Configuration</string>
	<key>PayloadUUID</key>
	<string>${i}</string>
	<key>PayloadVersion</key>
	<integer>1</integer>
	<key>PayloadCreationDate</key>
	<string>${l(s)}</string>
</dict>
</plist>
`}({dohServerUrl:p.k.dohWorkerUrl,displayName:"FUN RUSSIA DNS",organization:"FUN RUSSIA Project"}),r="FUN-RUSSIA-DNS.mobileconfig";return new s.NextResponse(e,{status:200,headers:{"Content-Type":"application/x-apple-aspen-config; charset=utf-8","Content-Disposition":`attachment; filename="${r}"; filename*=UTF-8''${encodeURIComponent(r)}`,"Content-Length":String(Buffer.byteLength(e,"utf-8")),"Cache-Control":"no-store","X-Robots-Tag":"noindex"}})}catch(r){let e=r instanceof Error?r.message:"Неизвестная ошибка генерации профиля";return s.NextResponse.json({error:"Не удалось сгенерировать профиль",details:e,hint:"Проверьте переменную окружения DOH_WORKER_URL (должна начинаться с https://)"},{status:500})}}let d=new a.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/profile/route",pathname:"/api/profile",filename:"route",bundlePath:"app/api/profile/route"},resolvedPagePath:"/workspace/app/api/profile/route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:u,staticGenerationAsyncStorage:k,serverHooks:U}=d,m="/api/profile/route";function S(){return(0,o.patchFetch)({serverHooks:U,staticGenerationAsyncStorage:k})}},4068:(e,r,t)=>{t.d(r,{k:()=>n});let n={dohWorkerUrl:process.env.DOH_WORKER_URL??"https://funrussia-doh.example.workers.dev/dns-query",serverIp:process.env.SERVER_IP??"185.207.214.14",serverPort:Number(process.env.SERVER_PORT??7785),targetDomain:process.env.TARGET_DOMAIN??"play.blackrussia.online",links:{github:process.env.GITHUB_URL??"https://github.com/fun-russia/ios-connect",telegram:process.env.TELEGRAM_URL??"https://t.me/funrussia_support",telegramChat:process.env.TELEGRAM_CHAT_URL??"https://t.me/funrussia_chat"},basePlayers:Number(process.env.BASE_PLAYERS??137)}}};var r=require("../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),n=r.X(0,[276,972],()=>t(7946));module.exports=n})();