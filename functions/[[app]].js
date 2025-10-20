// Pages Function to serve Angular SPA for any /app/* route
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Only rewrite SPA routes, not static assets like .js/.css/.png etc.
  if (url.pathname.startsWith('/app/')) {
    const last = url.pathname.split('/').pop() || '';
    const hasExt = last.includes('.') && last !== 'index.html';

    if (!hasExt || url.pathname === '/app/' || url.pathname === '/app') {
      const indexUrl = new URL('/app/index.html', url.origin);
      return env.ASSETS.fetch(new Request(indexUrl.toString(), request));
    }
  }

  // Default: let static assets and other routes pass through
  return env.ASSETS.fetch(request);
}
