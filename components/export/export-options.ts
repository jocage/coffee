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

export type ExportThemeId = "mocha" | "olive" | "porcelain" | "aqua" | "rose";
export type ExportFontId = "editorial" | "clean" | "mono";

export type ExportTheme = {
  id: ExportThemeId;
  label: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
};

export type ExportFont = {
  id: ExportFontId;
  label: string;
  heading: string;
  body: string;
};

export const formats: ExportFormat[] = [
  {
    id: "post",
    label: "Instagram Post",
    shortLabel: "Post",
    detail: "1080 x 1080 px",
    width: 1080,
    height: 1080
  },
  {
    id: "story",
    label: "Instagram Story",
    shortLabel: "Story",
    detail: "1080 x 1920 px",
    width: 1080,
    height: 1920
  },
  {
    id: "transparent",
    label: "Transparent PNG",
    shortLabel: "PNG",
    detail: "1080 x 1350 px",
    width: 1080,
    height: 1350,
    transparent: true
  }
];

export const themes: ExportTheme[] = [
  {
    id: "mocha",
    label: "Mocha",
    accent: "#d89b5d",
    background: "#11100d",
    surface: "rgba(18, 17, 14, 0.78)",
    text: "#f8f4eb",
    muted: "rgba(248, 244, 235, 0.68)"
  },
  {
    id: "olive",
    label: "Olive",
    accent: "#9aa36a",
    background: "#11150f",
    surface: "rgba(17, 21, 15, 0.78)",
    text: "#f7f3e8",
    muted: "rgba(247, 243, 232, 0.66)"
  },
  {
    id: "porcelain",
    label: "Porcelain",
    accent: "#f4eee5",
    background: "#151311",
    surface: "rgba(244, 238, 229, 0.12)",
    text: "#fffaf2",
    muted: "rgba(255, 250, 242, 0.64)"
  },
  {
    id: "aqua",
    label: "Aqua",
    accent: "#6bb5b9",
    background: "#0d1516",
    surface: "rgba(13, 21, 22, 0.76)",
    text: "#f4fbfa",
    muted: "rgba(244, 251, 250, 0.64)"
  },
  {
    id: "rose",
    label: "Rose",
    accent: "#e8a3a0",
    background: "#171110",
    surface: "rgba(23, 17, 16, 0.76)",
    text: "#fff5ef",
    muted: "rgba(255, 245, 239, 0.66)"
  }
];

export const accents = themes.map((theme) => theme.accent);

export const exportFonts: ExportFont[] = [
  {
    id: "editorial",
    label: "Editorial",
    heading: "Georgia",
    body: "Arial"
  },
  {
    id: "clean",
    label: "Clean",
    heading: "Arial",
    body: "Arial"
  },
  {
    id: "mono",
    label: "Mono",
    heading: "Courier New",
    body: "Arial"
  }
];
