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
  fontFamily: string;
  fontWeight: string;
}

export type AppStep = "upload" | "processing" | "editor";
