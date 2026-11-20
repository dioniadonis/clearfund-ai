# ClearFund Claim List v2: /claim-list and /claim-list/app

This replaces the earlier plan completely. No waitlist, no upload table, no photo bucket.

## What gets built
1. **/claim-list (landing page).** Your HTML with the changes you asked for: all order and "Get my claim list" buttons go to /claim-list/app, the new pricing bullets, the new sub line and the new photo FAQ answer. It has its own nav and footer.
2. **/claim-list/app (the tool).** Five screens, one job and one big button each: Start, Show your contents, Working, Your list, Get your files. The copy is exactly what you wrote.
3. **AI list building, changes and additions.** These go through one server function that passes data through. It uses your RULES and JSON shapes, and stores nothing.
4. **Live store pricing.** Each line gets a store name, the product page link and the price read from that page. Lines with no listing say "No listing attached".
5. **Helper link.** The list is compressed into the part of the link after "#", which never reaches our server. It opens in the phone's share sheet. Helpers get "Send back", and changed lines are labeled. Helpers can't confirm, pay or download.
6. **Payment.** One-time Stripe checkout. The plan is set by line count: 1–40 is $49, 41–150 is $149, 151+ is $299. Plan, item_limit and date_of_loss go in Stripe metadata. The purchase ID is the checkout session ID, and it goes into both files.
7. **Files.** Your makeXlsx goes in exactly as written. readXlsx is extended to read the Date of loss box and the hidden "Purchase" sheet. The PDF uses your columns and footer.
8. **Reopening a saved file.** A server function looks up the purchase ID in Stripe and stores nothing. Same date of loss within 12 months means free changes. A different date means a new purchase. More lines than the plan allows means pay the difference. An unknown ID opens as unpaid.
9. **Tracking.** One anonymous events table: page views and order clicks per plan, with no personal data. Counts show in the operator area.
10. **SEO and privacy.** Each page sets its own title, description, og tags and canonical. No personal name, street address or personal phone number appears on these pages, in their tags or in the generated files.

## 1. Files and risk to existing routes
**Added**
- `src/pages/ClaimList.tsx`, `src/pages/ClaimListApp.tsx`
- `src/components/claimlist/*`: the screens, row editor, mic button, share sheet, blur, nav and footer
- `src/lib/claimList/`: `rules.ts`, `xlsx.ts` (your code plus the reader extension), `pdf.ts`, `plan.ts` (line count to plan), `share.ts` (deflate + base64url), `storage.ts` (localStorage), `sample.ts` (your 27 lines, once you paste them)
- `src/pages/operator/OperatorClaimList.tsx`
- Server functions: `claim-list-ai`, `claim-list-price`, `claim-list-checkout`, `claim-list-verify`, `claim-list-track`
- One migration: `claim_list_events` (anonymous insert through the function only, operator read)
- Tests in `tests/claimList.test.ts`: plan thresholds (40/41/150/151), xlsx round trip including date and purchase ID, editing a line clears its store and link, a typed dollar amount sets the price without an AI call, and the purchase-check rules (same date / different date / over limit / unknown ID)

**Touched**
- `src/App.tsx`: two routes above `*`, with no host guard, so they work on both hostnames
- The operator sidebar
- `AGENTS.md`: one rule saying Claim List keeps no customer data on the server and is isolated from funding code
- New packages: `exceljs@4.4.0`, `jspdf@2.5.1`, `jspdf-autotable@3.8.2`, `pako`. Each is loaded only on /claim-list/app.

**Risk to existing routes:** low. The changes are additive. The funding header, footer and pages are not touched.

**Chatbot widget:** it's a third-party script in `index.html` that loads on every page. On these two routes I'll hide its bubble whenever the page changes. If its markup changes, the bubble could come back.

**Share previews:** apps like iMessage and Facebook read only the static page tags. Links to /claim-list will keep showing the funding preview unless the site moves to server rendering.

