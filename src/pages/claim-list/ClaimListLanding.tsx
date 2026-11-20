// ClearFund Claim List landing page. Price is set by list size at checkout, so every button starts a list.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./claimList.css";
import { track } from "@/lib/claimList";

const ROOMS: { name: string; rows: [string, number, string, number, string][] }[] = [
  { name: "Living room", rows: [
    ["65-inch 4K TV, Samsung", 1, "3 yrs old", 698, "Brand added by voice note"],
    ["Sectional sofa, 3-piece, fabric", 1, "5 yrs old", 1249, ""],
    ["Area rug, 8 x 10 ft, wool blend", 1, "2 yrs old", 389, ""],
    ["PlayStation 5 console", 1, "2 yrs old", 499, "Not in photo. Added by voice note"],
  ] },
  { name: "Kitchen", rows: [
    ["Stand mixer, KitchenAid 5-qt", 1, "4 yrs old", 449, ""],
    ["Cookware set, stainless, 10-piece", 1, "6 yrs old", 279, ""],
    ["Countertop microwave, 1.1 cu ft", 1, "3 yrs old", 129, ""],
    ["Dinner plates, stoneware", 8, "4 yrs old", 12, ""],
  ] },
  { name: "Bedroom", rows: [
    ["Queen mattress, hybrid", 1, "4 yrs old", 899, ""],
    ["Dresser, 6-drawer, solid wood", 1, "7 yrs old", 549, ""],
    ["Laptop, 14-inch, 16 GB", 1, "1 yr old", 1099, "Model added by voice note"],
    ["Winter coats, adult", 3, "2 yrs old", 160, ""],
  ] },
];
const usd = (n: number) => "$" + n.toLocaleString("en-US");
const sum = (rows: [string, number, string, number, string][]) => rows.reduce((t, r) => t + r[1] * r[3], 0);
const APP = "/claim-list/app";

const PLANS = [
  { name: "Small claim", for: "A theft, or damage to one room", price: 49, items: "Up to 40 items", id: "small" },
  { name: "Standard claim", for: "Water or fire damage to several rooms", price: 149, items: "41 to 150 items", id: "standard", pick: true },
  { name: "Major loss", for: "A whole-home fire or total loss", price: 299, items: "More than 150 items", id: "major" },
];

