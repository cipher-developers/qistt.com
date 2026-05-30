import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Helper to escape HTML
function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;



    const planId = Number(id);

      if (!planId) {
    return NextResponse.json({ error: "Invalid plan id" }, { status: 400 });
  }


    // Fetch plan, customer, item, and related info

    const plan = await prisma.installmentPlan.findUnique({
      where: { id: planId },
      include: {
        customer: true,
        item: { include: { category: true } },
        tenant: true,
      },
    });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }


    // Format today's date
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getFullYear()}`;

    const tenant = plan.tenant;
    const html = `
    <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(tenant.name)} - Installment Form</title>

<style>
:root {
  --primary: #1e3a8a;
  --accent: #2563eb;
  --border: #cbd5e1;
  --bg-soft: #f8fafc;
  --text: #1e293b;
  --muted: #64748b;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  background: #e2e8f0;
  margin: 0;
  color: var(--text);
}

@media print {
  body { background: white !important; }
  .container { box-shadow: none !important; }
}


.container {
  max-width: 820px;
  margin: 20px auto;
  background: #fff;
  border-radius: 10px;
  border: 1px solid var(--border);
  overflow: hidden;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

@media print {
  body { background: white !important; }
  .container {
    box-shadow: none !important;
    min-height: 100vh;
    height: 297mm !important;
    max-width: 210mm !important;
    margin: 0 auto !important;
    border-radius: 0 !important;
    border: none !important;
  }
}

/* HEADER FIXED */
.header {
  background: var(--primary);
  color: white;
  display: grid;
  grid-template-columns: 80px 1fr 120px;
  align-items: center;
  padding: 12px;
}

.header img {
  max-width: 70px;
  max-height: 50px;
}

.header-center {
  text-align: center;
}

.header-center h1 {
  margin: 0;
  font-size: 18px;
  text-transform: uppercase;
}

.header-center p {
  margin: 3px 0 0;
  font-size: 12px;
}

.header-right {
  text-align: right;
  font-size: 11px;
  opacity: 0.9;
}

/* BODY */
.form-body {
  padding: 16px;
}

.meta-bar {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 15px;
  font-size: 11px;
  font-weight: 600;
}

.meta-item {
  border: 1px solid var(--border);
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--bg-soft);
}

.section-title {
  font-size: 11px;
  font-weight: 800;
  color: var(--primary);
  margin: 18px 0 10px;
  border-bottom: 2px solid var(--primary);
  padding-bottom: 4px;
  text-transform: uppercase;
}

/* GRID IMPROVED */
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.full { grid-column: span 2; }

/* FIELD */
.field-label {
  font-size: 9px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  margin-bottom: 3px;
}

.field-line {
  border-bottom: 1.8px solid #334155;
  min-height: 18px;
  font-size: 12px;
  padding: 2px 4px;
}

/* RULES */
.rules {
  background: var(--bg-soft);
  border-left: 4px solid var(--primary);
  padding: 10px;
  border-radius: 6px;
  margin-top: 18px;
  font-size: 10px;
}

.rules b {
  display: block;
  margin-bottom: 5px;
  color: var(--primary);
}

.rules-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

/* SIGNATURE */
.signatures {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 30px;
  text-align: center;
}

.sig {
  border-top: 2px solid #000;
  padding-top: 6px;
  font-size: 11px;
  font-weight: 600;
}

/* FOOTER */
.footer {
  text-align: center;
  background: var(--bg-soft);
  padding: 10px;
  font-size: 10px;
  border-top: 1px solid var(--border);
}
</style>
</head>

<body>

<div class="container">

<!-- HEADER -->
<div class="header">
  <div>
    ${tenant.logo ? `<img src="${escapeHtml(tenant.logo)}">` : ""}
  </div>

  <div class="header-center">
    <h1>${escapeHtml(tenant.name)}</h1>
    <p>Installment Application Form</p>
  </div>

</div>

<div class="form-body">

<div class="meta-bar">
  <div class="meta-item">FORM: ${escapeHtml(plan.account_number || plan.id)}</div>
  <div class="meta-item">DATE: ${dateStr}</div>
</div>

<!-- APPLICANT -->
<div class="section-title">Applicant Details</div>
<div class="grid">
  <div>
    <div class="field-label">Full Name</div>
    <div class="field-line">${escapeHtml(plan.customer.name)}</div>
  </div>

  <div>
    <div class="field-label">CNIC</div>
    <div class="field-line">${escapeHtml(plan.customer.cnic || "")}</div>
  </div>

  <div>
    <div class="field-label">Phone</div>
    <div class="field-line">${escapeHtml(plan.customer.phone)}</div>
  </div>

  <div>
    <div class="field-label">Email</div>
    <div class="field-line">${escapeHtml(plan.customer.email || "")}</div>
  </div>

  <div class="full">
    <div class="field-label">Address</div>
    <div class="field-line">${escapeHtml(plan.customer.address || "")}</div>
  </div>
</div>

<!-- ITEM -->
<div class="section-title">Item & Payment</div>
<div class="grid">

  <div>
    <div class="field-label">Item</div>
    <div class="field-line">${escapeHtml(plan.item.name)}</div>
  </div>

  <div>
    <div class="field-label">Model</div>
    <div class="field-line">${escapeHtml(plan.item.model || "")}</div>
  </div>

  <div>
    <div class="field-label">Advance</div>
    <div class="field-line">${escapeHtml(plan.advancePaid?.toLocaleString() || "")}</div>
  </div>

  <div>
    <div class="field-label">Monthly</div>
    <div class="field-line">${escapeHtml(plan.monthlyAmount?.toLocaleString() || "")}</div>
  </div>

  <div>
    <div class="field-label">Total</div>
    <div class="field-line">${escapeHtml(plan.sellingPrice?.toLocaleString() || "")}</div>
  </div>

  <div>
    <div class="field-label">Duration</div>
    <div class="field-line">${escapeHtml(plan.months)}</div>
  </div>

</div>

<!-- GUARANTOR -->
<div class="section-title">Guarantor</div>
<div class="grid">
  <div>
    <div class="field-label">Name</div>
    <div class="field-line"></div>
  </div>
  <div>
    <div class="field-label">CNIC</div>
    <div class="field-line"></div>
  </div>
  <div class="full">
    <div class="field-label">Address</div>
    <div class="field-line"></div>
  </div>
</div>

<!-- RULES -->
<div class="rules">
  <b>Terms & Conditions</b>
  <div class="rules-grid">
    <div>• Processing fee PKR 100 (non-refundable)</div>
    <div>• Goods remain company property</div>
    <div>• No resale allowed</div>
    <div>• Late payment may cause recovery</div>
    <div>• Guarantor required above 50k</div>
    <div>• Bank charges on customer</div>
  </div>
</div>

<!-- SIGN -->
<div class="signatures">
  <div class="sig">Applicant</div>
  <div class="sig">Guarantor</div>
  <div class="sig">Officer</div>
</div>

</div>

<!-- FOOTER -->
<div class="footer">
  Head Office: Hall Road Lahore |
  0333-9997216
</div>

</div>

</body>
</html>

    `;

    return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename=acceptance-form-${plan.account_number || plan.id}.html`,
    },
    });
  }