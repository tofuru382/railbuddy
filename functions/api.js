export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const allowedOrigin = "https://railbuddy.pages.dev";
    const origin = context.request.headers.get("Origin");
    if (origin !== allowedOrigin) {
      return new Response("CORS Error: Unauthorized origin", { status: 403 });
    }

    const csrfHeader = context.request.headers.get("x-csrf-token");
    const expectedToken = context.env.CSRF_SECRET;
    if (!csrfHeader || csrfHeader !== expectedToken) {
      return new Response("CSRF validation failed", { status: 403 });
    }

    const systemPrompt = `
You are a Japanese station staff helping foreign visitors.
If only an image is sent, confirm receipt and wait for a question.
Use the image and GPS data to answer questions.
Always give the conclusion first.
Respond simply, shortly, and clearly in English.
No need for follow-up questions.
Use normal spaces (" "), multiple spaces ("  "), and line breaks (\\n).
You may also use markdown line breaks (double space + newline) or full paragraphs.
    `;

    if (Array.isArray(body.messages)) {
      const hasSystem = body.messages.some(m => m.role === "system");
      if (!hasSystem) body.messages.unshift({ role: "system", content: systemPrompt });
    } else {
      body.messages = [{ role: "system", content: systemPrompt }];
    }

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${context.env.OPEN_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: body.messages,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("OpenAI API error:", data);
      return new Response(JSON.stringify({ error: data.error || data }), {
        status: resp.status,
        headers: getSecurityHeaders(allowedOrigin),
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: getSecurityHeaders(allowedOrigin),
    });

  } catch (err) {
    console.error("Worker error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: getSecurityHeaders("https://railbuddy.pages.dev"),
    });
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

function getSecurityHeaders(origin) {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-csrf-token",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}
