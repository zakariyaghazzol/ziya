export function canUseBrowserTextRecognition() {
  return typeof window !== "undefined" && typeof window.TextDetector === "function" && typeof createImageBitmap === "function";
}

export async function extractReceiptTextFromImage(file) {
  if (!file) throw new Error("Choose a receipt or menu photo first.");
  if (!canUseBrowserTextRecognition()) {
    return {
      status: "manual-review",
      text: "",
      confidence: "needs-confirmation",
      message: "Automatic text reading is not available in this browser. Enter the visible receipt text to continue."
    };
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const detector = new window.TextDetector();
    const blocks = await detector.detect(bitmap);
    const text = blocks.map((block) => String(block.rawValue || "").trim()).filter(Boolean).join("\n");
    return {
      status: text ? "recognized" : "manual-review",
      text,
      confidence: text ? "possible" : "not-confident",
      message: text
        ? "Text was read from this image. Review every item before saving."
        : "No text could be read confidently. Enter the visible receipt text to continue."
    };
  } catch {
    return {
      status: "manual-review",
      text: "",
      confidence: "not-confident",
      message: "The photo could not be read automatically. Enter the visible receipt text to continue."
    };
  } finally {
    bitmap?.close?.();
  }
}
