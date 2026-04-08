/**
 * Certificate generator for TRIS Motorcycle Academy
 * Draws an A4-landscape certificate on canvas and downloads as PNG.
 * If an admin signature is stored in settings it is rendered on the certificate;
 * otherwise the built-in hand-drawn path fallback is used.
 */

import { SERVER_URL } from "@/lib/server";

export interface CertificateData {
  studentName: string;
  year?: number;
}

interface SignatureSettings {
  adminSignature: string | null;
  adminSignatureName: string;
  adminSignatureTitle: string;
}

// Session-level cache so we only fetch once per page load
let _sigCache: SignatureSettings | null = null;

export async function fetchSignatureSettings(): Promise<SignatureSettings> {
  if (_sigCache) return _sigCache;
  try {
    const res = await fetch(`${SERVER_URL}/settings/signature`);
    const data = await res.json();
    if (data.success) {
      _sigCache = {
        adminSignature: data.adminSignature ?? null,
        adminSignatureName: data.adminSignatureName ?? "TRIS",
        adminSignatureTitle: data.adminSignatureTitle ?? "TRIS ACADEMY",
      };
      return _sigCache;
    }
  } catch {
    // fall through to defaults
  }
  return {
    adminSignature: null,
    adminSignatureName: "TRIS",
    adminSignatureTitle: "TRIS ACADEMY",
  };
}

