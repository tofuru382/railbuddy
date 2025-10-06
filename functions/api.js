async function askGPTStream() {
  try {
    const resp = await fetch("/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-5-mini", messages: chatHistory.slice(-20) }),
    });

    if (!resp.ok || !resp.body) {
      addMsg("⚠️ Network or API error.", "bot");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    let partial = "";
    const typingBubble = addTyping();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const jsonData = trimmed.replace(/^data:\s*/, "");

        if (jsonData === "[DONE]") {
          chat.removeChild(typingBubble.parentElement);
          const clean = text.trim() || "⚠️ No response.";
          chatHistory.push({ role: "assistant", content: clean });
          saveHistory();
          addMsg(clean, "bot");
          return;
        }

        try {
          const data = JSON.parse(jsonData);
          const delta = data.choices?.[0]?.delta?.content;
          if (delta) {
            text += delta;
            typingBubble.textContent = text;
            chat.scrollTop = chat.scrollHeight;
          }
        } catch {
          // ignore incomplete JSON chunks
        }
      }
    }

  } catch (e) {
    addMsg("⚠️ " + e.message, "bot");
  }
}
