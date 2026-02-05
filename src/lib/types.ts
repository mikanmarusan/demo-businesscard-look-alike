export interface DetectedText {
  id: string;
  text: string;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  fontSize: number;
  textColor: string;
  bgColor: string;
  fontFamily: string;
  confidence: number;
}

export type AppStep = "upload" | "processing" | "editor";
