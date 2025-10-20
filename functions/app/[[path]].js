// Pages Function: scope to /app/* only via directory-based routing
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Try to serve the asset first (so JS/CSS/images are returned with correct MIME)
  const resp = await env.ASSETS.fetch(request);
  if (resp.status !== 404) return resp;

  // For non-asset deep links under /app, serve Angular index.html
  const last = url.pathname.split('/').pop() || '';
  const hasExt = last.includes('.') && last !== 'index.html';
  if (!hasExt) {
    const indexUrl = new URL('/app/index.html', url.origin);
    return env.ASSETS.fetch(new Request(indexUrl.toString(), request));
  }

  // Fallback to original 404
  return resp;
}

