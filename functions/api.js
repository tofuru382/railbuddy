export async function onRequestPost(context) {
  try {
    // Parse incoming JSON
    const body = await context.request.json();

    // ✅ CSRF check (optional but recommended)
    const clientToken = context.request.headers.get("x-csrf-token");
    const serverToken = context.env.CSRF_SECRET;
    if (!clientToken || clientToken !== serverToken) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing CSRF token" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ System prompt (your specified version)
    const systemPrompt = `You are a Japanese station staff helping foreign visitors.
If only an image is sent, confirm receipt and wait for a question.
Use the image and GPS data to answer questions.
Always give the conclusion first.
Respond simply, shortly, and clearly in English.
No need for follow-up questions.
Each line should be about 50 characters long.
Please take that into account and provide an easy-to-read response.`;

    // ✅ Ensure messages array exists
    let messages = Array.isArray(body.messages)
      ? body.messages
      : [{ role: "user", content: [{ type: "text", text: "Hello" }] }];

    // Insert system prompt if missing
    const hasSystem = messages.some(m => m.role === "system");
    if (!hasSystem) {
      messages.unshift({ role: "system", content: systemPrompt });
    }

    // ✅ Construct valid request for OpenAI
    const payload = {
      model: body.model || "gpt-5-mini",
      messages,
    };

    // 🔧 Send request to OpenAI
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${context.env.OPEN_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Parse OpenAI response
    const data = await resp.json();

    if (!resp.ok) {
      console.error("OpenAI API Error:", data);
      return new Response(JSON.stringify({ error: data.error || data }), {
        status: resp.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://railbuddy.pages.dev",
        },
      });
    }

    // ✅ Return response to front-end
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
