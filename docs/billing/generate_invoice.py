#!/usr/bin/env python3
"""Build the Abracerabra professional-charges invoice.

The agreed amount payable is Rs 2,00,000. Billed hours are a whole-hour
price build-up for that figure, not a clocked timesheet. GST is not
charged: no supplier GSTIN is printed. Sheet 3 shows the 18% inclusive
composition so the arithmetic is visible.
"""

from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

OUT = Path(__file__).resolve().parent
RATE = Decimal("2500.00")
CONTRACT = Decimal("200000.00")

# (code, particular, billed hours, one-line scope)
LINES = [
    (
        "01",
        "Discovery and RFQ workflow design",
        Decimal(6),
        "Buyer path from catalog to quote cart, lead, and logistics. No checkout and no online payment.",
    ),
    (
        "02",
        "Visual system and responsive layout",
        Decimal(10),
        "Header, footer, product cards, and the page frame for catalog, cart, and forms.",
    ),
    (
        "03",
        "Storefront pages",
        Decimal(14),
        "Home, catalog, category, product detail, and not-found. Indicative INR price, MOQ, and lot size.",
    ),
    (
        "04",
        "RFQ cart and lead capture",
        Decimal(10),
        "Quantities, MOQ checks, buyer form, and the confirmation state after submit.",
    ),
    (
        "05",
        "Logistics step",
        Decimal(4),
        "Delivery address, landmark, location, and mode of transport, tied to the lead.",
    ),
    (
        "06",
        "Four-language interface",
        Decimal(8),
        "English, Japanese, French, and Arabic, including Arabic script.",
    ),
    (
        "07",
        "Product catalog",
        Decimal(6),
        "28 products in 6 categories, with indicative prices in INR.",
    ),
    (
        "08",
        "Quote API and Sheets webhook",
        Decimal(8),
        "Health, products, and quote routes. Lead id, RFQ reference, and webhook. Sender key stays out of the repo.",
    ),
    (
        "09",
        "Sheet sync for the receptionist",
        Decimal(4),
        "Products, Leads, and Logistics tabs, plus the helpers that sync the catalog and the lead rows.",
    ),
    (
        "10",
        "Hosting preparation",
        Decimal(6),
        "Vercel project wiring, serverless /api routes, and the deployment notes.",
    ),
    (
        "11",
        "Training and post-hosting close-out",
        Decimal(4),
        "Production build check, owner training, and finalization once the site is set.",
    ),
]

ADV_P, HOST_P, FINAL_P = Decimal(40), Decimal(30), Decimal(30)


def money(n: Decimal) -> str:
    """Indian grouping, always two decimals. Negatives in parentheses."""
    n = n.quantize(Decimal("0.01"))
    neg = n < 0
    whole, frac = f"{abs(n):.2f}".split(".")
    if len(whole) > 3:
        head, tail = whole[:-3], whole[-3:]
        groups = []
        while len(head) > 2:
            groups.append(head[-2:])
            head = head[:-2]
        if head:
            groups.append(head)
        whole = ",".join(reversed(groups)) + "," + tail
    body = f"{whole}.{frac}"
    return f"({body})" if neg else body


def qty(n: Decimal) -> str:
    n = n.quantize(Decimal("0.01"))
    if n == n.to_integral_value():
        return str(int(n))
    return f"{n:.2f}"


def words_under_100(n: int) -> str:
    ones = [
        "",
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
        "Nine",
        "Ten",
        "Eleven",
        "Twelve",
        "Thirteen",
        "Fourteen",
        "Fifteen",
        "Sixteen",
        "Seventeen",
        "Eighteen",
        "Nineteen",
    ]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
    if n < 20:
        return ones[n]
    ten, one = divmod(n, 10)
    return tens[ten] if one == 0 else f"{tens[ten]} {ones[one]}"


def words_under_1000(n: int) -> str:
    hundred, rest = divmod(n, 100)
    parts = []
    if hundred:
        parts.append(f"{words_under_100(hundred)} Hundred")
    if rest:
        parts.append(words_under_100(rest))
    return " ".join(parts)


