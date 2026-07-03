"use client";

import { Download, Image as ImageIcon, Palette, Save, Smartphone } from "lucide-react";
import { useMemo, useState } from "react";
import {
  exportFonts,
  formats,
  themes,
  type ExportBlockId,
  type ExportFontId,
  type ExportFormat,
  type ExportFormatId,
  type ExportTheme,
  type ExportThemeId
} from "@/components/export/export-options";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/form";
import type { Recipe } from "@/lib/domain";
import { formatDuration, formatRatio } from "@/lib/format";

export function ExportControls({
  recipe,
  formatId,
  themeId,
  overlayStrength,
  textScale,
  imageZoom,
  cardOpacity,
  cardRadius,
  fontId,
  enabledBlockIds,
  blockOrder,
  onFormatChange,
  onThemeChange,
  onOverlayChange,
  onTextScaleChange,
  onImageZoomChange,
  onCardOpacityChange,
  onCardRadiusChange,
  onFontChange,
  onSaveDraft,
  onSavePreset,
  onLoadPreset,
  onResetDraft
}: {
  recipe: Recipe;
  formatId: ExportFormatId;
  themeId: ExportThemeId;
  overlayStrength: number;
  textScale: number;
  imageZoom: number;
  cardOpacity: number;
  cardRadius: number;
  fontId: ExportFontId;
  enabledBlockIds: ExportBlockId[];
  blockOrder: ExportBlockId[];
  onFormatChange: (formatId: ExportFormatId) => void;
  onThemeChange: (themeId: ExportThemeId) => void;
  onOverlayChange: (value: number) => void;
  onTextScaleChange: (value: number) => void;
  onImageZoomChange: (value: number) => void;
  onCardOpacityChange: (value: number) => void;
  onCardRadiusChange: (value: number) => void;
  onFontChange: (fontId: ExportFontId) => void;
  onSaveDraft: () => void;
  onSavePreset: () => void;
  onLoadPreset: () => void;
  onResetDraft: () => void;
}) {
  const [isRendering, setIsRendering] = useState(false);
  const selectedFormat = useMemo(
    () => formats.find((format) => format.id === formatId) ?? formats[0],
    [formatId]
  );
  const selectedTheme = useMemo(
    () => themes.find((theme) => theme.id === themeId) ?? themes[0],
    [themeId]
  );

  async function exportPng() {
    setIsRendering(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = selectedFormat.width;
      canvas.height = selectedFormat.height;
      const context = canvas.getContext("2d");

      if (!context) return;

      await drawRecipeCard(context, recipe, selectedFormat, selectedTheme, enabledBlockIds, {
        overlayStrength,
        textScale,
        imageZoom,
        cardOpacity,
        cardRadius,
        fontId,
        blockOrder
      });
      const link = document.createElement("a");
      link.download = `${recipe.slug}-${selectedFormat.id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setIsRendering(false);
    }
  }

  return (
    <>
      <Card>
        <CardTitle>Format</CardTitle>
        <div className="mt-4 grid gap-3">
          {formats.map((format, index) => {
            const Icon = index === 0 ? Smartphone : index === 1 ? ImageIcon : Download;
            return (
              <label
                key={format.id}
                className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] p-3"
              >
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
                  onChange={() => onFormatChange(format.id)}
                />
              </label>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardTitle>Style</CardTitle>
        <div className="mt-4 flex gap-3">
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className="focus-ring h-10 w-10 rounded-full border border-[var(--border-strong)] data-[active=true]:ring-2 data-[active=true]:ring-[var(--accent)]"
              style={{ background: theme.accent }}
              aria-label={`${theme.label} theme`}
              data-active={theme.id === themeId}
              title={theme.label}
              onClick={() => onThemeChange(theme.id)}
            />
          ))}
        </div>

        <div className="mt-5 grid gap-4">
          <RangeControl
            id="overlayStrength"
            label="Image overlay"
            value={overlayStrength}
            min={35}
            max={85}
            suffix="%"
            onChange={onOverlayChange}
          />
          <RangeControl
            id="imageZoom"
            label="Image zoom"
            value={imageZoom}
            min={100}
            max={135}
            suffix="%"
            onChange={onImageZoomChange}
          />
          <RangeControl
            id="textScale"
            label="Text scale"
            value={textScale}
            min={85}
            max={115}
            suffix="%"
            onChange={onTextScaleChange}
          />
          <div className="grid grid-cols-2 gap-3">
            <RangeControl
              id="cardOpacity"
              label="Card"
              value={cardOpacity}
              min={35}
              max={92}
              suffix="%"
              onChange={onCardOpacityChange}
            />
            <RangeControl
              id="cardRadius"
              label="Radius"
              value={cardRadius}
              min={0}
              max={28}
              suffix="px"
              onChange={onCardRadiusChange}
            />
          </div>
          <div>
            <Label htmlFor="fontId">Font style</Label>
            <select
              id="fontId"
              value={fontId}
              className="focus-ring h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-black/30 px-3 text-sm text-[var(--text)]"
              onChange={(event) => onFontChange(event.currentTarget.value as ExportFontId)}
            >
              {exportFonts.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="mt-4 w-full"
          icon={<Palette className="h-4 w-4" aria-hidden />}
          onClick={onSavePreset}
        >
          Save preset
        </Button>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button type="button" variant="ghost" onClick={onLoadPreset}>
            Apply preset
          </Button>
          <Button type="button" variant="ghost" onClick={onResetDraft}>
            Reset
          </Button>
        </div>
      </Card>

      <Button
        type="button"
        size="lg"
        className="w-full"
        icon={<Download className="h-5 w-5" aria-hidden />}
        disabled={isRendering}
        onClick={exportPng}
      >
        {isRendering ? "Rendering..." : "Export PNG"}
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        icon={<Save className="h-4 w-4" aria-hidden />}
        onClick={onSaveDraft}
      >
        Save draft
      </Button>
    </>
  );
}

function RangeControl({
  id,
  label,
  value,
  min,
  max,
  suffix,
  onChange
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <Label htmlFor={id} className="mb-0">
          {label}
        </Label>
        <span className="text-xs text-[var(--text-dim)]">
          {value}
          {suffix}
        </span>
      </div>
      <Input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </div>
  );
}

async function drawRecipeCard(
  context: CanvasRenderingContext2D,
  recipe: Recipe,
  format: ExportFormat,
  theme: ExportTheme,
  enabledBlockIds: ExportBlockId[],
  options: {
    overlayStrength: number;
    textScale: number;
    imageZoom: number;
    cardOpacity: number;
    cardRadius: number;
    fontId: ExportFontId;
    blockOrder: ExportBlockId[];
  }
) {
  const { width, height } = format;
  const scale = options.textScale / 100;
  const font = exportFonts.find((item) => item.id === options.fontId) ?? exportFonts[0];
  const activeBlocks = options.blockOrder.filter((blockId) => enabledBlockIds.includes(blockId));
  context.clearRect(0, 0, width, height);

  if (!format.transparent) {
    context.fillStyle = theme.background;
    context.fillRect(0, 0, width, height);
    const image = await loadImage(recipe.coverUrl);
    if (image) {
      drawCoverImage(context, image, 0, 0, width, height, options.imageZoom);
    }
    drawOverlay(context, width, height, options.overlayStrength);
  }

  const margin = Math.round(width * 0.08);
  const cardWidth = width - margin * 2;
  const cardHeight = height - margin * 2;
  const radius = Math.round((options.cardRadius / 20) * 44);
  roundedRect(context, margin, margin, cardWidth, cardHeight, radius);
  context.fillStyle = format.transparent
    ? hexToRgba(theme.background, options.cardOpacity / 100)
    : surfaceWithOpacity(theme.surface, options.cardOpacity / 100);
  context.fill();
  context.strokeStyle = theme.accent;
  context.lineWidth = 5;
  context.stroke();

  let cursorY = margin + 78;
  const contentX = margin + 54;
  const contentWidth = cardWidth - 108;

  for (const blockId of activeBlocks) {
    if (cursorY > height - margin - 90) break;

    if (blockId === "hero") {
      context.fillStyle = theme.accent;
      context.font = `700 ${Math.round(34 * scale)}px ${font.body}`;
      context.fillText(`${recipe.method.toUpperCase()} RECIPE`, contentX, cursorY);

      context.fillStyle = theme.text;
      const titleSize = Math.round(width * 0.075 * scale);
      wrapText(
        context,
        recipe.title,
        contentX,
        cursorY + 92,
        contentWidth,
        titleSize,
        Math.round(titleSize * 1.12),
        font.heading,
        3
      );

      context.fillStyle = theme.muted;
      context.font = `400 ${Math.round(30 * scale)}px ${font.body}`;
      wrapText(
        context,
        recipe.flavorNotes.slice(0, 3).join(" / ") || recipe.subtitle || "Brew recipe",
        contentX,
        cursorY + 292,
        contentWidth,
        Math.round(30 * scale),
        Math.round(44 * scale),
        font.body,
        2
      );
      cursorY += Math.round(345 * scale);
    }

    if (blockId === "specs") {
      const metrics = [
        ["Method", recipe.method],
        ["Coffee", `${recipe.doseGrams}g`],
        ["Water", `${recipe.waterGrams}g`],
        ["Ratio", formatRatio(recipe.doseGrams, recipe.waterGrams)],
        ["Temp", `${recipe.temperatureCelsius}C`],
        ["Time", formatDuration(recipe.totalTimeSeconds)]
      ];
      const cellWidth = (contentWidth - 32) / 2;
      metrics.forEach(([label, value], index) => {
        const x = contentX + (index % 2) * (cellWidth + 32);
        const y = cursorY + Math.floor(index / 2) * 104;
        context.fillStyle = "rgba(255,255,255,0.075)";
        roundedRect(context, x, y, cellWidth, 76, Math.max(10, radius / 2));
        context.fill();
        context.fillStyle = theme.muted;
        context.font = `700 ${Math.round(20 * scale)}px ${font.body}`;
        context.fillText(label.toUpperCase(), x + 22, y + 28);
        context.fillStyle = theme.text;
        context.font = `700 ${Math.round(28 * scale)}px ${font.body}`;
        context.fillText(value, x + 22, y + 58);
      });
      cursorY += 332;
    }

    if (blockId === "steps") {
      context.fillStyle = theme.accent;
      context.font = `700 ${Math.round(26 * scale)}px ${font.body}`;
      context.fillText("POURING STEPS", contentX, cursorY);

      context.fillStyle = theme.muted;
      context.font = `400 ${Math.round(26 * scale)}px ${font.body}`;
      recipe.steps.slice(0, 3).forEach((step, index) => {
        context.fillText(
          `${formatDuration(step.startsAtSeconds)}  ${step.label}`,
          contentX,
          cursorY + 48 + index * 42
        );
      });
      cursorY += 188;
    }

    if (blockId === "notes") {
      context.fillStyle = theme.muted;
      wrapText(
        context,
        recipe.description,
        contentX,
        cursorY,
        contentWidth,
        Math.round(26 * scale),
        Math.round(38 * scale),
        font.body,
        3
      );
      cursorY += 142;
    }

    if (blockId === "footer") {
      context.fillStyle = theme.accent;
      context.font = `700 ${Math.round(28 * scale)}px ${font.body}`;
      context.fillText(`@${recipe.author.handle}`, contentX, cursorY);
      context.fillStyle = theme.muted;
      context.font = `400 ${Math.round(24 * scale)}px ${font.body}`;
      context.fillText(
        `${recipe.steps.length} steps - ${recipe.visibility}`,
        contentX,
        cursorY + 42
      );
      cursorY += 96;
    }
  }
}

async function loadImage(src: string) {
  if (!src) {
    return null;
  }

  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  zoom: number
) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  const zoomFactor = zoom / 100;
  const baseSourceWidth =
    imageRatio > targetRatio ? image.naturalHeight * targetRatio : image.naturalWidth;
  const baseSourceHeight =
    imageRatio > targetRatio ? image.naturalHeight : image.naturalWidth / targetRatio;
  const sourceWidth = baseSourceWidth / zoomFactor;
  const sourceHeight = baseSourceHeight / zoomFactor;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawOverlay(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  overlayStrength: number
) {
  const alpha = Math.min(Math.max(overlayStrength / 100, 0.35), 0.85);
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
  gradient.addColorStop(0.55, `rgba(0, 0, 0, ${Math.max(alpha - 0.18, 0.25)})`);
  gradient.addColorStop(1, `rgba(0, 0, 0, ${Math.max(alpha - 0.35, 0.12)})`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

function surfaceWithOpacity(surface: string, opacity: number) {
  const match = surface.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
  if (!match) {
    return surface;
  }

  return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`;
}

function hexToRgba(hex: string, opacity: number) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
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
