// ClearFund Claim List app. Guess first: photos become a priced list, the owner only fixes what's wrong.
// Nothing is kept on the server. The list lives in this browser, in the helper link, and in the downloaded spreadsheet.
import { useEffect, useRef, useState } from "react";
import "./claimList.css";
import {
  LOSS_TYPES, MAX_PHOTOS, PLANS, EXTENSION_PRICE, STORE_KEY, applyOwnPrice, call, grandTotal, linked, newId, packList,
  parseDollarOnly, planForCount, readXlsx, sampleList, saveFile, shrinkPhoto, track, unpackList, usd,
  type ListLine, type SavedList, type PurchaseDecision,
} from "@/lib/claimList";

type Screen = "start" | "room" | "work" | "list" | "done";
const LABEL = { confirmed: "You told us", estimated: "Our best guess", own: "Your price" } as const;
const GROUP = 6;
const empty = (): SavedList => ({ items: [], left: [], loss: "", dateOfLoss: "", purchaseId: "" });

function loadSaved(): SavedList | null {
  try { const d = JSON.parse(localStorage.getItem(STORE_KEY) || "null"); if (d && Array.isArray(d.items) && d.items.length) return { ...empty(), ...d, items: d.items.map((r: ListLine) => ({ ...r, id: r.id || newId() })) }; } catch { /* ignore */ }
  return null;
}

// Speech-to-text where the browser has it. Phone keyboards also have their own mic.
const SR: any = typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;
function Mic({ onText }: { onText: (t: string) => void }) {
  const [live, setLive] = useState(false);
  const rec = useRef<any>(null);
  if (!SR) return null;
  const toggle = () => {
    if (live) { rec.current?.stop(); return; }
    const r = new SR(); r.lang = "en-US"; r.interimResults = false; r.continuous = false;
    r.onresult = (e: any) => onText(Array.from(e.results).map((x: any) => x[0].transcript).join(" "));
    r.onend = () => setLive(false); r.onerror = () => setLive(false);
    rec.current = r; setLive(true); r.start();
  };
  return <button type="button" className={"mic" + (live ? " live" : "")} aria-label={live ? "Stop" : "Speak"} onClick={toggle}>🎤</button>;
}
const append = (prev: string, t: string) => (prev.trim() ? prev.trim() + " " : "") + t.trim();

