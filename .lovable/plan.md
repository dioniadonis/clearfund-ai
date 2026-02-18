

# Replace DeepSeek with Lovable AI on Lovable Cloud

## What's Happening Now
The DeepSeek API powers the "Clearfund AI Financial Advisor" chat widget on your homepage. It requires a separate `DEEPSEEK_API_KEY` and calls an external API you have to manage and pay for independently.

## What Changes

### 1. Enable Lovable Cloud
This sets up your new managed backend — no external Supabase account needed.

### 2. Replace the Edge Function
Rewrite `supabase/functions/deepseek-chat/index.ts` to use the **Lovable AI Gateway** instead of DeepSeek. This uses the pre-configured `LOVABLE_API_KEY` (automatically available — no setup needed from you).

The system prompt stays the same — your AI advisor will still act as a Clearfund financial advisor with the same personality and knowledge.

### 3. Update the Chat Interface
Update `src/components/ChatInterface.tsx` to:
- Use the Supabase client or environment variables instead of a hardcoded URL
- Improve the streaming SSE parser for reliability
- Remove the hardcoded API key from the frontend code (security improvement)

### 4. Remove DeepSeek Dependency
- No `DEEPSEEK_API_KEY` secret needed
- No external API costs for the chat feature

## What Stays the Same
- The chat widget looks and works exactly the same for visitors
- Same AI financial advisor personality and responses
- Same streaming text experience
- All other site pages and features unchanged

## Technical Details
- Edge function switches from `https://api.deepseek.com` to `https://ai.gateway.lovable.dev`
- Default model: `google/gemini-3-flash-preview` (fast, capable, included with Lovable)
- Auth key: `LOVABLE_API_KEY` (auto-provisioned, no action needed from you)
- Frontend will use `import.meta.env.VITE_SUPABASE_URL` instead of hardcoded URLs