def rupees_words(n: Decimal) -> str:
    n = n.quantize(Decimal("0.01"))
    if n < 0:
        raise ValueError("negative amount")
    rupees = int(n)
    paise = int((n - rupees) * 100)
    if rupees == 0 and paise == 0:
        return "Zero Rupees Only"
    crore, rupees = divmod(rupees, 10000000)
    lakh, rupees = divmod(rupees, 100000)
    thousand, rupees = divmod(rupees, 1000)
    parts = []
    if crore:
        parts.append(f"{words_under_1000(crore)} Crore")
    if lakh:
        parts.append(f"{words_under_1000(lakh)} Lakh")
    if thousand:
        parts.append(f"{words_under_1000(thousand)} Thousand")
    if rupees:
        parts.append(words_under_1000(rupees))
    text = " ".join(parts) if parts else "Zero"
    if paise:
        return f"Indian Rupees {text} and Paise {words_under_100(paise)} Only"
    return f"Indian Rupees {text} Only"


def split_gross(amount: Decimal) -> tuple[Decimal, Decimal, Decimal]:
    advance = (amount * ADV_P / Decimal(100)).quantize(Decimal("0.01"))
    hosting = (amount * HOST_P / Decimal(100)).quantize(Decimal("0.01"))
    final = (amount - advance - hosting).quantize(Decimal("0.01"))
    return advance, hosting, final


def gst_composition(gross: Decimal) -> dict:
    """18% inclusive composition, half-up to the paisa, one-paisa round-off."""
    raw = gross * Decimal(100) / Decimal(118)
    taxable = raw.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    cgst_raw = taxable * Decimal("0.09")
    sgst_raw = taxable * Decimal("0.09")
    cgst = cgst_raw.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    sgst = sgst_raw.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    sub = taxable + cgst + sgst
    round_off = (gross - sub).quantize(Decimal("0.01"))
    return {
        "raw": raw,
        "taxable": taxable,
        "cgst_raw": cgst_raw,
        "sgst_raw": sgst_raw,
        "cgst": cgst,
        "sgst": sgst,
        "sub": sub,
        "round_off": round_off,
        "gross": gross,
    }


