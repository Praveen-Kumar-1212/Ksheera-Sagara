import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are an expert dairy farming AI assistant specializing in Indian dairy practices, particularly Karnataka and South India.

You help dairy farmers with:
- Milk production optimization and best practices
- Animal health, nutrition, and disease prevention
- Cost reduction strategies and financial advice
- Feed management and fodder optimization
- Breed selection and breeding programs
- Government schemes and subsidies for dairy farmers
- Market prices and income optimization
- Seasonal management tips

You understand both English and Kannada. If the user writes in Kannada or asks for Kannada response, reply in Kannada.

Be concise, practical, and specific to Indian dairy farming context. Use ₹ for currency. Mention specific breeds like HF, Jersey, Sahiwal, Gir, Murrah buffalo that are popular in India. Reference Karnataka government schemes when relevant.

Keep responses under 300 words. Use bullet points for actionable advice.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { message, farmContext } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    let reply = "";

    const contextStr = farmContext
      ? `\nFarm context: ${farmContext.activeCows} active cows, monthly income ₹${farmContext.monthIncome}, monthly expenses ₹${farmContext.monthExpense}.`
      : "";

    if (openaiKey) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT + contextStr },
            { role: "user", content: message },
          ],
          max_tokens: 400,
          temperature: 0.7,
        }),
      });
      const data = await response.json();
      reply = data.choices?.[0]?.message?.content || "";
    } else if (geminiKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT + contextStr }] },
            contents: [{ parts: [{ text: message }] }],
            generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
          }),
        }
      );
      const data = await response.json();
      reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      // Fallback responses when no API key
      const fallbacks = [
        "💡 **Tip:** For HF cows, ensure 3-4 times feeding per day with balanced green and dry fodder ratio of 60:40. Add mineral mixture 50-80g daily to maintain high milk production.",
        "🌾 **Feed Cost Reduction:** Grow your own fodder. Napier grass (Bajra napier hybrid) gives 200-300 tonnes/hectare annually. This can reduce feed costs by 40-50%.",
        "🥛 **Milk Quality:** Maintain fat% by adding 1-2kg groundnut cake or cotton seed in daily ration. Clean milking twice daily improves SNF levels.",
        "💰 **Income Tip:** Register with KMF (Karnataka Milk Federation) or local dairy cooperative for better prices. Average ₹32-38/liter vs ₹28-32 private buyers.",
        "🐄 **Health:** Vaccinate for FMD every 6 months, HS annually. Deworming every 3 months. Maintain health records for each cow - it helps track profitability.",
      ];
      reply = fallbacks[Math.floor(Math.random() * fallbacks.length)] + "\n\n*Note: Add an OpenAI or Gemini API key for personalized AI responses.*";
    }

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
