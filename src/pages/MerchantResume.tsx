import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Upload } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Doc = { id: string; doc_type: string; original_name: string; uploaded_at: string };
type State = { business_name: string; stage: string; requires_photo_id: boolean; documents: Doc[] };
const input = "h-12 w-full text-base";

const MerchantResume: React.FC = () => {
  const [params] = useSearchParams(); const token = params.get("token") ?? "";
  const [state, setState] = useState<State | null>(null); const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false); const [signatureName, setSignatureName] = useState(""); const [drawn, setDrawn] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null); const drawing = useRef(false);
  const load = async () => {
    const { data, error: err } = await supabase.functions.invoke("va-resume", { body: { action: "load", token } });
    if (err || data?.error) setError("This private link is invalid or has expired. Ask us to send a new one."); else setState(data as State);
  };
  useEffect(() => { if (/^[a-f0-9]{48}$/.test(token)) load(); else setError("This private link is invalid or has expired."); }, [token]);
  const point = (e: React.PointerEvent<HTMLCanvasElement>) => { const r = e.currentTarget.getBoundingClientRect(); return { x: (e.clientX - r.left) * e.currentTarget.width / r.width, y: (e.clientY - r.top) * e.currentTarget.height / r.height }; };
  const start = (e: React.PointerEvent<HTMLCanvasElement>) => { e.currentTarget.setPointerCapture(e.pointerId); const p = point(e); const ctx = e.currentTarget.getContext("2d")!; ctx.beginPath(); ctx.moveTo(p.x, p.y); drawing.current = true; setDrawn(true); };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => { if (!drawing.current) return; const p = point(e); const ctx = e.currentTarget.getContext("2d")!; ctx.lineTo(p.x, p.y); ctx.strokeStyle = "currentColor"; ctx.lineWidth = 3; ctx.stroke(); };
  const clear = () => { const c = canvas.current; c?.getContext("2d")?.clearRect(0, 0, c.width, c.height); setDrawn(false); };
  const call = async (form: FormData) => { setBusy(true); const { data, error: err } = await supabase.functions.invoke("va-resume", { body: form }); setBusy(false); if (err || data?.error) { toast.error(data?.error === "documents_missing" ? "Please complete every required item." : "We couldn't save that. Please try again."); return false; } await load(); return true; };
  const sign = async () => { if (!signatureName.trim() || !drawn || !canvas.current) return toast.error("Type your name and draw your signature."); const blob = await new Promise<Blob | null>((resolve) => canvas.current!.toBlob(resolve, "image/png")); if (!blob) return; const form = new FormData(); form.set("action", "sign"); form.set("token", token); form.set("signature_name", signatureName.trim()); form.set("file", blob, "signature.png"); if (await call(form)) toast.success("Application signed"); };
  const upload = async (files: FileList | null, docType: string) => { if (!files?.length) return; for (const file of Array.from(files).slice(0, 4)) { if (file.size > 10 * 1024 * 1024) return toast.error("Each file must be 10 MB or smaller."); const form = new FormData(); form.set("action", "upload"); form.set("token", token); form.set("doc_type", docType); form.set("file", file); if (!await call(form)) return; } toast.success("Upload saved"); };
  const docs = state?.documents ?? []; const banks = docs.filter((d) => d.doc_type === "bank_statement").length; const signed = docs.some((d) => d.doc_type === "signed_application"); const photo = docs.some((d) => d.doc_type === "photo_id");
  const required = 2 + (state?.requires_photo_id ? 1 : 0); const done = (signed ? 1 : 0) + (banks >= 3 ? 1 : 0) + (!state?.requires_photo_id || photo ? state?.requires_photo_id ? 1 : 0 : 0); const progress = state?.requires_photo_id ? done / required : (signed ? 1 : 0) + (banks >= 3 ? 1 : 0);
  const ready = signed && banks >= 3 && (!state?.requires_photo_id || photo);

  return <div className="min-h-screen min-w-0 bg-background"><Header /><main className="px-4 py-10 pb-24"><div className="mx-auto w-full max-w-2xl min-w-0">
    {error ? <div role="alert" className="rounded-lg border bg-card p-6 text-center text-destructive">{error}</div> : !state ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : <>
      <p className="text-sm font-medium text-primary">Merchant intake · Step 2 of 2</p><h1 className="mt-2 break-words text-3xl font-bold">{state.business_name}</h1><p className="mt-2 text-sm text-muted-foreground">Private application · Status: {state.stage}</p>
      <div className="mt-5"><div className="flex justify-between gap-3 text-sm"><span>Application progress</span><span>{ready ? "Ready for review" : "Items missing"}</span></div><div className="mt-2 h-2 rounded bg-muted"><div className="h-2 rounded bg-primary transition-all" style={{ width: `${state.requires_photo_id ? progress / 3 * 100 : progress / 2 * 100}%` }} /></div></div>
      <section className="mt-6 rounded-lg border bg-card p-4 sm:p-5"><h2 className="font-semibold">1. Sign the application</h2>{signed ? <p className="mt-2 text-sm text-primary">Signed application saved.</p> : <div className="mt-4 space-y-3"><Label htmlFor="signature-name">Type your full legal name</Label><Input id="signature-name" className={input} value={signatureName} onChange={(e) => setSignatureName(e.target.value)} maxLength={120} /><Label htmlFor="signature-pad">Draw your signature</Label><canvas id="signature-pad" ref={canvas} width={900} height={240} className="h-36 w-full touch-none rounded-md border bg-background" onPointerDown={start} onPointerMove={move} onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }} /><Button type="button" variant="ghost" onClick={clear}>Clear signature</Button><p className="text-xs text-muted-foreground">By signing, you agree that this electronic signature represents your signature on this application.</p><Button className="h-12 w-full" disabled={busy} onClick={sign}>Save electronic signature</Button></div>}</section>
      <section className="mt-4 rounded-lg border bg-card p-4 sm:p-5"><h2 className="font-semibold">2. Business bank statements</h2><p className="mt-1 text-sm text-muted-foreground">Upload the last 3 to 4 months. PDF only, up to 10 MB each. Uploaded: {banks} of 3 required.</p><Label htmlFor="bank-statements" className="mt-4 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium"><Upload className="h-4 w-4" />Choose PDF statements</Label><input id="bank-statements" type="file" accept="application/pdf,.pdf" multiple className="sr-only" disabled={busy} onChange={(e) => { upload(e.target.files, "bank_statement"); e.target.value = ""; }} /><ul className="mt-3 space-y-1 text-sm">{docs.filter((d) => d.doc_type === "bank_statement").map((d) => <li key={d.id} className="break-words">{d.original_name}</li>)}</ul></section>
      {state.requires_photo_id && <section className="mt-4 rounded-lg border bg-card p-4 sm:p-5"><h2 className="font-semibold">3. Photo ID</h2><p className="mt-1 text-sm text-muted-foreground">Required for this application route. PDF, JPG or PNG, up to 10 MB.</p><Input type="file" accept="application/pdf,image/jpeg,image/png" className="mt-4 h-auto min-h-12 py-3" disabled={busy || photo} onChange={(e) => upload(e.target.files, "photo_id")} />{photo && <p className="mt-2 text-sm text-primary">Photo ID saved.</p>}</section>}
      <Button size="lg" className="mt-6 h-12 w-full" disabled={!ready || busy || state.stage === "Complete"} onClick={async () => { const form = new FormData(); form.set("action", "complete"); form.set("token", token); if (await call(form)) toast.success("Application complete"); }}>{state.stage === "Complete" ? "Application complete" : "Submit complete file"}</Button>
      {state.stage === "Complete" && <p className="mt-4 text-center text-sm text-muted-foreground">Thanks. Your complete file is ready for review. This is not an approval.</p>}
    </>}
  </div></main><Footer /></div>;
};
export default MerchantResume;
