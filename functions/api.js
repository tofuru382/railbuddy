export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    console.log("✅ Worker invoked");

    const systemPrompt = `You are a Japanese station staff helping foreign visitors.
If only an image is sent, confirm receipt and wait for a question.
Use the image and GPS data to answer questions.
Always give the conclusion first.
Respond simply and clearly in English.`;

    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.some(m => m.role === "system")) {
      messages.unshift({ role: "system", content: systemPrompt });
    }

    // ---- Try calling OpenAI ----
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${context.env.OPEN_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages,
        stream: true,
      }),
    });

    // ---- Log everything for debugging ----
    console.log("Upstream status:", resp.status);
    const preview = await resp.clone().text();
    console.log("Upstream preview:", preview.slice(0, 300));

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: preview }), {
        status: resp.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://railbuddy.pages.dev",
        },
      });
    }

    // ---- Return stream ----
    return new Response(resp.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "https://railbuddy.pages.dev",
      },
    });

  } catch (err) {
    console.error("❌ Worker error:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "https://railbuddy.pages.dev",
      },
    });
  }
}
