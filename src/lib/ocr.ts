import Tesseract from "tesseract.js";

export async function recognizeCard(
  imageData: string,
  onProgress?: (p: number) => void
): Promise<Tesseract.Page> {
  const worker = await Tesseract.createWorker(["eng", "jpn"], undefined, {
    logger: (m) => {
      if (m.progress !== undefined) {
        onProgress?.(m.progress);
      }
    },
  });

  try {
    const { data } = await worker.recognize(imageData);
    return data;
  } finally {
    await worker.terminate();
  }
}