def apportion(total_paise: int, weights: list[int]) -> list[int]:
    """Split integer paise by gross weights. Remainder goes to the first part."""
    base = sum(weights)
    parts = [total_paise * w // base for w in weights]
    # largest remainder method
    remainders = [(total_paise * w % base, i) for i, w in enumerate(weights)]
    left = total_paise - sum(parts)
    for _, i in sorted(remainders, reverse=True):
        if left == 0:
            break
        parts[i] += 1
        left -= 1
    return parts


def paise(n: Decimal) -> int:
    return int((n.quantize(Decimal("0.01")) * 100).to_integral_value())


def from_paise(p: int) -> Decimal:
    return (Decimal(p) / Decimal(100)).quantize(Decimal("0.01"))


def build_rows():
    rows = []
    for code, name, hours, detail in LINES:
        amount = (hours * RATE).quantize(Decimal("0.01"))
        advance, hosting, final = split_gross(amount)
        rows.append(
            {
                "code": code,
                "name": name,
                "detail": detail,
                "hours": hours,
                "rate": RATE,
                "amount": amount,
                "advance": advance,
                "hosting": hosting,
                "final": final,
            }
        )
    return rows


def checks(rows):
    hours = sum((r["hours"] for r in rows), Decimal(0))
    amount = sum((r["amount"] for r in rows), Decimal(0))
    advance = sum((r["advance"] for r in rows), Decimal(0))
    hosting = sum((r["hosting"] for r in rows), Decimal(0))
    final = sum((r["final"] for r in rows), Decimal(0))
    assert hours * RATE == CONTRACT
    assert amount == CONTRACT
    assert advance + hosting + final == CONTRACT
    assert advance == Decimal("80000.00")
    assert hosting == Decimal("60000.00")
    assert final == Decimal("60000.00")
    for r in rows:
        assert r["advance"] + r["hosting"] + r["final"] == r["amount"]

    weights = [paise(advance), paise(hosting), paise(final)]
    comp = gst_composition(CONTRACT)
    assert comp["taxable"] + comp["cgst"] + comp["sgst"] + comp["round_off"] == CONTRACT

    taxable_parts = apportion(paise(comp["taxable"]), weights)
    cgst_parts = apportion(paise(comp["cgst"]), weights)
    sgst_parts = apportion(paise(comp["sgst"]), weights)
    # The 1 paisa of round-off sits on whichever installment is 1 paisa over.
    inst = []
    for i in range(3):
        sub = taxable_parts[i] + cgst_parts[i] + sgst_parts[i]
        gross_p = weights[i]
        round_p = gross_p - sub
        assert abs(round_p) <= 1
        inst.append(
            {
                "taxable": from_paise(taxable_parts[i]),
                "cgst": from_paise(cgst_parts[i]),
                "sgst": from_paise(sgst_parts[i]),
                "sub": from_paise(sub),
                "round_off": from_paise(round_p),
                "gross": from_paise(gross_p),
            }
        )
    assert sum(taxable_parts) == paise(comp["taxable"])
    assert sum(cgst_parts) == paise(comp["cgst"])
    assert sum(sgst_parts) == paise(comp["sgst"])
    assert sum(r["gross"] for r in inst) == CONTRACT
    return {
        "hours": hours,
        "amount": amount,
        "advance": advance,
        "hosting": hosting,
        "final": final,
        "gst": comp,
        "installments": inst,
    }


CSS = r"""
@page { size: A4; margin: 10mm 11mm 12mm 11mm; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: Inter, "Noto Sans", "Liberation Sans", sans-serif;
  color: #1a1814;
  font-size: 9pt;
  line-height: 1.35;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.sheet {
  position: relative;
  height: 272mm;
  break-after: page;
}
.sheet:last-child { break-after: auto; }
.bar {
  display: flex;
  justify-content: space-between;
  background: #1a1814;
  color: #f4f1ea;
  padding: 5px 10px;
  font-size: 8pt;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.mast {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 2px 10px;
  border-bottom: 2.5px solid #1a1814;
}
.mast h1 {
  font-family: "Liberation Serif", "Noto Serif", serif;
  font-size: 22pt;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin: 0 0 2px;
}
.mast .role { margin: 0; color: #5c564c; font-size: 8.5pt; }
.mast .inv {
  text-align: right;
}
.mast .inv .kicker {
  font-family: "Liberation Serif", serif;
  font-size: 18pt;
  letter-spacing: 0.16em;
  margin: 0;
}
.meta-line { margin: 1px 0; font-size: 8.5pt; }
.meta-line strong { font-weight: 650; }
.rule {
  border: 0;
  border-top: 0.6px solid #1a1814;
  margin: 2px 0 0;
}
.parties {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid #1a1814;
  border-top: 0;
  margin-top: 0;
}
.party { padding: 8px 10px 9px; }
.party + .party { border-left: 1px solid #1a1814; }
.party h2 {
  margin: 0 0 4px;
  font-size: 8pt;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.party .name { font-size: 11pt; font-weight: 650; margin: 0 0 2px; }
.party p { margin: 0; }
.party .legal { font-size: 8pt; color: #3f3a33; margin-top: 3px; }
.dues {
  display: grid;
  grid-template-columns: 1.3fr 1fr 1fr;
  border: 1px solid #1a1814;
  border-top: 0;
}
.due { padding: 7px 10px 8px; }
.due + .due { border-left: 1px solid #1a1814; }
.due .lbl {
  font-size: 7.5pt;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5c564c;
}
.due .amt {
  font-family: "Liberation Serif", serif;
  font-size: 14pt;
  margin-top: 1px;
}
.due.now { background: #f4f1ea; }
h3 {
  font-size: 8.5pt;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin: 8px 0 3px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8pt;
}
th, td {
  border: 0.6px solid #1a1814;
  padding: 2px 5px;
  vertical-align: top;
}
tr, .formula, .callout, .sign, .words { break-inside: avoid; }
th {
  background: #1a1814;
  color: #f4f1ea;
  font-weight: 600;
  text-align: left;
  letter-spacing: 0.04em;
  font-size: 7.4pt;
  text-transform: uppercase;
}
td.num, th.num {
  text-align: right;
  font-family: "JetBrains Mono", "Liberation Mono", monospace;
  font-variant-numeric: tabular-nums;
  font-weight: 450;
  white-space: nowrap;
}
th.num { font-family: Inter, "Noto Sans", sans-serif; }
tr.total td { background: #f4f1ea; font-weight: 650; }
.words {
  border: 1px solid #1a1814;
  border-top: 0;
  padding: 6px 8px;
  background: #f4f1ea;
  font-size: 8.5pt;
}
.note { margin: 6px 0 0; font-size: 8pt; color: #3f3a33; }
.formula {
  font-family: "JetBrains Mono", "Liberation Mono", monospace;
  font-size: 7.6pt;
  line-height: 1.35;
  background: #f7f5f1;
  border: 0.6px solid #1a1814;
  padding: 6px 8px;
  white-space: pre;
  margin: 0;
}
.small { font-size: 8pt; margin: 4px 0; }
ul.clean { margin: 4px 0 0; padding-left: 16px; }
ul.clean li { margin: 1px 0; }
.sign {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-top: 12px;
}
.sign .box {
  border: 1px solid #1a1814;
  min-height: 62px;
  padding: 8px 10px;
}
.sign .who { font-size: 8pt; letter-spacing: 0.08em; text-transform: uppercase; color: #5c564c; }
.sign .line { margin-top: 26px; border-top: 0.6px solid #1a1814; padding-top: 3px; font-size: 8pt; }
.foot {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  border-top: 1.5px solid #1a1814;
  padding-top: 3px;
  display: flex;
  justify-content: space-between;
  font-size: 7.5pt;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #5c564c;
}
.sheet-title {
  font-family: "Liberation Serif", serif;
  font-size: 13pt;
  margin: 8px 0 2px;
}
.lede { margin: 0 0 6px; }
.callout {
  border: 1.5px solid #1a1814;
  padding: 7px 9px;
  margin: 6px 0;
}
.callout strong { font-size: 9.5pt; }
"""


def render(rows, tot) -> str:
    gst = tot["gst"]
    inst = tot["installments"]
    labels = [
        ("1", "Advance", "On acceptance of this invoice, before hosting", "40%", tot["advance"]),
        ("2", "During hosting", "While production hosting is being completed", "30%", tot["hosting"]),
        ("3", "Post-hosting", "After the site is set, training is done, and finalization is closed", "30%", tot["final"]),
    ]
    balance = CONTRACT
    ledger_rows = []
    for code, stage, when, pct, amt in labels:
        closing = balance - amt
        ledger_rows.append((code, stage, when, pct, amt, balance, closing))
        balance = closing

    line_trs = []
    for r in rows:
        line_trs.append(
            "<tr>"
            f"<td>{r['code']}</td>"
            f"<td>{r['name']}</td>"
            f"<td class='num'>{qty(r['hours'])}</td>"
            f"<td class='num'>{money(r['rate'])}</td>"
            f"<td class='num'>{money(r['amount'])}</td>"
            "</tr>"
        )
    matrix_trs = []
    for r in rows:
        cross = r["advance"] + r["hosting"] + r["final"]
        matrix_trs.append(
            "<tr>"
            f"<td>{r['code']}</td>"
            f"<td>{r['name']}</td>"
            f"<td class='num'>{money(r['amount'])}</td>"
            f"<td class='num'>{money(r['advance'])}</td>"
            f"<td class='num'>{money(r['hosting'])}</td>"
            f"<td class='num'>{money(r['final'])}</td>"
            f"<td class='num'>{money(cross)}</td>"
            "</tr>"
        )
    scope_rows = []
    for r in rows:
        scope_rows.append(
            "<tr>"
            f"<td>{r['code']}</td>"
            f"<td><strong>{r['name']}</strong><br>{r['detail']}</td>"
            f"<td class='num'>{qty(r['hours'])}</td>"
            f"<td class='num'>{qty(r['hours'])} × {money(r['rate'])}<br>= {money(r['amount'])}</td>"
            "</tr>"
        )
    ledger_html = []
    for code, stage, when, pct, amt, opening, closing in ledger_rows:
        ledger_html.append(
            "<tr>"
            f"<td>{code}</td>"
            f"<td>{stage}<br><span>{when}</span></td>"
            f"<td class='num'>{pct}</td>"
            f"<td class='num'>{money(opening)}</td>"
            f"<td class='num'>{money(amt)}</td>"
            f"<td class='num'>{money(closing)}</td>"
            "</tr>"
        )
    inst_names = ["Advance", "During hosting", "Post-hosting"]
    inst_html = []
    for name, part in zip(inst_names, inst):
        inst_html.append(
            "<tr>"
            f"<td>{name}</td>"
            f"<td class='num'>{money(part['taxable'])}</td>"
            f"<td class='num'>{money(part['cgst'])}</td>"
            f"<td class='num'>{money(part['sgst'])}</td>"
            f"<td class='num'>{money(part['sub'])}</td>"
            f"<td class='num'>{money(part['round_off'])}</td>"
            f"<td class='num'>{money(part['gross'])}</td>"
            "</tr>"
        )

    example = rows[0]
    ex_adv, ex_host, ex_fin = example["advance"], example["hosting"], example["final"]

    raw_s = f"{gst['raw']:.10f}"
    cgst_raw_s = f"{gst['cgst_raw']:.6f}"
    sgst_raw_s = f"{gst['sgst_raw']:.6f}"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Invoice ABR/2026-27/001 — Abracerabra</title>
<style>{CSS}</style>
</head>
<body>

<section class="sheet">
  <div class="bar">
    <span>Original for recipient</span>
    <span>Commercial invoice · not a GST tax invoice</span>
  </div>
  <div class="mast">
    <div>
      <h1>Pavan Ram</h1>
      <p class="role">Design and development of software</p>
      <p class="role">shantzapav@gmail.com</p>
      <p class="role">Supplier GSTIN: not printed · GST not charged</p>
    </div>
    <div class="inv">
      <p class="kicker">INVOICE</p>
      <p class="meta-line"><strong>No.</strong> ABR/2026-27/001</p>
      <p class="meta-line"><strong>Date</strong> 07 October 2026</p>
      <p class="meta-line"><strong>Year</strong> 2026–27</p>
    </div>
  </div>
  <hr class="rule">

  <div class="parties">
    <div class="party">
      <h2>Billed by</h2>
      <p class="name">Pavan Ram</p>
      <p>Professional services for the Abracerabra B2B request-for-quote platform.</p>
      <p class="legal">PAN and GSTIN of the supplier are not printed on this copy. Bank and UPI details are sent with each payment demand, not on this invoice.</p>
    </div>
    <div class="party">
      <h2>Billed to</h2>
      <p class="name">Abracerabra</p>
      <p>Legal name: KRISHNAMURTHY BADARINATHA</p>
      <p>Manufacturer · Bengaluru, Karnataka</p>
      <p class="legal">GSTIN 29AGUPB3940N1ZS · IEC / PAN AGUPB3940N · State code 29<br>Place of supply: Karnataka. Street address is the principal place on the GST registration.</p>
    </div>
  </div>

  <div class="dues">
    <div class="due">
      <div class="lbl">Contract value</div>
      <div class="amt">₹ {money(CONTRACT)}</div>
    </div>
    <div class="due now">
      <div class="lbl">Due now · Installment 1, advance</div>
      <div class="amt">₹ {money(tot["advance"])}</div>
    </div>
    <div class="due">
      <div class="lbl">Balance after the advance</div>
      <div class="amt">₹ {money(CONTRACT - tot["advance"])}</div>
    </div>
  </div>

  <h3>Charges</h3>
  <table>
    <thead>
      <tr>
        <th style="width:8%">No.</th>
        <th>Particulars</th>
        <th class="num" style="width:10%">Hours</th>
        <th class="num" style="width:14%">Rate ₹</th>
        <th class="num" style="width:16%">Amount ₹</th>
      </tr>
    </thead>
    <tbody>
      {''.join(line_trs)}
      <tr class="total">
        <td></td>
        <td>Total · {qty(tot["hours"])} billed hours × ₹ {money(RATE)}</td>
        <td class="num">{qty(tot["hours"])}</td>
        <td class="num">{money(RATE)}</td>
        <td class="num">{money(tot["amount"])}</td>
      </tr>
    </tbody>
  </table>
  <div class="words">
    <strong>Amount payable:</strong> ₹ {money(CONTRACT)}<br>
    <strong>In words:</strong> {rupees_words(CONTRACT)}<br>
    <strong>Of which due on acceptance:</strong> ₹ {money(tot["advance"])} — {rupees_words(tot["advance"])}
  </div>
  <p class="note">SAC 998314 — Information technology design and development services. Reverse charge: No. Currency: INR. Each amount = billed hours × ₹ {money(RATE)}. Page 2 is the hour build-up. Page 3 is the line-by-line split and the running balance. Page 4 is the 18% composition. GST is not added on top of ₹ {money(CONTRACT)}.</p>
  <h3>Three installments of the same ₹ {money(CONTRACT)}</h3>
  <table>
    <thead>
      <tr>
        <th>No.</th>
        <th>Stage</th>
        <th>When it is payable</th>
        <th class="num">Share</th>
        <th class="num">Amount ₹</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>Advance</td>
        <td>On acceptance of this invoice, before hosting</td>
        <td class="num">40%</td>
        <td class="num">{money(tot["advance"])}</td>
      </tr>
      <tr>
        <td>2</td>
        <td>During hosting</td>
        <td>While production hosting is being completed</td>
        <td class="num">30%</td>
        <td class="num">{money(tot["hosting"])}</td>
      </tr>
      <tr>
        <td>3</td>
        <td>Post-hosting</td>
        <td>After the site is set, training is done, and finalization is closed</td>
        <td class="num">30%</td>
        <td class="num">{money(tot["final"])}</td>
      </tr>
      <tr class="total">
        <td></td>
        <td>Total payable</td>
        <td>40 + 30 + 30 = 100</td>
        <td class="num">100%</td>
        <td class="num">{money(CONTRACT)}</td>
      </tr>
    </tbody>
  </table>
  <p class="small">Amount due with this copy is installment 1, ₹ {money(tot["advance"])}. Installments 2 and 3 are demanded later against invoice ABR/2026-27/001.</p>
  <div class="foot"><span>ABR/2026-27/001 · Abracerabra</span><span>Page 1 of 4</span></div>
</section>

<section class="sheet">
  <div class="bar">
    <span>ABR/2026-27/001 · Page 2 of 4</span>
    <span>Effort statement</span>
  </div>
  <p class="sheet-title">Effort statement</p>
  <p class="lede">Billed hours are a whole-hour estimate used to build the price. They are not a clocked timesheet. Blocks of 30 or 40 minutes are not listed on their own; they sit inside the hour charged for that line.</p>
  <table>
    <thead>
      <tr>
        <th style="width:8%">No.</th>
        <th>What the hour covers</th>
        <th class="num" style="width:10%">Hours</th>
        <th class="num" style="width:28%">Hours × rate</th>
      </tr>
    </thead>
    <tbody>
      {''.join(scope_rows)}
      <tr class="total">
        <td></td>
        <td>Cross-add of billed hours and amounts</td>
        <td class="num">{qty(tot["hours"])}</td>
        <td class="num">{money(tot["amount"])}</td>
      </tr>
    </tbody>
  </table>
  <p class="small">Identity: {qty(tot["hours"])} × ₹ {money(RATE)} = ₹ {money(tot["hours"] * RATE)}. Difference against the contract value: ₹ {money(tot["hours"] * RATE - CONTRACT)}.</p>

  <h3>Catalog counted in line 07</h3>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th class="num">Products</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Grinding wheels</td><td class="num">5</td></tr>
      <tr><td>Honing stones</td><td class="num">7</td></tr>
      <tr><td>Honing sticks</td><td class="num">5</td></tr>
      <tr><td>Cutting wheels</td><td class="num">4</td></tr>
      <tr><td>Cutting discs</td><td class="num">2</td></tr>
      <tr><td>Specialties</td><td class="num">5</td></tr>
      <tr class="total"><td>5 + 7 + 5 + 4 + 2 + 5</td><td class="num">28</td></tr>
    </tbody>
  </table>
  <p class="small">Line 07 charges 6 hours for loading these 28 products and 6 categories. The count is the catalog in the application, not a separate fee.</p>
  <div class="foot"><span>ABR/2026-27/001 · Abracerabra</span><span>Page 2 of 4</span></div>
</section>

<section class="sheet">
  <div class="bar">
    <span>ABR/2026-27/001 · Page 3 of 4</span>
    <span>Installment split</span>
  </div>
  <p class="sheet-title">How each line is split</p>
  <h3>Worked example, line 01</h3>
  <pre class="formula">Hours × rate
  {qty(example["hours"])} × {money(example["rate"])} = {money(example["amount"])}

Advance      = {money(example["amount"])} × 40/100 = {money(ex_adv)}
Hosting      = {money(example["amount"])} × 30/100 = {money(ex_host)}
Post-hosting = {money(example["amount"])} × 30/100 = {money(ex_fin)}
Cross-add    = {money(ex_adv)} + {money(ex_host)} + {money(ex_fin)} = {money(ex_adv + ex_host + ex_fin)}</pre>

  <h3>Every line, split 40 / 30 / 30</h3>
  <table>
    <thead>
      <tr>
        <th>No.</th>
        <th>Particulars</th>
        <th class="num">Amount ₹</th>
        <th class="num">Advance 40%</th>
        <th class="num">Hosting 30%</th>
        <th class="num">Final 30%</th>
        <th class="num">Cross-add</th>
      </tr>
    </thead>
    <tbody>
      {''.join(matrix_trs)}
      <tr class="total">
        <td></td>
        <td>Total</td>
        <td class="num">{money(tot["amount"])}</td>
        <td class="num">{money(tot["advance"])}</td>
        <td class="num">{money(tot["hosting"])}</td>
        <td class="num">{money(tot["final"])}</td>
        <td class="num">{money(tot["advance"] + tot["hosting"] + tot["final"])}</td>
      </tr>
    </tbody>
  </table>
  <p class="small">40 + 30 + 30 = 100. ₹ {money(tot["advance"])} + ₹ {money(tot["hosting"])} + ₹ {money(tot["final"])} = ₹ {money(CONTRACT)}. The cross-add column equals the amount column on every line.</p>

  <h3>Installment ledger</h3>
  <p class="lede">One invoice, three demands. The amount due with this copy is installment 1. Installments 2 and 3 are demanded against this same invoice number when the stage is reached.</p>
  <table>
    <thead>
      <tr>
        <th>No.</th>
        <th>Stage and when it is payable</th>
        <th class="num">Share</th>
        <th class="num">Opening ₹</th>
        <th class="num">This demand ₹</th>
        <th class="num">Balance ₹</th>
      </tr>
    </thead>
    <tbody>
      {''.join(ledger_html)}
    </tbody>
  </table>
  <pre class="formula">2,00,000.00 − {money(tot["advance"])} = {money(CONTRACT - tot["advance"])}
{money(CONTRACT - tot["advance"])} − {money(tot["hosting"])} = {money(CONTRACT - tot["advance"] - tot["hosting"])}
{money(CONTRACT - tot["advance"] - tot["hosting"])} − {money(tot["final"])} = {money(CONTRACT - tot["advance"] - tot["hosting"] - tot["final"])}</pre>
  <div class="foot"><span>ABR/2026-27/001 · Abracerabra</span><span>Page 3 of 4</span></div>
</section>

<section class="sheet">
  <div class="bar">
    <span>ABR/2026-27/001 · Page 4 of 4</span>
    <span>GST working and acceptance</span>
  </div>
  <p class="sheet-title">GST composition of the agreed price</p>
  <div class="callout">
    <strong>GST is not charged on this invoice.</strong>
    No supplier GSTIN is printed, so this is not a tax invoice under the CGST Act and input tax credit must not be claimed on it. The working below only shows how ₹ {money(CONTRACT)} splits if treated as a price inclusive of 18% (CGST 9% + SGST 9%, intra-state, Karnataka, SAC 998314). Nothing is added on top.
  </div>
  <pre class="formula">Contract value (C)                         {money(CONTRACT)}
Rate (r)                                   18%
  CGST                                     9%
  SGST                                     9%
  IGST                                     nil — place of supply is Karnataka, same state

Taxable value = C × 100 / (100 + 18)
              = {money(CONTRACT)} × 100 / 118
              = {raw_s}
Rounded half-up to the paisa               {money(gst["taxable"])}

CGST = {money(gst["taxable"])} × 0.09 = {cgst_raw_s}
Rounded half-up to the paisa               {money(gst["cgst"])}
SGST = {money(gst["taxable"])} × 0.09 = {sgst_raw_s}
Rounded half-up to the paisa               {money(gst["sgst"])}

Taxable + CGST + SGST                      {money(gst["sub"])}
Round off                                  {money(gst["round_off"])}
Amount payable                             {money(gst["gross"])}</pre>

  <h3>Same composition, by installment</h3>
  <p class="small">Taxable value, CGST, and SGST are shared in proportion to ₹ 80,000 / ₹ 60,000 / ₹ 60,000. The one-paisa round-off sits on the installment that would otherwise be a paisa over, so each demand stays a round rupee amount.</p>
  <table>
    <thead>
      <tr>
        <th>Installment</th>
        <th class="num">Taxable ₹</th>
        <th class="num">CGST 9%</th>
        <th class="num">SGST 9%</th>
        <th class="num">Subtotal</th>
        <th class="num">Round off</th>
        <th class="num">Payable ₹</th>
      </tr>
    </thead>
    <tbody>
      {''.join(inst_html)}
      <tr class="total">
        <td>Total</td>
        <td class="num">{money(gst["taxable"])}</td>
        <td class="num">{money(gst["cgst"])}</td>
        <td class="num">{money(gst["sgst"])}</td>
        <td class="num">{money(gst["sub"])}</td>
        <td class="num">{money(gst["round_off"])}</td>
        <td class="num">{money(CONTRACT)}</td>
      </tr>
    </tbody>
  </table>

  <h3>What is covered</h3>
  <ul class="clean">
    <li>React and Vite storefront: home, catalog, category, product, RFQ cart, logistics, not-found.</li>
    <li>28 products, 6 categories, indicative INR prices, MOQ and lot size. No online payment.</li>
    <li>English, Japanese, French, and Arabic.</li>
    <li>Serverless routes: GET /api/health, GET /api/products, POST /api/quote, with RFQ references and the Sheets webhook.</li>
    <li>Vercel configuration and deployment notes. Hosting charges of the platform itself, a custom domain, and the webhook sender key are not in this ₹ {money(CONTRACT)}.</li>
  </ul>

  <h3>Declaration</h3>
  <p class="small">I state that the price on this invoice is ₹ {money(CONTRACT)} ({rupees_words(CONTRACT)}), payable in three installments of ₹ {money(tot["advance"])}, ₹ {money(tot["hosting"])}, and ₹ {money(tot["final"])}. Billed hours are the price build-up on page 2. GST is not charged. Quote ABR/2026-27/001 on the payment advice.</p>

  <div class="sign">
    <div class="box">
      <div class="who">For the supplier</div>
      <div class="line">Pavan Ram · Authorised signatory<br>Date: 07 October 2026</div>
    </div>
    <div class="box">
      <div class="who">Accepted for Abracerabra</div>
      <div class="line">Krishnamurthy Badarinatha<br>Signature and date</div>
    </div>
  </div>
  <p class="note">E. &amp; O. E. This copy is the original for the recipient. A duplicate may be printed for the supplier.</p>
  <div class="foot"><span>ABR/2026-27/001 · Abracerabra · ₹ {money(CONTRACT)}</span><span>Page 4 of 4</span></div>
</section>

</body>
</html>
"""
    return html


def main():
    rows = build_rows()
    tot = checks(rows)
    html = render(rows, tot)
    html_path = OUT / "invoice.html"
    html_path.write_text(html, encoding="utf-8")
    print(f"wrote {html_path}")
    print("contract", money(CONTRACT), rupees_words(CONTRACT))
    print("hours", tot["hours"], "advance", money(tot["advance"]))
    g = tot["gst"]
    print("taxable", money(g["taxable"]), "cgst", money(g["cgst"]), "sgst", money(g["sgst"]), "round", money(g["round_off"]))


if __name__ == "__main__":
    main()
