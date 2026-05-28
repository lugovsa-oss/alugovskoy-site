export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    const data = await request.json();

    const payload = {
      secret: env.TYPO_SECRET,
      page_url: data.page_url || "",
      selected_text: data.selected_text || "",
      comment: data.comment || "",
      user_agent: request.headers.get("user-agent") || ""
    };

    const response = await fetch(env.GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();

    return new Response(text, {
      status: response.status,
      headers: {
        "Content-Type": "application/json"
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      ok: false,
      error: String(err)
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
}

export async function onRequestGet() {
  return new Response("Typo API is alive", {
    headers: {
      "Content-Type": "text/plain"
    }
  });
}
