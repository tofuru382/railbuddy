

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    // ---- Station staff system prompt ----
    const systemPrompt = `
You are a Japanese station staff helping foreign visitors.
If only an image is sent, confirm receipt and wait for a question.
Use the image and GPS data to answer questions.
Always give the conclusion first.
Respond simply , shortly and clearly in English.
No need for follow-up questions
use normal spaces (" ")

multiple spaces (" ")

line breaks (\n)

markdown line breaks (double space + newline)

full paragraphs or code blocks
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
        model: "gpt-5-main",
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
