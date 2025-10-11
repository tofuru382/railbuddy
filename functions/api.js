

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    // ---- Station staff system prompt ----
    const systemPrompt = `
You are a Japanese station staff assisting foreign visitors focusing on LED signs and ticket machines. If only an image is sent, wait.  Use image and GPS to answer. Start with the conclusion; keep replies short.
Details only needed when user asks
 `;

    // ---- Inject prompt if missing ----
    if (Array.isArray(body.messages)) {
      const hasSystem = body.messages.some(m => m.role === "system");
      if (!hasSystem) {
        body.messages.unshift({ role: "system", content: systemPrompt });
      }
    } else {
      body.messages = [{ role: "system", content: systemPrompt }];
    }

    // ---- Send request to OpenAI (no unsupported parameters) ----
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
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://railbuddy.pages.dev",
        },
      });
    }

    // ---- Return response to client ----
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "https://railbuddy.pages.dev",
      },
    });

  } catch (err) {
    console.error("Worker error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "https://railbuddy.pages.dev",
      },
    });
  }
}
