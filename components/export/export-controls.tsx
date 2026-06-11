"use client";

import { Download, Image as ImageIcon, Palette, Save, Smartphone } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import type { Recipe } from "@/lib/domain";
import { formatDuration, formatRatio } from "@/lib/format";

type ExportFormat = {
  id: "post" | "story" | "transparent";
  label: string;
  detail: string;
  width: number;
  height: number;
  transparent?: boolean;
};

const formats: ExportFormat[] = [
  { id: "post", label: "Instagram Post", detail: "1080 x 1080 px", width: 1080, height: 1080 },
  { id: "story", label: "Instagram Story", detail: "1080 x 1920 px", width: 1080, height: 1920 },
  { id: "transparent", label: "Transparent PNG", detail: "1080 x 1350 px", width: 1080, height: 1350, transparent: true }
];

const accents = ["#d89b5d", "#8d9460", "#f4eee5", "#5fa3a8", "#e8a3a0"];

export function ExportControls({ recipe }: { recipe: Recipe }) {
  const [formatId, setFormatId] = useState<ExportFormat["id"]>("post");
  const [accent, setAccent] = useState(accents[0]);
  const [isPending, startTransition] = useTransition();
  const selectedFormat = useMemo(() => formats.find((format) => format.id === formatId) ?? formats[0], [formatId]);

  function exportPng() {
    startTransition(() => {
      const canvas = document.createElement("canvas");
      canvas.width = selectedFormat.width;
      canvas.height = selectedFormat.height;
      const context = canvas.getContext("2d");

      if (!context) return;

      drawRecipeCard(context, recipe, selectedFormat, accent);
      const link = document.createElement("a");
      link.download = `${recipe.slug}-${selectedFormat.id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  }

  return (
    <>
      <Card>
        <CardTitle>Format</CardTitle>
        <div className="mt-4 grid gap-3">
          {formats.map((format, index) => {
            const Icon = index === 0 ? Smartphone : index === 1 ? ImageIcon : Download;
            return (
              <label key={format.id} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] p-3">
                <span className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-[var(--accent)]" aria-hidden />
                  <span>
                    <strong className="block text-sm">{format.label}</strong>
                    <span className="text-xs text-[var(--text-dim)]">{format.detail}</span>
                  </span>
                </span>
                <input
                  type="radio"
                  name="format"
                  checked={format.id === formatId}
                  className="accent-[var(--accent)]"
                  onChange={() => setFormatId(format.id)}
                />
              </label>
            );
          })}
        </div>
      </Card>
      <Card>
        <CardTitle>Style</CardTitle>
        <div className="mt-4 flex gap-3">
          {accents.map((color, index) => (
            <button
              key={color}
              type="button"
              className="focus-ring h-10 w-10 rounded-full border border-[var(--border-strong)] data-[active=true]:ring-2 data-[active=true]:ring-[var(--accent)]"
              style={{ background: color }}
              aria-label={`Accent color ${index + 1}`}
              data-active={color === accent}
              onClick={() => setAccent(color)}
            />
          ))}
        </div>
        <Button type="button" variant="secondary" className="mt-4 w-full" icon={<Palette className="h-4 w-4" aria-hidden />}>
          Save preset
        </Button>
      </Card>
      <Button type="button" size="lg" className="w-full" icon={<Download className="h-5 w-5" aria-hidden />} disabled={isPending} onClick={exportPng}>
        {isPending ? "Rendering..." : "Export PNG"}
      </Button>
      <Button type="button" variant="secondary" className="w-full" icon={<Save className="h-4 w-4" aria-hidden />}>
        Save draft
      </Button>
    </>
  );
}

function drawRecipeCard(context: CanvasRenderingContext2D, recipe: Recipe, format: ExportFormat, accent: string) {
  const { width, height } = format;
  context.clearRect(0, 0, width, height);

  if (!format.transparent) {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#151710");
    gradient.addColorStop(0.55, "#242018");
    gradient.addColorStop(1, "#0e1718");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  const margin = Math.round(width * 0.08);
  const cardWidth = width - margin * 2;
  const cardHeight = height - margin * 2;
  roundedRect(context, margin, margin, cardWidth, cardHeight, 44);
  context.fillStyle = format.transparent ? "rgba(17, 20, 15, 0.94)" : "rgba(255,255,255,0.055)";
  context.fill();
  context.strokeStyle = accent;
  context.lineWidth = 5;
  context.stroke();

  context.fillStyle = accent;
  context.font = "700 34px Arial";
  context.fillText("COFFEE JOURNEY", margin + 54, margin + 88);

  context.fillStyle = "#f8f4eb";
  wrapText(context, recipe.title, margin + 54, margin + 190, cardWidth - 108, Math.round(width * 0.08), Math.round(width * 0.095), "Georgia");

  context.fillStyle = "rgba(248,244,235,0.72)";
  context.font = "400 34px Arial";
  wrapText(context, recipe.subtitle || recipe.description || "Brew recipe", margin + 54, margin + 410, cardWidth - 108, 34, 48, "Arial", 2);

  const metrics = [
    ["Method", recipe.method],
    ["Coffee", `${recipe.doseGrams}g`],
    ["Water", `${recipe.waterGrams}g`],
    ["Ratio", formatRatio(recipe.doseGrams, recipe.waterGrams)],
    ["Temp", `${recipe.temperatureCelsius}C`],
    ["Time", formatDuration(recipe.totalTimeSeconds)]
  ];
  const metricTop = Math.min(height - margin - 360, margin + Math.round(cardHeight * 0.56));
  const cellWidth = (cardWidth - 108 - 32) / 2;
  metrics.forEach(([label, value], index) => {
    const x = margin + 54 + (index % 2) * (cellWidth + 32);
    const y = metricTop + Math.floor(index / 2) * 112;
    context.fillStyle = "rgba(255,255,255,0.075)";
    roundedRect(context, x, y, cellWidth, 82, 18);
    context.fill();
    context.fillStyle = "rgba(248,244,235,0.58)";
    context.font = "700 22px Arial";
    context.fillText(label.toUpperCase(), x + 24, y + 30);
    context.fillStyle = "#f8f4eb";
    context.font = "700 30px Arial";
    context.fillText(value, x + 24, y + 62);
  });

  const footerY = height - margin - 88;
  context.fillStyle = accent;
  context.font = "700 28px Arial";
  context.fillText(`@${recipe.author.handle}`, margin + 54, footerY);
  context.fillStyle = "rgba(248,244,235,0.58)";
  context.font = "400 24px Arial";
  context.fillText(`${recipe.steps.length} steps · ${recipe.visibility}`, margin + 54, footerY + 42);
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  lineHeight: number,
  fontFamily: string,
  maxLines = 3
) {
  context.font = `700 ${fontSize}px ${fontFamily}`;
  const words = text.split(/\s+/);
  let line = "";
  let lineCount = 0;

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      context.fillText(line, x, y + lineCount * lineHeight);
      line = word;
      lineCount += 1;
      if (lineCount >= maxLines) return;
    } else {
      line = candidate;
    }
  }

  if (line && lineCount < maxLines) {
    context.fillText(line, x, y + lineCount * lineHeight);
  }
}
