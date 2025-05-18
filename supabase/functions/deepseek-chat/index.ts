
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      throw new Error('DeepSeek API key not found');
    }

    const { message } = await req.json();

    console.log("Received message:", message);
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a financial advisor specialised in AI business financing. Answer in plain text only, no markdown or symbols. Use at most two sentences or two bullet points (•). Treat the current date as May 18, 2025."
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.2,    // allows faster, "good-enough" sampling
        max_tokens: 120,     // ≈ 80–90 words, perfect for 2 sentences + bullets
        stop: ["\n\n"],      // cut off after the first paragraph/break
        frequency_penalty: 0.0,
        presence_penalty: 0.0
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("DeepSeek API error:", errorData);
      
      // Check for specific error cases
      if (response.status === 402 && errorData.includes("Insufficient Balance")) {
        return new Response(JSON.stringify({ 
          error: "Your DeepSeek account has insufficient balance. Please add credits to your DeepSeek account and try again.",
          errorCode: "INSUFFICIENT_BALANCE"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 402,
        });
      }
      
      throw new Error(`DeepSeek API returned ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    console.log("DeepSeek response:", data);
    
    const generatedText = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      errorType: error.name || "UnknownError"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
