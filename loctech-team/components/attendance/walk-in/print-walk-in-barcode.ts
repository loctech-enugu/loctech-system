import { toast } from "sonner";
import type { WalkInSession } from "@/types/walkin-attendance";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Opens a print dialog with a designed sheet: QR, code, expiry, instructions */
export function printWalkInBarcodeSheet(session: WalkInSession) {
  const barcode = session.barcode;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=12&data=${encodeURIComponent(barcode)}`;
  const expiresAt = session.expiresAt
    ? new Date(session.expiresAt as string | Date)
    : null;
  const expiresLabel =
    expiresAt && !Number.isNaN(expiresAt.getTime())
      ? expiresAt.toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Walk-in barcode — Loctech</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .wrap {
      max-width: 520px;
      margin: 0 auto;
      padding: 28px 20px 40px;
    }
    .card {
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.15);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    .hero {
      background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
      color: #fff;
      padding: 28px 24px 22px;
      text-align: center;
    }
    .hero .logo {
      font-size: 11px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      opacity: 0.85;
      margin-bottom: 8px;
    }
    .hero h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1.25;
    }
    .hero p {
      margin: 10px 0 0;
      font-size: 0.9rem;
      opacity: 0.9;
      line-height: 1.45;
    }
    .body { padding: 24px 22px 28px; }
    .qr-box {
      display: flex;
      justify-content: center;
      padding: 16px;
      background: #f8fafc;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      margin-bottom: 18px;
    }
    .qr-box img {
      width: 260px;
      height: 260px;
      display: block;
      border-radius: 8px;
    }
    .code-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      margin-bottom: 8px;
      text-align: center;
    }
    .code {
      font-family: ui-monospace, "Cascadia Code", "SF Mono", Menlo, monospace;
      font-size: 11px;
      line-height: 1.5;
      word-break: break-all;
      text-align: center;
      padding: 14px 12px;
      background: #f1f5f9;
      border-radius: 10px;
      border: 1px dashed #94a3b8;
      color: #0f172a;
    }
    .expiry {
      margin-top: 16px;
      text-align: center;
      font-size: 0.8rem;
      color: #b45309;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .expiry strong { color: #92400e; }
    .steps {
      margin-top: 26px;
      padding-top: 22px;
      border-top: 1px solid #e2e8f0;
    }
    .steps h2 {
      margin: 0 0 14px;
      font-size: 1rem;
      font-weight: 700;
      color: #1e293b;
    }
    .steps ol {
      margin: 0;
      padding-left: 1.2rem;
      color: #334155;
      font-size: 0.92rem;
      line-height: 1.65;
    }
    .steps li { margin-bottom: 8px; }
    .steps li strong { color: #0f172a; }
    .foot {
      margin-top: 22px;
      font-size: 0.78rem;
      color: #94a3b8;
      text-align: center;
      line-height: 1.5;
    }
    @media print {
      body { background: #fff; }
      .wrap { padding: 0; max-width: none; }
      .card { box-shadow: none; border-radius: 0; border: none; }
      .hero { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: auto; margin: 14mm; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="hero">
        <div class="logo">Loctech Training Institute</div>
        <h1>Walk-in attendance</h1>
        <p>Scan the QR code or enter the code below on the student portal to sign in.</p>
      </div>
      <div class="body">
        <div class="qr-box">
          <img src="${escapeHtml(qrUrl)}" width="260" height="260" alt="Walk-in QR code" />
        </div>
        <div class="code-label">Barcode / manual entry</div>
        <div class="code">${escapeHtml(barcode)}</div>
        ${
          expiresLabel
            ? `<div class="expiry"><strong>Expires:</strong> ${escapeHtml(expiresLabel)} — ask staff for a new session after this time.</div>`
            : ""
        }
        <div class="steps">
          <h2>Instructions for students</h2>
          <ol>
            <li>Log in to the <strong>student portal</strong> (Loctech student app).</li>
            <li>Open <strong>Dashboard → Walk-in Sign In</strong> (or go to <code style="font-size:0.85em">/dashboard/walk-in/sign-in</code>).</li>
            <li>Use your camera to <strong>scan this QR code</strong>, or paste/type the barcode above if the camera does not work.</li>
            <li>Confirm your account when prompted to complete <strong>walk-in sign-in</strong>.</li>
            <li>If the code fails, it may have expired — tap <strong>New Session</strong> on the staff screen and print again.</li>
          </ol>
        </div>
        <p class="foot">Display this sheet at the entrance or reception. For staff use only — do not share on public social media.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  printHtmlInHiddenIframe(html);
}

/**
 * Prints without opening a new window (avoids popup blockers). Uses a hidden iframe.
 */
function printHtmlInHiddenIframe(fullHtml: string) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.title = "Walk-in barcode print";
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
    opacity: "0",
    pointerEvents: "none",
  });
  document.body.appendChild(iframe);

  const idoc = iframe.contentDocument;
  const iwin = iframe.contentWindow;
  if (!idoc || !iwin) {
    iframe.remove();
    toast.error("Could not prepare print preview.");
    return;
  }

  idoc.open();
  idoc.write(fullHtml);
  idoc.close();

  const cleanup = () => {
    iframe.remove();
  };

  const runPrint = () => {
    try {
      iwin.focus();
      iwin.print();
    } catch {
      toast.error("Printing failed. Try again.");
    }
    // Remove after print dialog so the node doesn’t linger
    setTimeout(cleanup, 2000);
  };

  const afterImagesReady = () => {
    const img = idoc.querySelector("img");
    if (img && !img.complete) {
      img.addEventListener("load", () => setTimeout(runPrint, 100), { once: true });
      img.addEventListener("error", () => setTimeout(runPrint, 100), { once: true });
    } else {
      setTimeout(runPrint, 150);
    }
  };

  // Let the iframe document finish parsing
  setTimeout(afterImagesReady, 0);
}
