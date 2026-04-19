import puppeteer from "puppeteer-core";

async function resolveExecutablePath(): Promise<string> {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (fromEnv) return fromEnv;

  if (process.platform === "win32" || process.platform === "darwin") {
    throw new Error(
      "PDF: Bitte PUPPETEER_EXECUTABLE_PATH setzen (Chrome/Chromium), oder auf Linux/Vercel deployen.",
    );
  }

  const chromium = await import("@sparticuz/chromium");
  return chromium.default.executablePath();
}

async function launchArgs(): Promise<string[]> {
  const base = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"];
  if (process.env.PUPPETEER_EXECUTABLE_PATH?.trim()) {
    return base;
  }
  const chromium = await import("@sparticuz/chromium");
  return [...chromium.default.args, ...base];
}

export async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  const executablePath = await resolveExecutablePath();
  const args = await launchArgs();

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 45_000 });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
      timeout: 45_000,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
