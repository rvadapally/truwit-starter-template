// Pages Function to serve Angular SPA for any /app/* route
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Always try to serve the static asset first
  const origResp = await env.ASSETS.fetch(request);

  // If asset exists (not 404), return as-is
  if (origResp.status !== 404) {
    return origResp;
  }

  // For deep links under /app that 404 as static assets, serve Angular index.html
  if (url.pathname.startsWith('/app/')) {
    const last = url.pathname.split('/').pop() || '';
    const hasExt = last.includes('.') && last !== 'index.html';
    if (!hasExt) {
      const indexUrl = new URL('/app/index.html', url.origin);
      return env.ASSETS.fetch(new Request(indexUrl.toString(), request));
    }
  }

  // Fallback to original 404
  return origResp;
}
