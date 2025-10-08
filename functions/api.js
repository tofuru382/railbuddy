export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "https://railbuddy.pages.dev", // change if hosted elsewhere
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
Respond simply and clearly in English.
Respond as shortly as possible and summrize with bullet points
No need for asking follow up questions
Have some space between sentence`;

    // Ensure valid messages array
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    const messages = rawMessages.map(m => {
      if (Array.isArray(m.content)) {
        // Convert multimodal content (text + image) → plain text
        const text = m.content.map(c => 
          c.type === "text" ? c.text : "[Image attached]"
        ).join(" ");
        return { role: m.role, content: text };
      }
      return m;
    });

    if (!messages.some(m => m.role === "system")) {
      messages.unshift({ role: "system", content: systemPrompt });
    }

    // Call OpenAI without streaming
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${context.env.OPEN_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
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

    // Return full response (no streaming)
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
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
