export type ExportFormatId = "post" | "story" | "transparent";

export type ExportFormat = {
  id: ExportFormatId;
  label: string;
  shortLabel: string;
  detail: string;
  width: number;
  height: number;
  transparent?: boolean;
};

export type ExportBlockId = "hero" | "specs" | "steps" | "notes" | "footer";

export const formats: ExportFormat[] = [
  { id: "post", label: "Instagram Post", shortLabel: "Post", detail: "1080 x 1080 px", width: 1080, height: 1080 },
  { id: "story", label: "Instagram Story", shortLabel: "Story", detail: "1080 x 1920 px", width: 1080, height: 1920 },
  { id: "transparent", label: "Transparent PNG", shortLabel: "PNG", detail: "1080 x 1350 px", width: 1080, height: 1350, transparent: true }
];

export const accents = ["#d89b5d", "#8d9460", "#f4eee5", "#5fa3a8", "#e8a3a0"];
