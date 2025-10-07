// Cloudflare Pages Function: /functions/api.js
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "https://railbuddy.pages.dev",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Vary": "Origin",
    },
  });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const systemPrompt = `You are a Japanese station staff helping foreign visitors.
If only an image is sent, confirm receipt and wait for a question.
Use the image and GPS data to answer questions.
Always give the conclusion first.
Respond simply and clearly in English.`;

    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.some(m => m.role === "system")) {
      messages.unshift({ role: "system", content: systemPrompt });
    }

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${context.env.OPEN_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages,
        stream: true,               // 👈 enable streaming
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return new Response(JSON.stringify({ error: errText || "Upstream error" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://railbuddy.pages.dev",
          "Vary": "Origin",
        },
      });
    }

    return new Response(resp.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "https://railbuddy.pages.dev",
        "Vary": "Origin",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "https://railbuddy.pages.dev",
        "Vary": "Origin",
      },
    });
  }
}
