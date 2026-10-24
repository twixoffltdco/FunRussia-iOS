/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Выводим standalone-сервер — удобно для деплоя на Tatnet.ru / VPS
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
};

export default nextConfig;
