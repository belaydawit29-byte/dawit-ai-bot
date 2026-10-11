
export default async (request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405
    });
  }

  try {
    const update = await request.json();
    const message = update.message;

    if (!message?.text || !message.chat?.id) {
      return new Response("OK");
    }

    const token = Netlify.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = message.chat.id;
    const text = message.text;

    if (!token) {
      return new Response("Missing bot token", {
        status: 500
      });
    }

    if (text === "/start") {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "ሰላም! ወደ Dawit AI በደህና መጡ። ጥያቄህን ላክልኝ።"
        })
      });

      return new Response("OK");
    }

    const site = Netlify.env.get("DAWIT_AI_URL");

    if (!site) {
      return new Response("Missing AI URL", {
        status: 500
      });
    }

    const aiResponse = await fetch(site, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await aiResponse.json();
    const reply = data.reply || data.output_text || data.error ||
      "ይቅርታ፣ መልስ ማግኘት አልቻልኩም።";

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: String(reply).slice(0, 4000)
      })
    });

    return new Response("OK");
  } catch (error) {
    return new Response("Internal Server Error", {
      status: 500
    });
  }
};
