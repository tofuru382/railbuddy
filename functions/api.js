export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    console.log("✅ Worker invoked");
    console.log("Body:", body);

    if (!context.env.OPEN_AI_API_KEY) {
      console.error("❌ Missing OPEN_AI_API_KEY");
      return new Response(JSON.stringify({ error: "No API key found in env" }), { status: 500 });
    }

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${context.env.OPEN_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: body.messages || [{ role: "user", content: "Ping" }],
        stream: false,
      }),
    });

    console.log("Upstream status:", resp.status);
    const txt = await resp.text();
    console.log("Upstream response:", txt.slice(0, 300)); // only log first 300 chars

    return new Response(txt, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "https://railbuddy.pages.dev",
      },
    });
  } catch (err) {
    console.error("Worker caught error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "https://railbuddy.pages.dev",
      },
    });
  }
}
