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
If only an image is sent, say Image recived and wait for a question.
Use the image and GPS data(When needed and note that the GPS could be off) to answer questions.
Always give the conclusion first.
Respond simply extreamly short and clearly in English.`;

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
        model: "gpt-5-nano",
        messages,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("❌ OpenAI error:", data);
      return new Response(JSON.stringify({ error: data }), {
        status: resp.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://railbuddy.pages.dev",
        },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "https://railbuddy.pages.dev",
      },
    });
  } catch (err) {
    console.error("❌ Worker error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "https://railbuddy.pages.dev",
      },
    });
  }
}
