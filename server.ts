const assets: Record<string, string> = {
  '/': 'dist/index.html',
  '/index.html': 'dist/index.html',
  '/main.js': 'dist/main.js',
  '/app.css': 'dist/app.css',
};
const server = Bun.serve({
  hostname: '127.0.0.1',
  port: Number(process.env.PORT || 3002),
  async fetch(request) {
    const path = assets[new URL(request.url).pathname];
    if (!path || !['GET', 'HEAD'].includes(request.method)) return new Response('Not found', { status: 404 });
    const file = Bun.file(path);
    if (!(await file.exists())) return new Response('Run bun run build first.', { status: 503 });
    return new Response(request.method === 'HEAD' ? null : file, {
      headers: {
        'Content-Type': file.type,
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src https://discord.com https://canary.discord.com https://ptb.discord.com https://discordapp.com; img-src 'self' data: blob:; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
      },
    });
  },
});
console.log(`Webhook Studio ready at ${server.url}`);
