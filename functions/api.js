export default {
  async fetch(request, env) {
    try {
      const body = await request.json();

      // ✅ Automatically inject your station-staff prompt if not present
      const systemPrompt = `You are a Japanese station staff helping foreign visitors.
If only an image is sent, confirm receipt and wait for a question.
Use the image and GPS data to answer questions.
Always give the conclusion first.
Respond simply and clearly in English.`;

      if (Array.isArray(body.messages)) {
        const hasSystem = body.messages.some(m => m.role === "system");
        if (!hasSystem) {
          body.messages.unshift({ role: "system", content: systemPrompt });
        }
      } else {
        body.messages = [{ role: "system", content: systemPrompt }];
      }

      // ✅ Model defaults
      const model = body.model || "gpt-5-mini";

      // ✅ Request streaming from OpenAI
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OPEN_AI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: body.messages,
          stream: true,
          temperature: 0.4,
          top_p: 0.8,
        }),
      });

      // ✅ Stream OpenAI output directly to the client (no buffering)
      return new Response(resp.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "https://railbuddy.pages.dev",
        },
      });

    } catch (err) {
      console.error("❌ API Worker error:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://railbuddy.pages.dev",
        },
      });
    }
  }
};
