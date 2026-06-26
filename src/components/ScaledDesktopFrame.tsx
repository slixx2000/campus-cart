"use client";

import { useEffect, useRef, useState } from "react";

type ScaledDesktopFrameProps = {
  children: React.ReactNode;
  desktopWidth?: number;
};

export default function ScaledDesktopFrame({
  children,
  desktopWidth = 1320,
}: ScaledDesktopFrameProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [canvasWidth, setCanvasWidth] = useState(desktopWidth);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateScale = () => {
      const viewport = window.innerWidth;

      // Keep desktop composition but avoid extremely tiny scales that soften text/graphics.
      const adaptiveDesktopWidth =
        viewport < 640 ? 760 : viewport < 1024 ? 1024 : desktopWidth;

      const nextScale = Math.min(1, viewport / adaptiveDesktopWidth);

      setCanvasWidth((currentWidth) => (currentWidth === adaptiveDesktopWidth ? currentWidth : adaptiveDesktopWidth));
      setScale((currentScale) => (Math.abs(currentScale - nextScale) < 0.001 ? currentScale : nextScale));
    };

    updateScale();
    window.addEventListener("resize", updateScale, { passive: true });
    return () => window.removeEventListener("resize", updateScale);
  }, [desktopWidth]);

  return (
    <div className="flex w-full justify-center overflow-x-hidden">
      <div
        ref={canvasRef}
        className="mx-auto"
        style={{
          width: `${canvasWidth}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
