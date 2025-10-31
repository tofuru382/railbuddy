export async function onRequestGet(context) {
  return new Response(JSON.stringify({ csrf: context.env.CSRF_SECRET }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "https://railbuddy.pages.dev",
    }
  });
}
