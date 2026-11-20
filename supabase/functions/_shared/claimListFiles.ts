// @ts-nocheck — owner-supplied, tested spreadsheet code kept verbatim; libraries are injected.
import { FILE_LABEL, linked } from "./claimList.ts";

export async function makeXlsx(X, st, day) {
  const wb = new X.Workbook(), HR = 12, EXTRA = 15, navy = "FF143352", pale = "FFE3F2FD", fillin = "FFFFF8DC";
  const ws = wb.addWorksheet("Contents List", { views: [{ state: "frozen", ySplit: HR }], pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: HR + ":" + HR, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 } } });
  [6, 16, 42, 22, 10, 15, 17, 17, 20, 24, 40].forEach((w, i) => ws.getColumn(i + 1).width = w);
  const F = (o) => Object.assign({ name: "Arial", size: 10 }, o || {});
  const thin = { style: "thin", color: { argb: "FFB8C7D9" } }, box = { top: thin, left: thin, bottom: thin, right: thin };
  const solid = c => ({ type: "pattern", pattern: "solid", fgColor: { argb: c } });
  const money = '"$"#,##0.00';
  const put = (ref, v, font, extra) => { const c = ws.getCell(ref); c.value = v; c.font = F(font); if (extra) Object.assign(c, extra); return c; };
  ws.mergeCells("A1:K1"); put("A1", "Personal Property Contents List", { size: 16, bold: true, color: { argb: navy } }); ws.getRow(1).height = 26;
  ws.mergeCells("A2:K2"); put("A2", "Prepared " + day + " with ClearFund Claim List. All amounts are the cost to replace each item new, in US dollars.", { color: { argb: "FF56677A" } });
  [["Name of insured", ""], ["Claim number", ""], ["Address of loss", ""], ["Date of loss", st.dateOfLoss || ""], ["Type of loss", st.loss || ""]].forEach(([k, v], n) => {
    const r = 4 + n; ws.mergeCells("A" + r + ":B" + r); ws.mergeCells("C" + r + ":D" + r);
    put("A" + r, k, { bold: true }); const c = put("C" + r, v, {}); c.fill = solid(fillin); c.border = box; ws.getRow(r).height = 20;
  });
  const first = HR + 1, last = HR + st.items.length + EXTRA;
  const grand = Math.round(st.items.reduce((t, r) => t + r.qty * r.price, 0) * 100) / 100, pieces = st.items.length;
  ws.mergeCells("F4:H4"); put("F4", "Total replacement cost", { bold: true }); ws.mergeCells("I4:K4");
  const tc = put("I4", { formula: "SUM(H" + first + ":H" + last + ")", result: grand }, { bold: true, size: 14, color: { argb: navy } }); tc.numFmt = money; tc.fill = solid(pale); tc.border = box; tc.alignment = { horizontal: "left" };
  ws.mergeCells("F5:H5"); put("F5", "Number of line items", { bold: true }); ws.mergeCells("I5:K5");
  const nc = put("I5", { formula: "COUNT(G" + first + ":G" + last + ")", result: pieces }, {}); nc.border = box; nc.alignment = { horizontal: "left" };
  ws.mergeCells("A10:K10"); const tip = put("A10", "To update this list: type over any cell. Totals recalculate on their own. Fill in the yellow boxes above. Add more items in the blank rows at the bottom of the list. To keep working on it later, save this file and open it again in ClearFund Claim List.", { italic: true, color: { argb: "FF56677A" } }); tip.alignment = { wrapText: true, vertical: "top" }; ws.getRow(10).height = 40;
  ["Item no.", "Room", "Item description", "Brand / model", "Quantity", "Age of item", "Replacement cost (each)", "Total replacement cost", "Source of price", "Priced from", "Notes"].forEach((h, i) => {
    const c = ws.getCell(HR, i + 1); c.value = h; c.font = F({ bold: true, color: { argb: "FFFFFFFF" } }); c.fill = solid(navy); c.border = box; c.alignment = { wrapText: true, vertical: "middle", horizontal: i >= 4 && i <= 7 ? "center" : "left" };
  });
  ws.getRow(HR).height = 32; ws.getColumn(12).hidden = true;
  for (let n = 0; n < st.items.length + EXTRA; n++) {
    const r = first + n, it = st.items[n], row = ws.getRow(r);
    const vals = it ? [n + 1, it.room, it.item, it.brand, it.qty, it.age, it.price, null, FILE_LABEL[it.basis], null, it.note] : [n + 1, "", "", "", null, "", null, null, "", null, ""];
    vals.forEach((v, i) => { const c = row.getCell(i + 1); if (v !== null) c.value = v; c.font = F(); c.border = box; c.alignment = { wrapText: true, vertical: "top", horizontal: i === 0 || i === 4 ? "center" : i === 6 || i === 7 ? "right" : "left" }; });
    row.getCell(8).value = { formula: 'IF(OR(E' + r + '="",G' + r + '=""),"",E' + r + '*G' + r + ')', result: it ? Math.round(it.qty * it.price * 100) / 100 : "" }; row.getCell(8).fill = solid("FFF4F7FA");
    row.getCell(7).numFmt = money; row.getCell(8).numFmt = money;
    if (it) row.getCell(12).value = it.price;
    if (it) { const lc = row.getCell(10); if (linked(it)) { lc.value = { text: it.store, hyperlink: it.url }; lc.font = F({ color: { argb: "FF1565C0" }, underline: true }); } else { lc.value = "No listing attached"; lc.font = F({ color: { argb: "FF56677A" } }); } }
    const lines = it ? Math.max(1, Math.ceil(it.item.length / 44), Math.ceil(it.note.length / 42), Math.ceil(it.brand.length / 22), Math.ceil(FILE_LABEL[it.basis].length / 24)) : 1;
    row.height = 6 + lines * 13;
  }
  const tr = last + 1; ws.mergeCells("A" + tr + ":G" + tr);
  const tl = put("A" + tr, "Total replacement cost", { bold: true }); tl.alignment = { horizontal: "right", vertical: "middle" }; tl.border = box; tl.fill = solid(pale);
  const tv = put("H" + tr, { formula: "SUM(H" + first + ":H" + last + ")", result: grand }, { bold: true }); tv.numFmt = money; tv.border = box; tv.fill = solid(pale); tv.alignment = { horizontal: "right", vertical: "middle" }; ws.getRow(tr).height = 22;
  const fr = tr + 2; ws.mergeCells("A" + fr + ":K" + fr);
  const ft = put("A" + fr, 'About the prices: each price is an estimate of what a similar new item costs today, before sales tax, delivery and depreciation. "Estimated by photo" means the item and its price were judged from photos. "Manual adjustment" means the insured supplied details about the item (brand, size, material or age) or entered the price. "Priced from" names the store whose listing the price was taken from on the date prepared, with a link to that listing. Store prices change, so the listing may show a different price later. Full link addresses are on the Price Links tab. "No listing attached" means the price is an estimate with no store listing behind it. The insurer decides payment under the policy. ClearFund Claim List is a documentation service, not a public adjuster or an insurance company.', { size: 9, color: { argb: "FF56677A" } });
  ft.alignment = { wrapText: true, vertical: "top" }; ws.getRow(fr).height = 76;
  if (st.purchaseId) { ws.mergeCells("A" + (fr + 1) + ":K" + (fr + 1)); put("A" + (fr + 1), "ClearFund Claim List purchase ID: " + st.purchaseId, { size: 8, color: { argb: "FF56677A" } }); }
  if (st.left.length) {
    const w2 = wb.addWorksheet("Not Claimed"); w2.getColumn(1).width = 38; w2.getColumn(2).width = 80;
    w2.getCell("A1").value = "Seen in the photos but not claimed as contents"; w2.getCell("A1").font = F({ size: 14, bold: true, color: { argb: navy } });
    ["Item", "Reason"].forEach((h, i) => { const c = w2.getCell(3, i + 1); c.value = h; c.font = F({ bold: true, color: { argb: "FFFFFFFF" } }); c.fill = solid(navy); c.border = box; });
    st.left.forEach((l, n) => { [l.item, l.reason].forEach((v, i) => { const c = w2.getCell(4 + n, i + 1); c.value = v; c.font = F(); c.border = box; c.alignment = { wrapText: true, vertical: "top" }; }); w2.getRow(4 + n).height = 6 + 13 * Math.max(1, Math.ceil(l.reason.length / 84)); });
  }
  const ln = st.items.map((it, n) => [n, it]).filter(([, it]) => linked(it));
  if (ln.length) {
    const w3 = wb.addWorksheet("Price Links", { pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    [8, 40, 22, 14, 90].forEach((w, i) => w3.getColumn(i + 1).width = w);
    w3.getCell("A1").value = "Where each price came from"; w3.getCell("A1").font = F({ size: 14, bold: true, color: { argb: navy } });
    w3.getCell("A2").value = "If a store name on the Contents List does not open when tapped, copy the link address below into a web browser."; w3.getCell("A2").font = F({ color: { argb: "FF56677A" } });
    ["Item no.", "Item", "Store", "Price (each)", "Link address"].forEach((h, i) => { const c = w3.getCell(4, i + 1); c.value = h; c.font = F({ bold: true, color: { argb: "FFFFFFFF" } }); c.fill = solid(navy); c.border = box; });
    ln.forEach(([n, it], k) => {
      const r = 5 + k, vals = [n + 1, (it.brand ? it.brand + " " : "") + it.item, it.store, it.price, null];
      vals.forEach((v, i) => { const c = w3.getCell(r, i + 1); if (v !== null) c.value = v; c.font = F(); c.border = box; c.alignment = { wrapText: true, vertical: "top", horizontal: i === 0 ? "center" : i === 3 ? "right" : "left" }; });
      w3.getCell(r, 4).numFmt = money;
      const u = w3.getCell(r, 5); u.value = { text: it.url, hyperlink: it.url }; u.font = F({ color: { argb: "FF1565C0" }, underline: true });
      w3.getRow(r).height = 6 + 13 * Math.max(1, Math.ceil(it.url.length / 95), Math.ceil(vals[1].length / 42));
    });
  }
  if (st.purchaseId) { const wp = wb.addWorksheet("Purchase", { state: "hidden" }); wp.getCell("A1").value = st.purchaseId; }
  return wb.xlsx.writeBuffer();
}

const cellText = v => v == null ? "" : v instanceof Date ? v.toISOString().slice(0, 10) : typeof v === "object" ? String(v.text != null ? v.text : v.result != null ? v.result : "") : String(v);
const cellNum = v => { const n = Number(v != null && typeof v === "object" ? v.result : v); return isFinite(n) ? n : NaN; };
export async function readXlsx(X, buf) {
  const wb = new X.Workbook(); await wb.xlsx.load(buf);
  const ws = wb.getWorksheet("Contents List") || wb.worksheets[0]; if (!ws) throw new Error("no sheet");
  let hr = 0; for (let r = 1; r <= Math.min(ws.rowCount, 40); r++) if (cellText(ws.getCell(r, 3).value).trim().toLowerCase() === "item description") { hr = r; break; }
  if (!hr) throw new Error("no header");
  let loss = "", dateOfLoss = "";
  for (let r = 1; r < hr; r++) {
    const k = cellText(ws.getCell(r, 1).value).trim().toLowerCase();
    if (k === "type of loss") loss = cellText(ws.getCell(r, 3).value).trim();
    if (k === "date of loss") dateOfLoss = cellText(ws.getCell(r, 3).value).trim();
  }
  const items = [];
  for (let r = hr + 1; r <= ws.rowCount; r++) {
    const item = cellText(ws.getCell(r, 3).value).trim(); if (!item) continue;
    if (cellText(ws.getCell(r, 1).value).toLowerCase().includes("total")) break;
    const price = cellNum(ws.getCell(r, 7).value), qty = cellNum(ws.getCell(r, 5).value), orig = cellNum(ws.getCell(r, 12).value);
    const src = cellText(ws.getCell(r, 9).value).trim().toLowerCase(), link = ws.getCell(r, 10).value;
    const changed = isNaN(orig) || Math.abs(orig - (isNaN(price) ? 0 : price)) > 0.004;
    const url = link && typeof link === "object" && link.hyperlink ? String(link.hyperlink) : "";
    const it = { room: cellText(ws.getCell(r, 2).value).trim(), brand: cellText(ws.getCell(r, 4).value).trim(), item, qty: Math.max(1, Math.round(isNaN(qty) ? 1 : qty)), age: cellText(ws.getCell(r, 6).value).trim(),
      price: Math.max(0, isNaN(price) ? 0 : price), basis: changed ? "own" : src.startsWith("estimated") ? "estimated" : "confirmed", note: cellText(ws.getCell(r, 11).value).trim(),
      store: !changed && url ? cellText(link).trim() : "", url: !changed ? url : "" };
    if (changed && !it.note) it.note = "Price entered manually. No supporting document attached.";
    items.push(it);
  }
  const left = [], w2 = wb.getWorksheet("Not Claimed");
  if (w2) for (let r = 4; r <= w2.rowCount; r++) { const a = cellText(w2.getCell(r, 1).value).trim(); if (a) left.push({ item: a, reason: cellText(w2.getCell(r, 2).value).trim() }); }
  const wp = wb.getWorksheet("Purchase");
  const purchaseId = wp ? cellText(wp.getCell("A1").value).trim() : "";
  return { items, left, loss, dateOfLoss, purchaseId };
}

const usd = n => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const PDF_FOOTER = "Prices are estimated replacement cost for a similar new item of like kind and quality, before tax, delivery and depreciation. Where a store is named, the price was taken from that store's listing on the date prepared and may have changed since. Lines with no listing are estimates. What the insurer pays is decided under the policy. ClearFund Claim List is a documentation service and is not a public adjuster or an insurance company.";

/** jsPDF + jspdf-autotable injected. Returns ArrayBuffer. */
export function makePdf(jsPDF, autoTable, st, day) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(20, 51, 82);
  doc.text("Personal Property Contents List", 36, 44);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(86, 103, 122);
  doc.text("Prepared with ClearFund Claim List on " + day + ". Type of loss: " + (st.loss || "") + ". Every item is listed for replacement.", 36, 62);
  doc.setTextColor(19, 40, 61);
  doc.text("Insured name: ____________________________", 36, 84);
  doc.text("Claim number: ____________________", 330, 84);
  doc.text("Date of loss: " + (st.dateOfLoss || "____________"), 560, 84);
  const body = st.items.map((it, n) => {
    const desc = (it.brand ? it.brand + " " : "") + it.item + (it.note ? "\nNote: " + it.note : "");
    return [n + 1, it.room, desc, it.qty, it.age, usd(it.price), usd(Math.round(it.qty * it.price * 100) / 100), FILE_LABEL[it.basis], linked(it) ? it.store : "No listing"];
  });
  const grand = Math.round(st.items.reduce((t, r) => t + r.qty * r.price, 0) * 100) / 100;
  autoTable(doc, {
    startY: 100, head: [["No.", "Room", "Item description", "Qty", "Age", "Cost each", "Total", "Source of price", "Priced from"]], body,
    foot: [[{ content: "Total replacement cost", colSpan: 6, styles: { halign: "right" } }, usd(grand), "", ""]], showFoot: "lastPage",
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 4, valign: "top", textColor: [19, 40, 61] },
    headStyles: { fillColor: [20, 51, 82], textColor: 255 }, footStyles: { fillColor: [227, 242, 253], textColor: [20, 51, 82], fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 28 }, 2: { cellWidth: 230 }, 3: { halign: "center", cellWidth: 30 }, 5: { halign: "right" }, 6: { halign: "right" } },
    margin: { left: 36, right: 36, bottom: 70 },
    didParseCell: (d) => { if (d.section === "body" && d.column.index === 8 && linked(st.items[d.row.index])) d.cell.styles.textColor = [21, 101, 192]; },
    didDrawCell: (d) => { if (d.section === "body" && d.column.index === 8) { const it = st.items[d.row.index]; if (linked(it)) doc.link(d.cell.x, d.cell.y, d.cell.width, d.cell.height, { url: it.url }); } },
    didDrawPage: () => {
      const H = doc.internal.pageSize.getHeight();
      doc.setFontSize(7.5); doc.setTextColor(86, 103, 122);
      doc.text(doc.splitTextToSize(PDF_FOOTER, W - 72), 36, H - 50);
      const id = [st.dateOfLoss ? "Date of loss: " + st.dateOfLoss : "", st.purchaseId ? "Purchase ID: " + st.purchaseId : ""].filter(Boolean).join("   ");
      if (id) doc.text(id, 36, H - 18);
    },
  });
  return doc.output("arraybuffer");
}