## 2. Live store pricing (proposal)
- **Service:** Firecrawl, through Lovable's built-in connector, so you don't need a Firecrawl account or key.
- **How it works, per line:**
  1. Search for the item as "brand item size buy" across US shopping results.
  2. Keep only real product pages from known retailers (Walmart, Target, Home Depot, Lowe's, Best Buy, Wayfair, IKEA, Amazon and similar).
  3. Read up to 2 candidate pages.
  4. Take the price from the page's product data (the price the store publishes for search engines). Only if that's missing, read the price from the page itself.
  5. Prefer pages marked in stock.
  6. Pick the price closest to the AI's mid-range price, so a "middle-of-the-road" item is matched.
- **Safety:** the price always comes from the product page, never from a search snippet, and the link is always a URL we actually read. If nothing passes, the line says "No listing attached".
- **Cost:** about 1 search plus 1–2 page reads per line, roughly 3–5 Firecrawl credits per line.
  - Small list (40 lines): about 120–200 credits.
  - Major list (200 lines): about 600–1,000 credits.
  - At public Firecrawl rates, that's about $0.10–$1.00 per list. I estimated this from Firecrawl's public pricing and haven't checked it against your workspace plan.
- **Speed:** lines are priced 5–8 at a time in parallel. A 40-line list takes about 1–2 minutes, so the "about a minute" Working message is honest for small lists. Large lists keep loading prices onto the list screen as they arrive.
- **Setup you need to do:** approve linking the Firecrawl connector when I build. Nothing else.
- **Weakness:** some stores, Amazon especially, block page reading or hide prices. Those lines fall back to another store or "No listing attached". Expect roughly 70–90% of lines to get a listing, not 100%.

## 3. Stripe: what you need to do
1. In the Lovable editor chat, ask it to "set up payments with Stripe". That's the built-in option, and you don't need your own Stripe keys. I can't turn it on from here.
2. Set the business name and statement descriptor to ClearFund, as you planned.
3. Confirm the three prices: $49, $149 and $299, one-time, in USD. I'll create the products once payments is on.
4. Upgrades are charged as a one-time payment for the difference ($100 or $150, or $250 from Small to Major), with a new purchase ID that links to the old one.

**Note:** Stripe Checkout collects the buyer's email. That email lives in Stripe only, never in our database.

## 4. AI photo reading and cost
- **Model:** Gemini through Lovable AI, which reads several images per request.
- **Batches:** photos are shrunk in the browser to about 1280px wide, then sent 6–8 per request. That keeps each request small and reliable. Results are merged into one list and duplicates across batches are removed.
- **Cost:** about $0.02–$0.10 for a typical 20–40 photo list. Changing a line or adding an item costs a fraction of a cent. This is an estimate, not a measured figure.
- **Model rule:** your project has a rule naming a different model for AI writing (`openai/gpt-6-astra`). Photo reading needs a vision model, so I'd use Gemini for these functions only.

## Risks / cut from v1
- **Paywall can be bypassed.** The blur and the file creation both happen in the browser, so someone technical can see prices or build files without paying. The only real fix is creating the files on the server after checking payment, which means the list passes through the server again (still not stored). **Recommendation:** v1 creates the files on the server after Stripe confirms payment, with no storage. Tell me if you'd rather keep it browser-only.
- **The purchase date can be changed.** A hidden "Purchase" sheet can be edited, so the purchase ID is checked against Stripe on every reopen. The date of loss in Stripe wins over the date in the file.
- **Browser storage.** Clearing browser data loses an unsaved list. I'll show "Your list is only on this phone until you download it" on the list screen.
- **Your project rules conflict with this design:**
  - One rule says never to use localStorage as production storage. You've asked for it here, so I'll treat that as an exception for Claim List only.
  - Another rule says no gradients. The landing hero has one. I'll keep it unless you say flat.
  - The landing copy says "Delivered within 48 hours" and has a refund guarantee. The new tool delivers instantly. Should that copy change?
- **The mic button** works in Chrome and Safari's speech recognition only. It's hidden elsewhere.
- **Long helper links** (over about 8 KB) may break in some messaging apps. The share text points people to iMessage or email for those.
- **Cut from v1:** accounts, emailing files, saving lists on the server, coupons, automatic refunds, other currencies, and AI rewriting of notes after pricing.

## Questions
1. **Payment check:** create the files on the server after payment (recommended, harder to bypass) or in the browser only (simpler, bypassable)?
2. **Landing copy:** change "Delivered within 48 hours" and the refund guarantee to match instant download, or keep them?
3. **Photo limit:** what's the most photos per list? I'd suggest 60.
4. **Free changes after 12 months, or with a different date of loss:** is a full new purchase correct, or a discount?
5. **Paste the 27-line sample** when you approve.

`roadmap.md` gets this task added once you approve, since I can only edit the plan right now.
