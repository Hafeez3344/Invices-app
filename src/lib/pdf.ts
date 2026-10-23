import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const PAGE_WIDTH_PX = 794;

/**
 * Fast single-page PDF capture.
 * Converts editable inputs to plain text and hides UI-only controls.
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string
): Promise<Blob> {
  const page =
    (element.classList.contains("pdf-page")
      ? element
      : element.querySelector<HTMLElement>(".pdf-page")) || element;

  const host = document.createElement("div");
  host.style.cssText =
    "position:fixed;left:-12000px;top:0;width:794px;background:#fff;z-index:-1;pointer-events:none;";
  document.body.appendChild(host);

  try {
    if (document.fonts?.ready) await document.fonts.ready;

    const clone = page.cloneNode(true) as HTMLElement;
    clone.style.cssText = [
      "width:794px",
      "max-width:none",
      "transform:none",
      "zoom:1",
      "position:relative",
      "background:#ffffff",
      "box-shadow:none",
      "margin:0",
      "box-sizing:border-box",
      "font-family:Cairo,Tahoma,Arial,sans-serif",
      "direction:rtl",
    ].join(";");

    // Hide edit-only controls
    clone.querySelectorAll(".no-print").forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });

    // Replace inputs with static text (faster + cleaner PDF)
    clone.querySelectorAll("input.edit-field").forEach((node) => {
      const input = node as HTMLInputElement;
      const span = document.createElement("div");
      span.textContent = input.value || "—";
      span.style.cssText = [
        "font-weight:700",
        "font-size:13px",
        "color:#0f172a",
        "padding:4px 2px",
        "min-height:22px",
        "word-break:break-word",
        input.dir === "ltr" ? "direction:ltr;text-align:right" : "",
      ].join(";");
      input.replaceWith(span);
    });

    host.appendChild(clone);

    const imgs = Array.from(clone.querySelectorAll("img"));
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(() => resolve(), 800);
          })
      )
    );

    await new Promise((r) => requestAnimationFrame(() => r(null)));

    const canvas = await html2canvas(clone, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: PAGE_WIDTH_PX,
      windowWidth: PAGE_WIDTH_PX,
      scrollX: 0,
      scrollY: 0,
    });

    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const usableW = pageWidth - margin * 2;
    const usableH = pageHeight - margin * 2;
    const ratio = Math.min(usableW / canvas.width, usableH / canvas.height);
    const imgWidth = canvas.width * ratio;
    const imgHeight = canvas.height * ratio;
    const x = (pageWidth - imgWidth) / 2;

    pdf.addImage(
      canvas.toDataURL("image/jpeg", 0.92),
      "JPEG",
      x,
      margin,
      imgWidth,
      imgHeight,
      undefined,
      "FAST"
    );
    pdf.save(filename);
    return pdf.output("blob");
  } finally {
    host.remove();
  }
}