export default function ClaimListLanding() {
  const [room, setRoom] = useState(0);
  useEffect(() => { track("view_landing"); document.title = "ClearFund Claim List: your contents list for an insurance claim"; }, []);
  const all = ROOMS.reduce((t, r) => t + sum(r.rows), 0);

  return (
    <div className="cl-land">
      <header className="nav">
        <div className="wrap">
          <a className="brand" href="#top">ClearFund <span>Claim List</span></a>
          <a className="btn small light" href="#pricing">See pricing</a>
        </div>
      </header>

      <main id="top">
        <div className="hero">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Fire, water, theft and storm claims</p>
              <h1>Send photos. Get the <em>itemized list</em> your adjuster is waiting on.</h1>
              <p className="lede">Your insurer wants every item you lost, with a price next to it. We turn your photos and a few words from you into that list, priced at what each item costs to replace today.</p>
              <div className="hero-cta">
                <Link className="btn light" to={APP}>Start my claim list</Link>
                <small>From $49. Your list in minutes. You only pay when you download.</small>
              </div>
              <ul className="checks">
                <li>No receipts needed. Photos and your description are enough to start.</li>
                <li>Similar brand and quality, at current store prices, with a store link where one is found.</li>
                <li>A PDF for you and a spreadsheet your adjuster can work with.</li>
              </ul>
            </div>

            <div className="sheet" aria-label="Sample contents list">
              <div className="sheet-head"><strong>Contents list</strong><span className="tag">Sample claim</span></div>
              <div className="tabs" role="tablist" aria-label="Rooms">
                {ROOMS.map((r, i) => <button key={r.name} className="tab" type="button" role="tab" aria-selected={i === room} onClick={() => setRoom(i)}>{r.name}</button>)}
              </div>
              <ul className="rows">
                {ROOMS[room].rows.map(([item, qty, age, price, note]) => (
                  <li key={item}>
                    <span className="item">{item}</span>
                    <span className="price">{usd(qty * price)}</span>
                    <span className="meta">Qty {qty} · {age}{qty > 1 ? " · " + usd(price) + " each" : ""}</span>
                    {note && <span className="meta voice">{note}</span>}
                  </li>
                ))}
              </ul>
              <div className="sheet-foot"><span>{ROOMS[room].name} {usd(sum(ROOMS[room].rows))} · 3 rooms total</span><b>{usd(all)}</b></div>
            </div>
          </div>
        </div>

        <section>
          <div className="wrap">
            <h2>Three steps, and you never fill in a form by hand</h2>
            <p className="sub">Most people stall on the contents list because it means remembering, writing down and pricing everything they owned. This does that part for you.</p>
            <ol className="steps">
              <li><h3>Upload your photos</h3><p>Photos of the damage, or older photos of the rooms from before the loss. Phone pictures are fine.</p></li>
              <li><h3>Fix only what's wrong</h3><p>Tap a line and say things like "that TV was a 65-inch Samsung," or add "a PlayStation that isn't in the photo." The list updates.</p></li>
              <li><h3>Download and send it</h3><p>Pay once, download the spreadsheet and PDF, add your claim number, and send it to your adjuster.</p></li>
            </ol>
          </div>
        </section>

        <section className="band">
          <div className="wrap">
            <h2>What's in the file</h2>
            <p className="sub">Every line carries the details adjusters ask for, so the list doesn't come back to you with questions.</p>
            <div className="cols">
              <ul className="spec">
                <li><b>Item</b><span>What it is, in plain words</span></li>
                <li><b>Brand and model</b><span>Read from the photo or taken from what you tell us</span></li>
                <li><b>Quantity</b><span>Counted per room</span></li>
                <li><b>Age</b><span>Your best estimate of when you got it</span></li>
                <li><b>Replacement price</b><span>Today's price for a similar new item</span></li>
                <li><b>Price source</b><span>The store listing the price came from, so it can be checked</span></li>
                <li><b>Room</b><span>Where each item was</span></li>
              </ul>
              <div className="files">
                <div className="file"><i>PDF</i><div><h3>PDF for your records</h3><p>Clean and readable, with a total and a link to each store listing.</p></div></div>
                <div className="file"><i className="x">XLSX</i><div><h3>Spreadsheet for your adjuster</h3><p>Sortable, totals itself, and easy to copy into your insurer's own contents form.</p></div></div>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing">
          <div className="wrap">
            <h2>One price, based on the size of your claim</h2>
            <p className="sub">Make your list first. The price is set by how many items are on it, and you pay once when you download. No subscription, no percentage of your payout. Changes to the same claim are free for 12 months.</p>
            <div className="plans">
              {PLANS.map((p) => (
                <div key={p.id} className={"plan" + (p.pick ? " pick" : "")}>
                  <div><h3>{p.name}</h3><p className="for">{p.for}</p></div>
                  <div className="amt">${p.price} <small>one time</small></div>
                  <ul><li>{p.items}</li><li>PDF and spreadsheet</li><li>Free changes for 12 months on this claim</li></ul>
                  <Link className={"btn" + (p.pick ? "" : " ghost")} to={APP} onClick={() => track("order_click", p.id)}>Start my list</Link>
                </div>
              ))}
            </div>
            <p className="guarantee"><b>Refund guarantee.</b> If your list isn't usable for your claim, ask within 7 days for a full refund.</p>
          </div>
        </section>

        <section className="band">
          <div className="wrap">
            <h2>Questions people ask</h2>
            <div className="faq">
              <details open><summary>I don't have receipts. Does this still work?</summary><p>Yes. The list is built from your photos and what you tell us. Where a matching store listing is found, the price comes with a link to it. Your insurer may still ask for proof on some items, and photos usually help with that.</p></details>
              <details><summary>Will this get me a bigger payout?</summary><p>We can't promise that, and nobody honestly can. What you're paid depends on your policy, its limits and depreciation. What this does is make your list complete and accurate, so items you owned don't get left off.</p></details>
              <details><summary>Will my insurance company accept it?</summary><p>Insurers ask for an itemized list with descriptions, ages and prices, and this gives you one. Some have their own form. The spreadsheet is laid out so the lines copy across easily. If you're unsure, ask your adjuster what format they want before you pay.</p></details>
              <details><summary>Are you a public adjuster or my insurance company?</summary><p>No. ClearFund Claim List is a documentation tool. We don't negotiate with your insurer, give advice on your coverage, or act for you on your claim. We're not affiliated with any insurance company.</p></details>
              <details><summary>What happens to my photos?</summary><p>Your photos are used only to build your list, and we don't keep them. Your finished list isn't stored on our site either: it's yours, in the files you download. To make changes later, open your saved spreadsheet on our site.</p></details>
              <details><summary>Can someone else finish it for me?</summary><p>Yes. Press "Send to someone to finish for me" and text them the link. It opens the same list, with no sign-in.</p></details>
            </div>
          </div>
        </section>

        <section className="final">
          <div className="wrap">
            <h2>The list is the slow part of a claim. Hand it off.</h2>
            <p>Upload your photos and have a finished contents list in minutes.</p>
            <Link className="btn light" to={APP}>Start my claim list</Link>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <p>ClearFund Claim List is a documentation service. It is not a public adjuster, an insurance company, or a law firm, and it does not negotiate claims or guarantee any payment. Claim decisions are made by your insurer under your policy.</p>
          <p>Prices in the sample list are examples only.</p>
        </div>
      </footer>
    </div>
  );
}
