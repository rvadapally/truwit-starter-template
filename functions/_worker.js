export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle Angular routes under /app but let static assets pass through
    if (url.pathname.startsWith('/app/')) {
      const last = url.pathname.split('/').pop() || '';
      const hasExt = last.includes('.') && last !== 'index.html';
      if (!hasExt || url.pathname === '/app/' || url.pathname === '/app') {
        const indexUrl = new URL('/app/index.html', url.origin);
        const resp = await fetch(indexUrl.toString(), { headers: request.headers });
        return new Response(resp.body, { status: 200, headers: resp.headers });
      }
    }

    // Default passthrough
    return fetch(request);
  }
};
