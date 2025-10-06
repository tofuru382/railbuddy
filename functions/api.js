export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    // ---- System prompt (station staff role) ----
    const systemPrompt = `You are a Japanese station staff helping foreign visitors.
If only an image is sent, confirm receipt and wait for a question.
Use the image and GPS data to answer questions.
Always give the conclusion first.
Respond simply and clearly in English.`;

    // ---- Inject prompt if not included ----
    if (Array.isArray(body.messages)) {
      const hasSystem = body.messages.some(m => m.role === "system");
      if (!hasSystem) {
        body.messages.unshift({ role: "system", content: systemPrompt });
      }
    } else {
      body.messages = [{ role: "system", content: systemPrompt }];
    }

    // ---- Call OpenAI ----
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${context.env.OPEN_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: body.messages,
        temperature: 0.4,
        top_p: 0.8,
      }),
    });

    // ---- Parse response ----
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
