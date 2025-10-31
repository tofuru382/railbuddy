export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

   
    const allowedOrigin = "https://railbuddy.pages.dev";
    const requestOrigin = context.request.headers.get("Origin");

    if (requestOrigin !== allowedOrigin) {
      return new Response("CORS Error: Unauthorized origin", { status: 403 });
    }

    
    const csrfHeader = context.request.headers.get("x-csrf-token");
    const expectedToken = context.env.CSRF_SECRET; // store secret in environment variable

    if (!csrfHeader || csrfHeader !== expectedToken) {
      return new Response("CSRF validation failed", { status: 403 });
    }

    
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${context.env.OPEN_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await resp.text();


    const securityHeaders = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-csrf-token",
      "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    };

    return new Response(text, { status: resp.status, headers: securityHeaders });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://railbuddy.pages.dev",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, x-csrf-token",
        },
      }
    );
  }
}


export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "https://railbuddy.pages.dev",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-csrf-token",
      "Access-Control-Max-Age": "86400",
    },
  });
}
