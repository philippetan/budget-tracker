"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

/**
 * Smooth (eased) scrolling for the public pages, using Lenis. Section links
 * like "#features" glide into place below the sticky header. Skipped for
 * visitors who ask their device to reduce motion. Touch scrolling stays
 * native. Render it once on a page; it cleans up when the page unmounts.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      autoRaf: true,
      // Handle in-page links. Sections already leave room for the sticky
      // header with scroll-mt-16, which Lenis respects, so no extra offset.
      anchors: true,
    });
    return () => lenis.destroy();
  }, []);

  return null;
}
