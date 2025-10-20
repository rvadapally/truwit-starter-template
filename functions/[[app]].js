// Pages Function to serve Angular SPA for any /app/* route
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/app/')) {
    // Always serve the Angular entry HTML so the router can take over
    const indexUrl = new URL('/app/index.html', url.origin);
    return env.ASSETS.fetch(new Request(indexUrl.toString(), request));
  }

  // Default: fall through to static asset or other routes
  return context.next();
}

