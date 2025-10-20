export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle Angular routes under /app by always serving /app/index.html
    if (url.pathname.startsWith('/app/')) {
      const indexUrl = new URL('/app/index.html', url.origin);
      const resp = await fetch(indexUrl.toString(), {
        headers: request.headers,
      });
      return new Response(resp.body, {
        status: 200,
        headers: resp.headers,
      });
    }

    // Default passthrough
    return fetch(request);
  }
};