export default function ClaimListApp() {
  const [screen, setScreen] = useState<Screen>("start");
  const [list, setList] = useState<SavedList>(empty);
  const [files, setFiles] = useState<File[]>([]);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [said, setSaid] = useState("");
  const [msg, setMsg] = useState<{ where: string; text: string } | null>(null);
  const [work, setWork] = useState("This usually takes about a minute. Please keep this page open.");
  const [open, setOpen] = useState<string | null>(null);
  const [pricing, setPricing] = useState(0);
  const [justPaid, setJustPaid] = useState(false);
  const listRef = useRef(list); listRef.current = list;

  const update = (fn: (l: SavedList) => SavedList) => setList((l) => fn(l));
  useEffect(() => { if (list.items.length) { try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch { /* full or private mode */ } } }, [list]);
  const go = (s: Screen) => { setScreen(s); setMsg(null); window.scrollTo(0, 0); };
  const fail = (where: string, text: string) => setMsg({ where, text });

  // Open from a helper link, a Stripe return, or this browser's saved list.
  useEffect(() => {
    track("view_app");
    const q = new URLSearchParams(window.location.search);
    const hash = window.location.hash.startsWith("#l=") ? unpackList(window.location.hash.slice(3)) : null;
    const saved = loadSaved();
    if (hash) { setList(hash); history.replaceState(null, "", window.location.pathname); go("list"); return; }
    if (q.get("paid") && saved) { setList({ ...saved, purchaseId: q.get("paid")!, sample: false }); setJustPaid(true); history.replaceState(null, "", window.location.pathname); go("done"); return; }
    if (saved) { setList(saved); if (q.get("canceled")) history.replaceState(null, "", window.location.pathname); go(q.get("canceled") ? "done" : "list"); }
  }, []);

  // ---------- store prices: looked up in the background, the list is usable meanwhile ----------
  useEffect(() => {
    const todo = list.items.filter((r) => !r.listing && r.basis !== "own" && !list.sample).slice(0, 6);
    if (!todo.length || pricing) return;
    setPricing((n) => n + 1);
    call<{ results: { id: string; store?: string; url?: string; price?: number }[] }>("claim-list-price", { lines: todo.map(({ id, item, brand, price }) => ({ id, item, brand, price })) })
      .then((res) => {
        const by = new Map((res.results ?? []).map((x) => [x.id, x]));
        update((l) => ({ ...l, items: l.items.map((r) => {
          if (!todo.some((t) => t.id === r.id)) return r;
          const f = by.get(r.id);
          if (r.basis === "own") return { ...r, listing: "none" };
          return f?.url && f.store && f.price ? { ...r, store: f.store, url: f.url, price: f.price, listing: "found" } : { ...r, listing: "none" };
        }) }));
      })
      .catch(() => update((l) => ({ ...l, items: l.items.map((r) => (todo.some((t) => t.id === r.id) ? { ...r, listing: "none" } : r)) })))
      .finally(() => setPricing((n) => n - 1));
  }, [list.items, pricing, list.sample]);
  const stillPricing = list.items.some((r) => !r.listing && r.basis !== "own") && !list.sample;

  // ---------- photos to list ----------
  const addPhotos = (fl: FileList | null) => {
    if (!fl) return;
    const imgs = Array.from(fl).filter((f) => f.type.startsWith("image/"));
    const room = MAX_PHOTOS - files.length;
    if (imgs.length > room) fail("room", `Up to ${MAX_PHOTOS} photos per list. The first ${Math.max(room, 0)} were added.`);
    const take = imgs.slice(0, Math.max(room, 0));
    setFiles((f) => [...f, ...take]);
    setThumbs((t) => [...t, ...take.map((f) => URL.createObjectURL(f))]);
  };

  const makeList = async () => {
    setMsg(null);
    if (!files.length) return fail("room", "Add at least one photo first.");
    go("work");
    const groups: File[][] = [];
    for (let i = 0; i < files.length; i += GROUP) groups.push(files.slice(i, i + GROUP));
    const items: ListLine[] = [], left: SavedList["left"] = [];
    let done = 0, failed = 0;
    const runGroup = async (g: File[], first: boolean) => {
      const images = await Promise.all(g.map((f) => shrinkPhoto(f)));
      for (let attempt = 0; attempt < 2; attempt++) {
        const out = await call<{ items: ListLine[]; left: SavedList["left"] }>("claim-list-ai", {
          mode: "photos", images, loss: list.loss, said, first,
          already: items.map((r) => (r.brand ? r.brand + " " : "") + r.item),
        });
        if (out.items) {
          for (const r of out.items) {
            const same = items.find((x) => x.room.toLowerCase() === r.room.toLowerCase() && x.item.toLowerCase() === r.item.toLowerCase() && x.brand.toLowerCase() === r.brand.toLowerCase());
            if (same) same.qty = Math.max(same.qty, r.qty); else items.push({ ...r, id: newId() });
          }
          left.push(...(out.left ?? []));
          return;
        }
        if (out.error !== "busy") break;
        await new Promise((ok) => setTimeout(ok, 8000));
      }
      failed++;
    };
    // First group alone (it also lists what the owner mentioned), then two at a time.
    const rest = groups.slice(1);
    await runGroup(groups[0], true); done++;
    while (rest.length) {
      setWork(`Looking at photos, part ${done + 1} of ${groups.length}. Please keep this page open.`);
      await Promise.all(rest.splice(0, 2).map((g) => runGroup(g, false)));
      done = groups.length - rest.length;
    }
    if (!items.length) { go("room"); return fail("room", failed ? "The photo reader is busy. Wait a minute and press Make my list again." : "We couldn't find any contents in those photos. Try a wider shot."); }
    setList((l) => ({ ...l, items, left, sample: false, purchaseId: l.purchaseId }));
    setOpen(null);
    go("list");
    if (failed) fail("list", `${failed * GROUP} or so photos couldn't be read this time. Add anything missing below.`);
  };

  // ---------- open a saved spreadsheet ----------
  const openFile = async (f: File | undefined) => {
    setMsg(null);
    if (!f) return;
    try {
      const ExcelJS = (await import("exceljs")).default;
      const st = await readXlsx(ExcelJS, await f.arrayBuffer());
      if (!st.items.length) throw new Error("empty");
      setList({ items: st.items.map((r: any) => ({ ...r, id: newId(), listing: r.url ? "found" : "none" })), left: st.left, loss: st.loss, dateOfLoss: st.dateOfLoss || "", purchaseId: st.purchaseId || "" });
      go("list");
    } catch { fail("start", "That file couldn't be read. Choose a spreadsheet that was downloaded from ClearFund Claim List."); }
  };

  const restart = () => {
    try { localStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
    setList(empty()); setFiles([]); setThumbs([]); setSaid(""); setOpen(null); go("start");
  };

  return (
    <div className="cl-app" style={{ minHeight: "100vh" }}>
      <div className="top"><a href="/claim-list">ClearFund <span>Claim List</span></a>{screen !== "start" && <button type="button" onClick={restart}>Start over</button>}</div>
      <main>
        {screen === "start" && <Start onStart={() => go("room")} onSample={() => { setList(sampleList()); go("list"); }} onOpen={openFile} msg={msg?.where === "start" ? msg.text : ""} />}
        {screen === "room" && (
          <section className="screen on">
            <h2>Show us your contents</h2>
            <div className="card">
              <label className="big" htmlFor="photos">1. Add your photos</label>
              <p className="hint">Wide shots of each room, plus close-ups of shelves, closets and labels if you can. Up to {MAX_PHOTOS}.</p>
              <label className="btn second" htmlFor="photos" style={{ cursor: "pointer" }}>{files.length ? `Add more photos (${files.length} added)` : "Add photos"}</label>
              <input id="photos" type="file" accept="image/*" multiple hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
              <div className="thumbs">{thumbs.map((t, i) => <img key={i} src={t} alt="Your photo" />)}</div>
            </div>
            <div className="card">
              <span className="big" id="loss-l">2. What happened?</span>
              <div className="choices" role="group" aria-labelledby="loss-l">
                {LOSS_TYPES.map((l) => <button key={l} type="button" className="choice" aria-pressed={list.loss === l} onClick={() => update((x) => ({ ...x, loss: l }))}>{l}</button>)}
              </div>
            </div>
            <div className="card">
              <label className="big" htmlFor="said">3. Tell us anything you know <span className="hint">(you can skip this)</span></label>
              <p className="hint">Like "the TV is a 65 inch Hisense, the couch is real leather, about ten years old."</p>
              <div className="talkrow"><textarea id="said" value={said} onChange={(e) => setSaid(e.target.value)} /><Mic onText={(t) => setSaid((s) => append(s, t))} /></div>
            </div>
            {msg?.where === "room" && <div className="msg bad">{msg.text}</div>}
            <button className="btn" type="button" onClick={makeList}>Make my list</button>
          </section>
        )}
        {screen === "work" && (
          <section className="screen on">
            <h2>Looking at your photos</h2>
            <p className="lede">{work}</p>
            <div className="spin" aria-hidden="true" />
          </section>
        )}
        {screen === "list" && <ListScreen list={list} update={update} open={open} setOpen={setOpen} stillPricing={stillPricing} msg={msg?.where === "list" ? msg.text : ""} />}
        {screen === "done" && <Done list={list} update={update} back={() => go("list")} justPaid={justPaid} />}
      </main>
      {screen === "list" && list.items.length > 0 && (
        <div className="bar on"><button className="btn" type="button" onClick={() => go("done")}>Looks right. Get my files</button></div>
      )}
    </div>
  );
}

function Start({ onStart, onSample, onOpen, msg }: { onStart: () => void; onSample: () => void; onOpen: (f?: File) => void; msg: string }) {
  return (
    <section className="screen on">
      <h1>Show us your contents. We'll make the list.</h1>
      <p className="lede">Add photos of the contents that were damaged or lost. We list every item with a price, ready for your insurance adjuster. You only change what we got wrong.</p>
      <button className="btn" type="button" onClick={onStart}>Start</button>
      <label className="btn second" htmlFor="open-file" style={{ cursor: "pointer" }}>Open a list I saved</label>
      <input id="open-file" type="file" accept=".xlsx" hidden onChange={(e) => { onOpen(e.target.files?.[0]); e.target.value = ""; }} />
      {msg && <div className="msg bad">{msg}</div>}
      <button className="btn plain" type="button" onClick={onSample}>See a sample list first</button>
    </section>
  );
}

function ListScreen({ list, update, open, setOpen, stillPricing, msg }: {
  list: SavedList; update: (fn: (l: SavedList) => SavedList) => void; open: string | null; setOpen: (id: string | null) => void; stillPricing: boolean; msg: string;
}) {
  const [add, setAdd] = useState("");
  const [addBusy, setAddBusy] = useState(false);
  const [addMsg, setAddMsg] = useState("");
  const [shared, setShared] = useState("");
  const total = grandTotal(list.items);

  const addItems = async () => {
    setAddMsg("");
    if (!add.trim()) return setAddMsg("Type or say what we missed first.");
    setAddBusy(true);
    const out = await call<{ items: ListLine[] }>("claim-list-ai", { mode: "add", said: add, loss: list.loss, room: list.items[list.items.length - 1]?.room });
    setAddBusy(false);
    if (!out.items?.length) return setAddMsg(out.error === "busy" ? "Too many requests right now. Wait a minute and try again." : "That didn't work. Try saying it a different way.");
    update((l) => ({ ...l, sample: false, items: [...l.items, ...out.items.map((r) => ({ ...r, id: newId() }))] }));
    setAdd("");
  };

  const share = async () => {
    const url = window.location.origin + "/claim-list/app#l=" + packList(list);
    const text = "Here's my contents list for the insurance claim. Can you check it and finish it for me?";
    try {
      if (navigator.share) { await navigator.share({ title: "Contents list", text, url }); setShared("Sent. The link opens this same list."); return; }
    } catch (e: any) { if (e?.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(url); setShared("Link copied. Paste it in a text or email. It opens this same list."); }
    catch { setShared(url); }
  };

  return (
    <section className="screen on">
      {list.sample && <div className="msg">This is a sample list from a test living room. Press "Start over" to make your own.</div>}
      {msg && <div className="msg">{msg}</div>}
      <div className="total">
        <small>{list.items.length} {list.items.length === 1 ? "item" : "items"}{list.loss ? " · " + list.loss + " damage" : ""}</small>
        <b>{usd(total)}</b>
        <small>{stillPricing ? "Checking store prices. The total may change." : "What it costs to replace everything on this list today"}</small>
      </div>
      <button className="btn second" type="button" onClick={share}>Send to someone to finish for me</button>
      {shared && <div className="okmsg" style={{ wordBreak: "break-all" }}>{shared}</div>}
      <p className="lede">Scroll the list. <strong>Tap anything that's wrong</strong> and tell us what's different. If it looks right, leave it.</p>
      <ul className="rows">
        {list.items.map((r) => <Row key={r.id} r={r} open={open === r.id} toggle={() => setOpen(open === r.id ? null : r.id)} update={update} loss={list.loss} close={() => setOpen(null)} />)}
      </ul>
      <div className="card">
        <label className="big" htmlFor="add-text">Add something we missed</label>
        <div className="talkrow"><textarea id="add-text" value={add} onChange={(e) => setAdd(e.target.value)} placeholder="Like: a PlayStation 5, about two years old" /><Mic onText={(t) => setAdd((s) => append(s, t))} /></div>
        {addMsg && <div className="msg bad">{addMsg}</div>}
        <button className="btn second small" type="button" disabled={addBusy} onClick={addItems}>{addBusy ? "Adding…" : "Add it"}</button>
      </div>
      {list.left.length > 0 && (
        <div className="card">
          <h3>Left off the list</h3>
          <p className="hint">These are usually part of the building, not your belongings.</p>
          <ul className="left">{list.left.map((l, i) => <li key={i}>{l.item}{l.reason ? ". " + l.reason : ""}</li>)}</ul>
        </div>
      )}
    </section>
  );
}

function Row({ r, open, toggle, update, close, loss }: { r: ListLine; open: boolean; toggle: () => void; update: (fn: (l: SavedList) => SavedList) => void; close: () => void; loss: string }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const setLine = (fn: (x: ListLine) => ListLine | null) => update((l) => ({ ...l, sample: false, items: l.items.flatMap((x) => (x.id === r.id ? (fn(x) ? [fn(x)!] : []) : [x])) }));

  const change = async () => {
    setErr("");
    const said = text.trim();
    if (!said) return setErr("Type or say what's different first.");
    const dollars = parseDollarOnly(said);
    if (dollars !== null) { setLine((x) => ({ ...applyOwnPrice(x, dollars), id: x.id })); setText(""); close(); return; }
    setBusy(true);
    const out = await call<{ line?: ListLine; remove?: boolean }>("claim-list-ai", { mode: "edit", line: r, said, loss });
    setBusy(false);
    if (out.remove) { setLine(() => null); close(); return; }
    if (!out.line) return setErr(out.error === "busy" ? "Too many requests right now. Wait a minute and try again." : "That didn't work. Try saying it a different way, or type just a dollar amount like 450.");
    // A changed item gets a fresh store lookup, unless the owner gave the price.
    setLine((x) => ({ ...out.line!, id: x.id, store: "", url: "", listing: out.line!.basis === "own" ? "none" : undefined }));
    setText(""); close();
  };

  return (
    <li className="row">
      <button type="button" className="head" aria-expanded={open} onClick={toggle}>
        <span className="name">{(r.brand ? r.brand + " " : "") + r.item}</span>
        <span className="price">{usd(r.qty * r.price)}</span>
        <span className="sub"><span className={"tag " + r.basis}>{LABEL[r.basis]}</span><span>{(r.qty > 1 ? r.qty + " × " + usd(r.price) : "Qty 1") + (r.age ? " · " + r.age : "") + (r.room ? " · " + r.room : "")}</span></span>
        {r.note && <span className="note">{r.note}</span>}
        {!r.listing && r.basis !== "own" && <span className="pending">Checking store price…</span>}
        {!open && <span className="tap">Tap to change</span>}
      </button>
      {linked(r) && <a className="storelink" href={r.url} target="_blank" rel="noopener noreferrer">See it at {r.store} ↗</a>}
      {open && (
        <div className="edit">
          <label className="hint" htmlFor={"edit-" + r.id}>What's different? Like "it's a 75 inch," "I paid about $2,000," or "there were two." Type just a number like 450 to set your own price.</label>
          <div className="talkrow"><textarea id={"edit-" + r.id} value={text} onChange={(e) => setText(e.target.value)} /><Mic onText={(t) => setText((s) => append(s, t))} /></div>
          {err && <div className="msg bad">{err}</div>}
          <div className="two">
            <button type="button" className="btn small" disabled={busy} onClick={change}>{busy ? "Changing…" : "Change it"}</button>
            <button type="button" className="btn small danger" onClick={() => { setLine(() => null); close(); }}>I didn't own this</button>
          </div>
        </div>
      )}
    </li>
  );
}

const DECISION_TEXT = (d: PurchaseDecision, lines: number) => {
  switch (d.kind) {
    case "free": return { note: "Already paid for this claim. Changes are free.", button: "Get my files", kind: null };
    case "upgrade": return { note: `Your list grew to ${lines} items, past what your plan covers. Pay the difference to move to ${PLANS[d.to].name}.`, button: `Pay $${d.difference} and get my files`, kind: "upgrade" as const };
    case "new_purchase": return d.reason === "expired"
      ? { note: "Your 12 months of free changes on this claim have ended. Add 12 more months for this same claim.", button: `Pay $${EXTENSION_PRICE} and get my files`, kind: "extend" as const }
      : { note: "The date of loss is different from the one you paid for, so this counts as a new claim.", button: `Pay $${PLANS[planForCount(lines)].price} and get my files`, kind: "new" as const };
    default: return null;
  }
};

function Done({ list, update, back, justPaid }: { list: SavedList; update: (fn: (l: SavedList) => SavedList) => void; back: () => void; justPaid: boolean }) {
  const [agree, setAgree] = useState(justPaid);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [status, setStatus] = useState<{ decision: PurchaseDecision; until: string | null } | null>(null);
  const [links, setLinks] = useState<{ xlsx: string; pdf: string; day: string } | null>(null);
  const lines = list.items.length;
  const plan = PLANS[planForCount(lines)];
  const today = new Date().toISOString().slice(0, 10);

  // A purchase ID (from Stripe's return or a reopened file) is checked against Stripe; nothing else is looked up.
  useEffect(() => {
    setStatus(null); setLinks(null);
    if (!list.purchaseId || !list.dateOfLoss) return;
    let live = true;
    call<{ decision: PurchaseDecision; until: string | null }>("claim-list-pay", { action: "verify", purchaseId: list.purchaseId, dateOfLoss: list.dateOfLoss, lines })
      .then((r) => { if (live && r.decision) setStatus(r); });
    return () => { live = false; };
  }, [list.purchaseId, list.dateOfLoss, lines]);

  const paidUp = status?.decision.kind === "free";
  // Coming back from checkout: make the files right away.
  const auto = useRef(false);
  useEffect(() => {
    if (justPaid && paidUp && !links && !auto.current) { auto.current = true; setBusy("x"); getFiles().finally(() => setBusy("")); }
  });
  const text = status && status.decision.kind !== "unpaid" ? DECISION_TEXT(status.decision, lines) : null;

  const getFiles = async () => {
    setErr("");
    const r = await call<{ xlsx?: string; pdf?: string; day?: string; decision?: PurchaseDecision }>("claim-list-pay", { action: "files", purchaseId: list.purchaseId, dateOfLoss: list.dateOfLoss, state: list });
    if (!r.xlsx || !r.pdf) { if (r.decision) setStatus(r as any); return setErr(r.error === "payments_off" ? "Payments aren't switched on yet. Please try again later." : "Your files couldn't be made. Press the button to try again."); }
    setLinks({ xlsx: saveFile("x", r.xlsx, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), pdf: saveFile("p", r.pdf, "application/pdf"), day: r.day || today });
  };

  const pay = async (kind: "new" | "upgrade" | "extend") => {
    track("order_click", planForCount(lines));
    const r = await call<{ url?: string }>("claim-list-pay", { action: "checkout", kind, lines, dateOfLoss: list.dateOfLoss, purchaseId: list.purchaseId });
    if (r.url) { window.location.href = r.url; return; }
    setErr(r.error === "payments_off" ? "Payments aren't switched on yet. Please try again later." : r.error === "bad_date" ? "Check the date of loss." : "Checkout couldn't open. Press the button to try again.");
  };

  const main = async () => {
    setErr("");
    if (!list.dateOfLoss) return setErr("Enter the date of loss first.");
    if (!agree) return setErr("Check the box first.");
    setBusy("x");
    try {
      if (paidUp) await getFiles();
      else await pay(text?.kind ?? "new");
    } finally { setBusy(""); }
  };

  const button = paidUp ? "Get my files" : text?.button ?? `Pay $${plan.price} and get my files`;
  const name = (ext: string) => `Contents_Claim_List_${links?.day ?? today}.${ext}`;

  return (
    <section className="screen on">
      <h2>Get your files</h2>
      <div className="card">
        <label className="big" htmlFor="dol">Date of loss</label>
        <p className="hint">The day the damage or theft happened. It's printed on your files and tied to this purchase.</p>
        <input id="dol" type="date" max={today} value={list.dateOfLoss} onChange={(e) => update((l) => ({ ...l, dateOfLoss: e.target.value }))} />
      </div>
      <div className="card">
        <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /><span>Everything on this list is something I owned and lost.</span></label>
      </div>
      <div className="card">
        <h3>{paidUp ? "Paid" : `${plan.name}: $${plan.price} one time`}</h3>
        <p className="hint">
          {text?.note ?? `Set by the size of your list (${lines} items). Includes the spreadsheet for your adjuster and a PDF for your records, plus free changes to this claim for 12 months.`}
          {paidUp && status?.until ? ` Free changes until ${status.until}.` : ""}
        </p>
      </div>
      {list.sample && <div className="msg">This is the sample list. Press "Start over" to make your own before paying.</div>}
      {err && <div className="msg bad">{err}</div>}
      {links ? (
        <>
          <div className="okmsg">Your files are ready. Keep the spreadsheet: to make changes later, open it again here.</div>
          <a className="btn dl" href={links.xlsx} download={name("xlsx")}>Download spreadsheet for my adjuster</a>
          <a className="btn second dl" href={links.pdf} download={name("pdf")}>Download PDF for my records</a>
        </>
      ) : (
        <button className="btn" type="button" disabled={!!busy || list.sample} onClick={main}>{busy ? "One moment…" : button}</button>
      )}
      <p className="hint">Full refund within 7 days if the list isn't usable for your claim.</p>
      <button className="btn plain" type="button" onClick={back}>Back to my list</button>
    </section>
  );
}
