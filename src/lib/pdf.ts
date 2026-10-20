import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const PAGE_WIDTH_PX = 794;
const PAGE_HEIGHT_PX = 1123;

/**
 * Capture PDF pages from a clean off-screen clone.
 * Avoids parent CSS transform/zoom and html2canvas RTL bugs.
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string
): Promise<Blob> {
  const pages = Array.from(
    element.querySelectorAll<HTMLElement>(".pdf-page")
  );
  const targets = pages.length > 0 ? pages : [element];

  const host = document.createElement("div");
  host.setAttribute("data-pdf-capture-root", "true");
  host.style.cssText = [
    "position:fixed",
    "left:-12000px",
    "top:0",
    "width:" + PAGE_WIDTH_PX + "px",
    "background:#ffffff",
    "z-index:-1",
    "opacity:1",
    "pointer-events:none",
    "overflow:visible",
  ].join(";");
  document.body.appendChild(host);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    for (let i = 0; i < targets.length; i++) {
      host.innerHTML = "";
      const clone = targets[i].cloneNode(true) as HTMLElement;

      // Neutralize anything that breaks canvas capture
      clone.style.cssText = [
        "width:" + PAGE_WIDTH_PX + "px",
        "min-height:" + PAGE_HEIGHT_PX + "px",
        "max-width:none",
        "transform:none",
        "zoom:1",
        "position:relative",
        "background:#ffffff",
        "box-shadow:none",
        "margin:0",
        "padding:28px",
        "box-sizing:border-box",
        "font-family:Cairo, Tahoma, Arial, sans-serif",
        "direction:rtl",
        "color:#000000",
      ].join(";");

      host.appendChild(clone);

      // Wait for images in clone
      const imgs = Array.from(clone.querySelectorAll("img"));
      await Promise.all(
        imgs.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) return resolve();
              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
        )
      );

      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: PAGE_WIDTH_PX,
        height: Math.max(clone.scrollHeight, PAGE_HEIGHT_PX),
        windowWidth: PAGE_WIDTH_PX,
        windowHeight: Math.max(clone.scrollHeight, PAGE_HEIGHT_PX),
        scrollX: 0,
        scrollY: 0,
        onclone: (_doc, cloned) => {
          cloned.style.transform = "none";
          cloned.style.zoom = "1";
          cloned.querySelectorAll<HTMLElement>("*").forEach((el) => {
            el.style.letterSpacing = "normal";
            const tf = el.style.transform;
            if (tf && tf !== "none") el.style.transform = "none";
          });
        },
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const margin = 10;
      const usableW = pageWidth - margin * 2;
      const usableH = pageHeight - margin * 2;
      const ratio = Math.min(usableW / canvas.width, usableH / canvas.height);
      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;
      const x = (pageWidth - imgWidth) / 2;
      const y = margin;

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight, undefined, "FAST");
    }

    pdf.save(filename);
    return pdf.output("blob");
  } finally {
    host.remove();
  }
}
