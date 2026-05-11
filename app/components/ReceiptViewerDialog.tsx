"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { ExternalLink, Minus, Plus, RotateCcw, X } from "lucide-react";
import { cn } from "@/app/lib/utils";

const HEIC_TYPES = new Set(["image/heic", "image/heif"]);
const MIN_SCALE = 1;
const MAX_SCALE = 8;

type Props = {
  url: string;
  fileType: string | null;
  fileName: string | null;
  className?: string;
  children: React.ReactNode;
};

export function ReceiptViewerDialog({
  url,
  fileType,
  fileName,
  className,
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ sx: number; sy: number; tx: number; ty: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isHEIC = fileType ? HEIC_TYPES.has(fileType) : false;
  const isPDF = fileType === "application/pdf";
  const isImage = !isHEIC && (fileType?.startsWith("image/") ?? false);

  function resetTransform() {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }

  function zoomBy(factor: number) {
    setScale((s) => {
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s * factor));
      if (next <= MIN_SCALE) setTranslate({ x: 0, y: 0 });
      return next;
    });
  }

  // Non-passive wheel listener for smooth pinch-to-zoom / scroll-to-zoom
  useEffect(() => {
    if (!open || !isImage) return;
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScale((s) => {
        const next = Math.max(
          MIN_SCALE,
          Math.min(MAX_SCALE, s * (e.deltaY < 0 ? 1.12 : 0.88))
        );
        if (next <= MIN_SCALE) setTranslate({ x: 0, y: 0 });
        return next;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open, isImage]);

  // Reset transform when dialog closes
  useEffect(() => {
    if (!open) resetTransform();
  }, [open]);

  function handleMouseDown(e: React.MouseEvent) {
    if (scale <= 1) return;
    e.preventDefault();
    dragRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      tx: translate.x,
      ty: translate.y,
    };
    setIsDragging(true);
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragRef.current) return;
    setTranslate({
      x: dragRef.current.tx + e.clientX - dragRef.current.sx,
      y: dragRef.current.ty + e.clientY - dragRef.current.sy,
    });
  }

  function handleMouseUp() {
    dragRef.current = null;
    setIsDragging(false);
  }

  if (isHEIC) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        className={cn("cursor-pointer text-left", className)}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Dialog.Popup className="fixed inset-0 z-50 overflow-y-auto flex p-4 data-ending-style:opacity-0 data-starting-style:opacity-0 transition-opacity duration-200 outline-none">
            <div className="relative flex flex-col bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden w-full max-w-3xl max-h-[calc(100dvh-2rem)] my-auto mx-auto">

              {/* Toolbar */}
              <div className="flex items-center justify-between gap-3 px-3 py-2.5 border-b border-white/10 shrink-0">
                <p className="text-sm font-medium text-zinc-200 truncate min-w-0">
                  {fileName ?? "Receipt"}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  {isImage && (
                    <>
                      <button
                        type="button"
                        onClick={() => zoomBy(0.67)}
                        disabled={scale <= MIN_SCALE}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Zoom out"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs text-zinc-500 tabular-nums w-8 text-center">
                        {Math.round(scale * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => zoomBy(1.5)}
                        disabled={scale >= MAX_SCALE}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Zoom in"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={resetTransform}
                        disabled={scale === 1}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Reset zoom"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-px h-4 bg-white/15 mx-0.5" />
                    </>
                  )}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Open in browser"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <Dialog.Close
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Dialog.Close>
                </div>
              </div>

              {/* Image body */}
              {isImage && (
                <div
                  ref={containerRef}
                  className="flex-1 overflow-hidden flex items-center justify-center bg-zinc-950/60 min-h-0 select-none"
                  style={{
                    cursor:
                      scale > 1
                        ? isDragging
                          ? "grabbing"
                          : "grab"
                        : "zoom-in",
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <img
                    src={url}
                    alt={fileName ?? "Receipt"}
                    draggable={false}
                    className="max-w-full max-h-[calc(100dvh-6rem)] object-contain pointer-events-none"
                    style={{
                      transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                      transition: isDragging ? "none" : "transform 0.15s ease",
                    }}
                  />
                </div>
              )}

              {/* PDF body */}
              {isPDF && (
                <iframe
                  src={url}
                  className="flex-1 border-0 min-h-[70vh]"
                  title={fileName ?? "Receipt"}
                />
              )}
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
