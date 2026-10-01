"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { onEnter } from "@/lib/intro";
import { STORY } from "@/lib/motion";


export const PostStory = () => {
  useGSAP(() => {
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches)
      return;
    const one = (name: string) =>
      document.querySelector<HTMLElement>(`[data-story="${name}"]`);
    const back = one("back");
    const line = one("line");
    const meta = one("meta");
    const frame = one("frame");
    const words = Array.from(
      document.querySelectorAll<HTMLElement>('[data-story="text"] .hero-word'),
    );
    const [summary, ...intro] = words;
    const ease = gsap.parseEase("reveal") ? "reveal" : "expo.out";

    let tl: gsap.core.Timeline | undefined;
    const off = onEnter(() => {
      tl = gsap.timeline({ defaults: { duration: 0.9, ease } });
      tl.addLabel("frame", STORY.frame)
        .addLabel("summary", STORY.summary)
        .addLabel("intro", STORY.intro)
        .addLabel("meta", STORY.meta);

      if (back)
        tl.fromTo(
          back,
          { opacity: 0, x: -16, filter: "blur(6px)" },
          {
            opacity: 1,
            x: 0,
            filter: "blur(0px)",
            duration: 0.9,
            clearProps: "filter",
          },
          "frame",
        );
      if (line)
        tl.fromTo(
          line,
          { scaleX: 0 },
          { scaleX: 1, duration: 1.4, ease: "expo.inOut" },
          "frame+=0.05",
        );

      // Los textos suben desde su máscara (como el hero) y se enfocan al llegar
      const rise = { yPercent: 140, y: 0, filter: "blur(10px)" };
      const land = { yPercent: 0, filter: "blur(0px)", clearProps: "filter" };
      if (summary) tl.fromTo(summary, rise, land, "summary");
      if (intro.length)
        tl.fromTo(intro, rise, { ...land, stagger: 0 }, "intro");

      // El marco de la imagen (con su X) aparece justo antes de que la tinta lo llene
      if (frame)
        tl.fromTo(
          frame,
          { opacity: 0 },
          { opacity: 1, duration: 0.6, ease: "power1.out" },
          "meta+=0.1",
        );

      if (meta) {
        tl.set(meta, { opacity: 1 }, "meta");
        tl.fromTo(
          Array.from(meta.children),
          { opacity: 0, y: 14, filter: "blur(6px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.9,
            stagger: 0.12,
            clearProps: "filter",
          },
          "meta",
        );
      }
    });

    return () => {
      off();
      tl?.kill();
    };
  }, []);

  return null;
};
