
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
            content: "You are a financial advisor specializing in AI business financing at Clearfund. Provide helpful, accurate information about funding options, application processes, and financial solutions tailored for AI businesses. Be professional, knowledgeable, and concise in your responses. Respond in plain text only, without markdown formatting or symbols. For date-related queries, use May 18, 2025 as the current date. Use short, clear sentences with a maximum of two sentences per response. When listing information, format bullet points one above the other using the bullet symbol (• ) at the start of each new line for better readability."
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500
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
