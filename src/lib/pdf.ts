import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const PAGE_WIDTH_PX = 794;

/**
 * Fast single-page PDF capture.
 * Forces desktop layout (logo | info | QR) on any screen.
 * Syncs live input values so all goods items appear.
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

    // Snapshot live values BEFORE clone (React sets .value property, not attribute)
    const liveValues = Array.from(
      page.querySelectorAll<HTMLInputElement>("input.edit-field")
    ).map((input) => input.value);

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
      "padding:20px",
      "box-sizing:border-box",
      "font-family:Cairo,Tahoma,Arial,sans-serif",
      "direction:rtl",
    ].join(";");

    // Force website desktop layout in PDF (ignore phone viewport)
    const forceCss = document.createElement("style");
    forceCss.textContent = `
      .pdf-header {
        display: grid !important;
        grid-template-columns: 140px 1fr 140px !important;
        align-items: stretch !important;
        gap: 12px !important;
      }
      .pdf-logo, .pdf-qr {
        width: 140px !important;
        height: 140px !important;
        min-height: 140px !important;
        margin: 0 !important;
      }
      .pdf-logo img {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
      }
      .pdf-qr img {
        width: 100% !important;
        height: 100% !important;
        max-width: 130px !important;
        max-height: 130px !important;
        object-fit: contain !important;
      }
      .pdf-dates {
        display: grid !important;
        grid-template-columns: 1fr 1fr 1fr !important;
        gap: 8px !important;
      }
      .pdf-field-row {
        display: grid !important;
        grid-template-columns: 1fr 1fr 1fr !important;
        gap: 8px !important;
      }
      .pdf-goods-mobile { display: none !important; }
      .pdf-goods-desktop { display: block !important; visibility: visible !important; }
      .no-print { display: none !important; }
    `;
    clone.prepend(forceCss);

    // Apply live values onto cloned inputs
    const clonedInputs = Array.from(
      clone.querySelectorAll<HTMLInputElement>("input.edit-field")
    );
    clonedInputs.forEach((input, i) => {
      if (liveValues[i] !== undefined) input.value = liveValues[i];
    });

    // Hide edit-only controls
    clone.querySelectorAll(".no-print").forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });

    // Replace inputs with static text
    clonedInputs.forEach((input) => {
      const span = document.createElement("div");
      span.textContent = input.value || "—";
      span.style.cssText = [
        "font-weight:700",
        "font-size:13px",
        "color:#0f172a",
        "padding:6px 4px",
        "min-height:24px",
        "word-break:break-word",
        "border:1px solid #e2e8f0",
        "border-radius:6px",
        "background:#f8fafc",
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
            if (img.complete && img.naturalWidth > 0) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(() => resolve(), 1000);
          })
      )
    );

    await new Promise((r) => setTimeout(r, 80));

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
