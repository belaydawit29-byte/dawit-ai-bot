exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };

  const send = (statusCode, data) => ({
    statusCode,
    headers,
    body: JSON.stringify(data)
  });

  if (event.httpMethod !== "POST") {
    return send(405, { error: "Only POST requests are allowed." });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return send(500, {
        error: "OPENAI_API_KEY is missing in Netlify environment variables."
      });
    }

    const body = JSON.parse(event.body || "{}");
    const message = body.message;

    if (!message || typeof message !== "string") {
      return send(400, { error: "Please enter a message." });
    }

    if (message.length > 12000) {
      return send(400, { error: "Message is too long." });
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are DAWIT AI, a helpful and intelligent AI assistant. Reply in the same language as the user. Understand and write natural Amharic and English. Give accurate, friendly, clear and useful answers. If the user asks in Amharic, answer in Amharic."
            },
            {
              role: "user",
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 1200
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return send(response.status, {
        error: result.error?.message || "OpenAI API request failed."
      });
    }

    const reply = result.choices?.[0]?.message?.content;

    if (!reply) {
      return send(500, { error: "AI did not return a response." });
    }

    return send(200, { reply: reply });

  } catch (error) {
    return send(500, {
      error: "DAWIT AI error: " + error.message
    });
  }
};