/** Call this after admin saves a new signature so the next cert uses it. */
export function invalidateSignatureCache() {
  _sigCache = null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawFallbackSignature(
  ctx: CanvasRenderingContext2D,
  sigX: number,
  sigY: number,
) {
  ctx.strokeStyle = "#1a56db";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(sigX - 60, sigY + 10);
  ctx.bezierCurveTo(
    sigX - 20,
    sigY - 30,
    sigX + 10,
    sigY - 50,
    sigX + 40,
    sigY - 10,
  );
  ctx.bezierCurveTo(
    sigX + 60,
    sigY + 20,
    sigX + 70,
    sigY - 20,
    sigX + 90,
    sigY - 40,
  );
  ctx.bezierCurveTo(
    sigX + 110,
    sigY - 60,
    sigX + 120,
    sigY - 30,
    sigX + 130,
    sigY + 0,
  );
  ctx.stroke();
}

export async function downloadCertificate(
  data: CertificateData,
): Promise<void> {
  const { studentName, year = new Date().getFullYear() } = data;
  const sigSettings = await fetchSignatureSettings();

  const W = 1754;
  const H = 1240;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W * 0.65, H);
  grad.addColorStop(0, "#00C8C8");
  grad.addColorStop(0.45, "#00E0E0");
  grad.addColorStop(1, "#E8FAFA");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Geometric triangle pattern
  const triangles: [number, number, number, number, number, number, string][] =
    [
      [0, 0, 520, 0, 0, 420, "rgba(0,180,180,0.35)"],
      [0, 0, 340, 0, 0, 260, "rgba(0,210,210,0.25)"],
      [220, 0, 700, 0, 220, 580, "rgba(0,190,190,0.22)"],
      [380, 0, 760, 0, 460, 620, "rgba(0,200,200,0.18)"],
      [560, 160, 860, 0, 700, 560, "rgba(0,220,220,0.15)"],
      [0, 200, 300, 560, 0, H, "rgba(0,170,170,0.20)"],
      [0, 400, 380, H, 0, H, "rgba(0,180,180,0.18)"],
      [200, 380, 600, 700, 0, H, "rgba(0,190,190,0.12)"],
      [580, 300, 820, 560, 500, H, "rgba(255,255,255,0.07)"],
      [700, 0, 900, 300, 700, 620, "rgba(255,255,255,0.09)"],
      [820, 100, 1000, 400, 760, H, "rgba(255,255,255,0.06)"],
    ];
  triangles.forEach(([x1, y1, x2, y2, x3, y3, color]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  });

  const fadeGrad = ctx.createLinearGradient(W * 0.52, 0, W, 0);
  fadeGrad.addColorStop(0, "rgba(255,255,255,0)");
  fadeGrad.addColorStop(1, "rgba(255,255,255,0.72)");
  ctx.fillStyle = fadeGrad;
  ctx.fillRect(0, 0, W, H);

  // Decorative border
  const bPad = 28;
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 5;
  ctx.strokeRect(bPad, bPad, W - bPad * 2, H - bPad * 2);
  ctx.lineWidth = 2;
  const b2 = bPad + 14;
  ctx.strokeRect(b2, b2, W - b2 * 2, H - b2 * 2);
  [
    [bPad, bPad],
    [W - bPad, bPad],
    [bPad, H - bPad],
    [W - bPad, H - bPad],
  ].forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#111";
    ctx.fill();
  });

  // Heading
  ctx.fillStyle = "#0a0a0a";
  ctx.textAlign = "center";
  ctx.font = "bold 148px Georgia, serif";
  ctx.fillText("CERTIFICATE", W / 2, 210);
  ctx.font = "32px Georgia, serif";
  ctx.fillText("OF  ACHIEVEMENT", W / 2, 268);

  ctx.strokeStyle = "#0a0a0a";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(260, 310);
  ctx.lineTo(W - 260, 310);
  ctx.stroke();

  ctx.fillStyle = "#0a0a0a";
  ctx.font = "26px Georgia, serif";
  ctx.fillText("THIS  IS  TO  CERTIFY  THAT", W / 2, 368);

  // Student name
  const nameY = 490;
  ctx.font = "bold 82px Georgia, serif";
  ctx.fillStyle = "#0a2a2a";
  ctx.fillText(studentName.toUpperCase(), W / 2, nameY);
  const nameWidth = ctx.measureText(studentName.toUpperCase()).width;
  const nameUnderX = W / 2 - nameWidth / 2 - 20;
  ctx.strokeStyle = "#0a0a0a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(nameUnderX, nameY + 16);
  ctx.lineTo(nameUnderX + nameWidth + 40, nameY + 16);
  ctx.stroke();
  [nameUnderX - 10, nameUnderX + nameWidth + 50].forEach((bx) => {
    ctx.beginPath();
    ctx.arc(bx, nameY + 16, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#0a0a0a";
    ctx.fill();
  });

  // Body text
  ctx.fillStyle = "#0a0a0a";
  ctx.font = "bold 25px Arial, sans-serif";
  const lines = [
    "HAS SUCCESSFULLY COMPLETED THE MOTORCYCLE RIDING TRAINING PROGRAM",
    "AT TRIS MOTORCYCLE ACADEMY, HAVING DEMONSTRATED THE REQUIRED SKILLS, KNOWLEDGE,",
    "AND SAFETY STANDARDS IN MOTORCYCLE HANDLING, ROAD AWARENESS, AND RIDER",
    "RESPONSIBILITY.",
  ];
  lines.forEach((line, i) => ctx.fillText(line, W / 2, 580 + i * 42));

  // Signature area
  const sigX = W / 2 - 300;
  const sigY = 820;

  if (sigSettings.adminSignature) {
    try {
      const img = await loadImage(sigSettings.adminSignature);
      // Larger signature area
      const maxW = 460;
      const maxH = 160;
      const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
      const dw = img.naturalWidth * ratio;
      const dh = img.naturalHeight * ratio;
      const dx = sigX + 40 - dw / 2;
      const dy = sigY - dh + 60;

      // Render to an offscreen canvas then tint blue using source-in compositing
      const off = document.createElement("canvas");
      off.width = dw;
      off.height = dh;
      const offCtx = off.getContext("2d")!;
      offCtx.drawImage(img, 0, 0, dw, dh);
      // Paint blue only where the signature ink exists
      offCtx.globalCompositeOperation = "source-in";
      offCtx.fillStyle = "#1a56db";
      offCtx.fillRect(0, 0, dw, dh);

      ctx.drawImage(off, dx, dy);
    } catch {
      drawFallbackSignature(ctx, sigX, sigY);
    }
  } else {
    drawFallbackSignature(ctx, sigX, sigY);
  }

  // Underline + name + title
  ctx.strokeStyle = "#0a0a0a";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sigX - 80, sigY + 22);
  ctx.lineTo(sigX + 160, sigY + 22);
  ctx.stroke();

  ctx.fillStyle = "#0a0a0a";
  ctx.font = "bold 28px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(sigSettings.adminSignatureName, sigX + 40, sigY + 60);
  ctx.font = "italic 22px Arial, sans-serif";
  ctx.fillStyle = "#333";
  ctx.fillText(sigSettings.adminSignatureTitle, sigX + 40, sigY + 90);

  // Year badge
  const badgeX = W / 2 + 320;
  const badgeY = sigY + 20;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, 80, 0, Math.PI * 2);
  ctx.strokeStyle = "#0a0a0a";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  function drawLeaf(
    lctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    angle: number,
    size: number,
  ) {
    lctx.save();
    lctx.translate(cx, cy);
    lctx.rotate(angle);
    lctx.beginPath();
    lctx.ellipse(0, -size / 2, size * 0.28, size / 2, 0, 0, Math.PI * 2);
    lctx.fillStyle = "#0a0a0a";
    lctx.fill();
    lctx.restore();
  }

  for (let i = 0; i < 7; i++) {
    const t = (i / 6) * Math.PI - Math.PI / 2;
    drawLeaf(
      ctx,
      badgeX - 74 + Math.sin(t) * 12,
      badgeY + Math.cos(t) * 72,
      t + Math.PI / 2,
      22,
    );
    drawLeaf(
      ctx,
      badgeX + 74 - Math.sin(t) * 12,
      badgeY + Math.cos(t) * 72,
      -t - Math.PI / 2,
      22,
    );
  }

  ctx.fillStyle = "#0a0a0a";
  ctx.font = "bold 30px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("YEAR", badgeX, badgeY - 8);
  ctx.font = "bold 36px Arial, sans-serif";
  ctx.fillText(String(year), badgeX, badgeY + 34);

  // Download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Certificate_${studentName.replace(/[^a-z0-9]/gi, "_")}_${year}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

export async function downloadCertificatesBulk(
  students: CertificateData[],
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  for (let i = 0; i < students.length; i++) {
    await downloadCertificate(students[i]);
    onProgress?.(i + 1, students.length);
    await new Promise((r) => setTimeout(r, 350));
  }
}
