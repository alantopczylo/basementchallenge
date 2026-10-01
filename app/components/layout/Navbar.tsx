"use client";

import { isLiveRoute } from "@/lib/site";
import { setSmoothScrollLocked } from "@/components/common/SmoothScroll";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { FlipLabel } from "@/components/common/FlipLabel";
import { HOME_PATH, onEnter } from "@/lib/intro";

// La entrada solo se reproduce en la primera carga de la visita (Navbar se vuelve a montar en cada página)
let navIntroDone = false;

gsap.registerPlugin(useGSAP, SplitText, CustomEase);

// Curva propia del menú: arranca con calma, acelera y se asienta suave (cubic-bezier .76,0,.24,1)
CustomEase.create("reveal", "0.16,1,0.3,1");
CustomEase.create("menu", "0.76,0,0.24,1");

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.6' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export interface NavbarProps {
  links?: Array<{ label: string; href: string }>;
  activeHref?: string;
  logo?: React.ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  links = [
    { label: "Showcase", href: "/showcase" },
    { label: "Services", href: "/services" },
    { label: "People", href: "/people" },
    { label: "Laboratory", href: "/laboratory" },
    { label: "Blog", href: "/blog" },
    { label: "Ventures", href: "/ventures" },
  ],
  activeHref = "/blog",
  logo,
  ctaLabel = "Contact us",
  ctaHref = "/contact",
}) => {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const glassRef = useRef<HTMLSpanElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const speedRef = useRef(1);
  const linksRef = useRef<HTMLUListElement>(null);
  const markerRef = useRef<HTMLLIElement>(null);

  // Menú mobile con GSAP. La navbar mide siempre su alto final: lo que se anima es solo lo que se ve
  // (un recorte del vidrio + el borde), nunca el layout ni el tamaño del blur, así no se traba.
  // Abrir = play, cerrar = reverse, simétrico aunque se toque a mitad.
  // useGSAP se encarga de la limpieza; matchMedia arma la animación solo en mobile/tablet (y en desktop no toca nada)
  useGSAP(
    () => {
      const nav = navRef.current;
      const panel = panelRef.current;
      const glass = glassRef.current;
      const ring = ringRef.current;
      if (!nav || !panel || !glass || !ring) return;

      const mm = gsap.matchMedia();
      mm.add(
        {
          compact: "(max-width: 1023px)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { compact, reduceMotion } = context.conditions as {
            compact: boolean;
            reduceMotion: boolean;
          };
          if (!compact) return;
          speedRef.current = reduceMotion ? 20 : 1;

          const items = gsap.utils.toArray<HTMLElement>(
            "[data-menu-item]",
            panel,
          );
          const HEAD = 40;
          const DUR = 0.7;
          const progress = { p: 0 };
          let full = nav.offsetHeight;

          // Solo el recorte del vidrio y el alto del borde cambian por frame; el layout nunca se anima
          const render = () => {
            const extra = Math.max(full - HEAD, 0);
            glass.style.clipPath = `inset(0px 0px ${(1 - progress.p) * extra}px 0px round 10px)`;
            ring.style.height = `${HEAD + progress.p * extra}px`;
          };
          render();
          const ro = new ResizeObserver(() => {
            full = nav.offsetHeight;
            render();
          });
          ro.observe(nav);

          gsap.set(lineRefs.current, { transformOrigin: "50% 50%" });
          const tl = gsap.timeline({ paused: true });
          tl.addLabel("open", 0)
            // 1) el vidrio baja
            .to(
              progress,
              { p: 1, duration: DUR, ease: "menu", onUpdate: render },
              "open",
            )
            .fromTo(
              backdropRef.current,
              { autoAlpha: 0 },
              { autoAlpha: 1, duration: 0.4, ease: "power2.out" },
              "open",
            )
            // 2) hamburguesa → escalera, con la misma curva y arranque que el vidrio
            .to(
              lineRefs.current,
              {
                scaleX: 0.6,
                x: (i: number) => [8, 0, -8][i],
                duration: 0.55,
                stagger: 0.05,
                ease: "menu",
              },
              "open",
            );

          // 3) cada bloque aparece entero justo cuando el vidrio llega a su borde superior
          const wipeEase = gsap.parseEase("menu");
          const arrival = (target: number) => {
            for (let t = 0; t <= DUR; t += 0.01) {
              if (wipeEase(t / DUR) >= target) return t;
            }
            return DUR;
          };
          const navTop = nav.getBoundingClientRect().top;
          const extra = Math.max(full - HEAD, 1);
          items.forEach((el, i) => {
            const top = el.getBoundingClientRect().top - navTop;
            const rawReach = arrival(
              Math.min(Math.max((top - HEAD) / extra, 0), 0.98),
            );
            // Los bloques de abajo no esperan a que el vidrio termine de bajar: se topa el retraso para que el botón no llegue tarde
            const reach = Math.min(rawReach, DUR * 0.5);
            const stagger = Math.min(i * 0.04, 0.16);
            tl.fromTo(
              el,
              { autoAlpha: 0 },
              { autoAlpha: 1, duration: 0.3, ease: "power1.out" },
              `open+=${(0.1 + reach + stagger).toFixed(3)}`,
            );
            // El texto de cada bloque sube letra por letra desde una máscara (SplitText), un instante después del bloque
            const label = el.querySelector<HTMLElement>("[data-menu-label]");
            if (label) {
              const split = SplitText.create(label, {
                type: "chars",
                mask: "chars",
                smartWrap: true,
              });
              tl.fromTo(
                split.chars,
                { yPercent: 115 },
                {
                  yPercent: 0,
                  duration: 0.35,
                  ease: "power3.out",
                  stagger: { amount: 0.03 },
                },
                `open+=${(0.13 + reach + stagger).toFixed(3)}`,
              );
            }
          });

          tlRef.current = tl;
          return () => {
            ro.disconnect();
            tlRef.current = null;
            glass.style.clipPath = "";
            ring.style.height = "";
          };
        },
      );
      return () => mm.revert();
    },
    { scope: navRef },
  );

  // Desktop: el cuadradito naranja viaja bajo los links. Descansa bajo el link activo, sigue al mouse y vuelve al soltar.
  // Al moverse, el borde que va adelante llega primero y el de atrás lo alcanza después: se estira y se vuelve a juntar.
  useGSAP(
    () => {
      const list = linksRef.current;
      const marker = markerRef.current;
      if (!list || !marker) return;
      const anchors = gsap.utils.toArray<HTMLElement>("a", list);
      const activeIndex = links.findIndex((l) => l.href === activeHref);

      const mm = gsap.matchMedia();
      mm.add(
        {
          desktop: "(min-width: 1024px) and (hover: hover)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { desktop, reduceMotion } = context.conditions as {
            desktop: boolean;
            reduceMotion: boolean;
          };
          if (!desktop) return;

          const SIZE = 4;
          const edge = { l: 0, r: SIZE };
          let y = 0;
          let current = -1;
          let movingRight = true;
          gsap.set(marker, { transformOrigin: "0% 50%" });

          // El estirado tiene un largo máximo: viaja como una gota corta, no como una línea que cruza todo el menú
          const MAX = 26;
          const render = () => {
            if (edge.r - edge.l > MAX) {
              if (movingRight) edge.l = edge.r - MAX;
              else edge.r = edge.l + MAX;
            }
            marker.style.transform = `translate3d(${edge.l}px, ${y}px, 0) scaleX(${Math.max(edge.r - edge.l, 0) / SIZE})`;
          };
          // Posición del cuadrado bajo el centro del texto de cada link
          const measure = (index: number) => {
            const a = anchors[index];
            const box = a.getBoundingClientRect();
            const host = list.getBoundingClientRect();
            const center = box.left - host.left + box.width / 2;
            return {
              l: center - SIZE / 2,
              r: center + SIZE / 2,
              y: box.bottom - host.top - 3,
            };
          };

          const rest = list.querySelector<HTMLElement>("[data-rest-marker]");
          // El punto de reposo (el del HTML, dentro del link activo) es el que se ve siempre que nadie interactúa:
          // así se ve idéntico desde el primer pintado y nunca se mueve solo. El que viaja solo aparece mientras hay movimiento.
          let travelling = false;
          const takeOver = () => {
            if (travelling || activeIndex < 0 || !rest) return;
            const rb = rest.getBoundingClientRect();
            const hb = list.getBoundingClientRect();
            edge.l = rb.left - hb.left;
            edge.r = edge.l + SIZE;
            y = rb.top - hb.top;
            current = activeIndex;
            movingRight = true;
            render();
            gsap.set(marker, { autoAlpha: 1 });
            gsap.set(rest, { autoAlpha: 0 });
            travelling = true;
          };
          const release = () => {
            if (!travelling) return;
            gsap.set(marker, { autoAlpha: 0 });
            if (rest) gsap.set(rest, { autoAlpha: 1 });
            travelling = false;
          };

          const moveTo = (
            index: number,
            instant = false,
            onDone?: () => void,
          ) => {
            const to = measure(index);
            y = to.y;
            const goingRight = current === -1 ? true : index > current;
            current = index;
            movingRight = goingRight;
            gsap.killTweensOf(edge);
            if (instant || reduceMotion) {
              edge.l = to.l;
              edge.r = to.r;
              render();
              onDone?.();
              return;
            }
            const lead = goingRight ? "r" : "l";
            const trail = goingRight ? "l" : "r";
            gsap.to(edge, {
              [lead]: to[lead],
              duration: 0.28,
              ease: "power3.out",
              onUpdate: render,
            });
            gsap.to(edge, {
              [trail]: to[trail],
              duration: 0.36,
              delay: 0.02,
              ease: "power3.out",
              onUpdate: render,
              onComplete: onDone,
            });
          };

          const show = () =>
            gsap.to(marker, { autoAlpha: 1, duration: 0.25, overwrite: true });
          const hide = () =>
            gsap.to(marker, { autoAlpha: 0, duration: 0.25, overwrite: true });

          const removers: Array<() => void> = [];
          const listen = (
            target: HTMLElement,
            type: string,
            fn: EventListener,
          ) => {
            target.addEventListener(type, fn);
            removers.push(() => target.removeEventListener(type, fn));
          };
          anchors.forEach((a, i) => {
            const go = () => {
              // Durante la entrada de la navbar no se toca nada
              if (!navIntroDone) return;
              if (activeIndex >= 0) {
                takeOver();
                moveTo(i);
              } else {
                moveTo(i, current === -1);
                show();
              }
            };
            listen(a, "pointerenter", go);
            listen(a, "focusin", () => {
              if (a.matches(":focus-visible")) go();
            });
          });
          const leave = () => {
            if (activeIndex >= 0) {
              // Vuelve al link activo y, al llegar, el punto de reposo del HTML toma su lugar
              if (travelling) moveTo(activeIndex, false, release);
            } else {
              current = -1;
              hide();
            }
          };
          listen(list, "pointerleave", leave);
          listen(list, "focusout", (e) => {
            if (!list.contains((e as FocusEvent).relatedTarget as Node | null))
              leave();
          });

          // Si cambia el ancho (resize, fuente que termina de cargar) se recalcula sin animar
          const ro = new ResizeObserver(() => {
            if (current >= 0 && (travelling || activeIndex < 0))
              moveTo(current, true);
          });
          ro.observe(list);

          return () => {
            ro.disconnect();
            removers.forEach((fn) => fn());
            marker.style.transform = "";
            gsap.set(marker, { autoAlpha: 0 });
            if (rest) gsap.set(rest, { clearProps: "visibility,opacity" });
          };
        },
      );
      return () => mm.revert();
    },
    { scope: navRef },
  );

  // Entrada de la navbar (una sola vez por visita), pensada como un plano que se traza:
  // en desktop primero se dibuja el contorno de la barra, después se llena el vidrio y al final aparece el contenido, de izquierda a derecha.
  // Entra cuando el título del hero está terminando, así hay un solo protagonista a la vez.
  // Solo opacity y trazo: nada de transform ni filter sobre la barra, así el vidrio desenfoca la página en cuanto aparece.
  // El estado inicial lo pone el CSS (.nav-intro en globals.css) para que no haya flash antes de que GSAP arranque.
  useGSAP(
    () => {
      const nav = navRef.current;
      if (!nav) return;
      const items = gsap.utils.toArray<HTMLElement>("[data-nav-in]", nav);
      const glass = nav.querySelector<HTMLElement>("[data-nav-glass]");
      const ring = nav.querySelector<HTMLElement>("[data-nav-ring]");
      const shell = [glass, ring].filter(Boolean) as HTMLElement[];
      const line = nav.querySelector<SVGRectElement>("[data-nav-line] rect");
      // El trazo se mide en px reales (no normalizado a 0–1): GSAP redondea los valores chicos y el trazo saltaba de vacío a completo
      let len = 0;
      // En mobile/tablet el SVG está con display: none y getTotalLength() tira error: solo se mide si se dibuja
      if (line && line.getClientRects().length) {
        len = line.getTotalLength();
        line.removeAttribute("pathLength");
        line.style.strokeDasharray = `${len}`;
        line.style.strokeDashoffset = `${len}`;
      }
      // Estado final en línea (el CSS inicial seguiría escondiéndolos si solo se limpiaran los estilos de GSAP)
      const show = () => {
        gsap.set([...items, ...shell], { opacity: 1 });
        if (line && len) gsap.set(line, { strokeDashoffset: len });
        navIntroDone = true;
        nav.dispatchEvent(new Event("navintro"));
      };
      // Ya se mostró en esta visita (navegación entre páginas): aparece directa
      if (navIntroDone) {
        show();
        return;
      }
      const mm = gsap.matchMedia();
      mm.add(
        {
          desktop: "(min-width: 1024px)",
          motion: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          const { desktop, motion } = context.conditions as {
            desktop: boolean;
            motion: boolean;
          };
          if (!motion) {
            show();
            return;
          }
          let tl: gsap.core.Timeline | undefined;
          let cancelled = false;
          let idle = 0;
          let offLit: (() => void) | undefined;
          const play = () => {
            if (cancelled) return;
            tl = gsap.timeline({ delay: 0.15, onComplete: show });
            // 1) El contorno se pinta entero, con un solo trazo: borde de arriba (izq. a der.), lado derecho, borde de abajo (der. a izq.) y lado izquierdo
            //    El borde real del vidrio NO aparece hasta que el trazo cerró, si no se vería todo junto.
            if (desktop && line && len) {
              tl.fromTo(
                line,
                { strokeDashoffset: len },
                { strokeDashoffset: 0, duration: 0.8, ease: "power1.inOut" },
                0,
              );
            }
            const fill = desktop ? 0.45 : 0;
            // 2) El vidrio se llena por dentro mientras el trazo cierra la vuelta
            if (glass) {
              tl.fromTo(
                glass,
                { opacity: 0 },
                { opacity: 1, duration: 0.6, ease: "power2.out" },
                fill,
              );
            }
            // 3) Cuando el trazo cerró, el borde real del vidrio lo reemplaza (fundido cruzado)
            const close = desktop ? 0.8 : 0;
            if (ring) {
              tl.fromTo(
                ring,
                { opacity: 0 },
                { opacity: 1, duration: 0.4, ease: "power1.out" },
                close,
              );
            }
            if (desktop && line && len) {
              tl.to(
                line,
                { opacity: 0, duration: 0.4, ease: "power1.out" },
                close,
              );
            }
            // 4) El contenido aparece de izquierda a derecha
            tl.fromTo(
              items,
              { opacity: 0 },
              {
                opacity: 1,
                duration: 0.45,
                ease: "power2.out",
                stagger: 0.04,
              },
              fill + 0.25,
            );
          };
          // Arranca con el hilo principal libre (mismo motivo que el título del hero)
          const raf = requestAnimationFrame(() => {
            if (typeof window.requestIdleCallback === "function")
              idle = window.requestIdleCallback(
                () => {
                  offLit = onEnter(play); // espera a que se prenda la luz (intro)
                },
                { timeout: 250 },
              );
            else offLit = onEnter(play);
          });
          return () => {
            cancelled = true;
            offLit?.();
            cancelAnimationFrame(raf);
            if (idle) window.cancelIdleCallback(idle);
            tl?.kill();
          };
        },
      );
      return () => mm.revert();
    },
    { scope: navRef },
  );

  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;
    // Cerrar es un poco más rápido que abrir; con "reducir movimiento" todo es casi instantáneo
    tl.timeScale(speedRef.current === 20 ? 20 : open ? 1 : 1.6);
    if (open) tl.play();
    else tl.reverse();
  }, [open]);

  // Menú mobile: Escape lo cierra y mientras está abierto la página de atrás no scrollea
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      // el foco vuelve al botón que abrió el menú (el panel queda inert y el foco se perdería)
      toggleRef.current?.focus();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setSmoothScrollLocked(true);
    window.addEventListener("keydown", onKey);
    return () => {
      setSmoothScrollLocked(false);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <nav
        ref={navRef}
        className={`${navIntroDone ? "" : "nav-intro"} pointer-events-none fixed inset-x-0 top-[23px] z-50 mx-auto w-[calc(100%-24px)] md:w-[calc(100%-64px)] md:max-w-[1372px] lg:pointer-events-auto`}
      >
        {/* Vidrio: blur + degradé + noise. En mobile se recorta (clip-path) y GSAP lo destapa hacia abajo */}
        <span
          ref={glassRef}
          data-nav-glass
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[10px] backdrop-blur-[15px] [clip-path:inset(0_0_calc(100%-40px)_0_round_10px)] lg:[clip-path:none]"
          style={{
            background:
              "linear-gradient(90deg, rgba(74,74,74,0.25) 0%, rgba(153,153,153,0.25) 100%)",
          }}
        >
          {/* Monotone noise: negro 10%, size 0.25 (grano fino) */}
          <span
            className="absolute inset-0"
            style={{
              backgroundImage: NOISE,
              backgroundSize: "200px 200px",
              opacity: 0.2,
            }}
          />
        </span>
        {/* Borde y sombra: su alto acompaña al recorte */}
        <span
          ref={ringRef}
          data-nav-ring
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-10 rounded-[10px] lg:h-full"
          style={{
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,0.1), 0px 3px 15px 0px rgba(18,18,18,0.05)",
          }}
        />
        {/* Contorno que se dibuja en la entrada (solo desktop): trazo de 1px que recorre la barra. Invisible hasta que GSAP lo anima */}
        <svg
          aria-hidden
          data-nav-line
          className="pointer-events-none absolute inset-0 hidden h-full w-full overflow-visible lg:block"
        >
          <rect
            x="0.5"
            y="0.5"
            rx="9.5"
            pathLength={1}
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1"
            strokeDasharray="1"
            strokeDashoffset="1"
            style={{ width: "calc(100% - 1px)", height: "calc(100% - 1px)" }}
          />
        </svg>
        <div className="pointer-events-auto relative flex h-10 items-center justify-between px-4 lg:h-[50px] lg:pr-[8px]">
          <Link
            href={HOME_PATH}
            aria-label="basement."
            data-nav-in
            className="relative shrink-0 text-basement-white"
          >
            {logo || (
              <>
                {/* Mobile: logo PNG 107x15 como máscara, en basement-white */}
                <span
                  aria-hidden
                  className="block h-[15px] w-[107px] bg-basement-white lg:hidden"
                  style={{
                    WebkitMaskImage: "url('/images/basement.png')",
                    maskImage: "url('/images/basement.png')",
                    WebkitMaskSize: "100% 100%",
                    maskSize: "100% 100%",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                  }}
                />
                <span className="hidden font-geist text-lg font-semibold tracking-tight lg:block">
                  basement.
                </span>
              </>
            )}
          </Link>

          <ul
            ref={linksRef}
            className="absolute left-1/2 z-10 hidden w-max -translate-x-1/2 items-center gap-1 whitespace-nowrap lg:flex"
          >
            {links.map((link) => (
              <li key={link.href} data-nav-in>
                <Link
                  href={link.href}
                  prefetch={isLiveRoute(link.href) ? undefined : false}
                  onClick={(e) => {
                    // El listado del blog es la home (/blog): si ya estás ahí no se navega (recargaba toda la página y la navbar parpadeaba)
                    if (
                      link.href === HOME_PATH &&
                      window.location.pathname === HOME_PATH
                    ) {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className={`body-semibold relative inline-flex items-center gap-2 px-3 py-2 xl:px-4 ${
                    link.href === activeHref
                      ? "text-basement-orange"
                      : "text-basement-white"
                  }`}
                >
                  <FlipLabel
                    hoverClassName={
                      link.href === activeHref
                        ? "text-basement-orange"
                        : undefined
                    }
                  >
                    {link.label}
                  </FlipLabel>
                  {/* Punto de reposo: viene ya en el HTML del servidor, así está desde el primer pintado. GSAP lo reemplaza por el que viaja */}
                  {link.href === activeHref && (
                    <span
                      aria-hidden
                      data-rest-marker
                      className="pointer-events-none absolute left-1/2 top-full -mt-[3px] h-1 w-1 -translate-x-1/2 bg-basement-orange"
                    />
                  )}
                </Link>
              </li>
            ))}
            {/* Cuadradito naranja de la marca: viaja bajo el link activo/hover (lo mueve GSAP) */}
            <li
              ref={markerRef}
              aria-hidden
              className="pointer-events-none invisible absolute left-0 top-0 h-1 w-1 bg-basement-orange"
            />
          </ul>

          <span data-nav-in className="hidden lg:block">
            <Link
              href={ctaHref}
              prefetch={isLiveRoute(ctaHref) ? undefined : false}
              className="btn btn-dark btn-glow-hover relative"
            >
              {ctaLabel}
            </Link>
          </span>

          {/* Hamburguer (mobile): 40 x 12.5, tres líneas de 1px que se transforman en una X al abrir */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            ref={toggleRef}
            data-nav-in
            onClick={() => setOpen((v) => !v)}
            className="relative h-[13px] w-10 shrink-0 translate-y-[0.5px] lg:hidden"
          >
            {[0, 6, 12].map((top, i) => (
              <span
                key={i}
                aria-hidden
                ref={(el) => {
                  lineRefs.current[i] = el;
                }}
                className="absolute inset-x-0 mx-auto block h-px w-10 bg-basement-white"
                style={{ top }}
              />
            ))}
          </button>
        </div>
        {/* Menú mobile: la navbar se estira hacia abajo (GSAP anima la altura) y el bento aparece adentro */}
        <div
          id="mobile-menu"
          ref={panelRef}
          inert={!open}
          className="pointer-events-auto relative lg:hidden"
        >
          <div>
            <div className="p-2 pt-1">
              {/* Bento: 2 columnas, filas de 72px (88px en tablet) y gap 8. Primer link ancho, segundo alto, el resto cuadrados */}
              <ul className="grid auto-rows-[72px] grid-cols-2 gap-2 md:auto-rows-[88px]">
                {links.map((link, i) => {
                  const active = link.href === activeHref;
                  const span =
                    i === 0 ? "col-span-2" : i === 1 ? "row-span-2" : "";
                  return (
                    <li
                      key={link.href}
                      data-menu-item
                      className={`max-lg:invisible max-lg:opacity-0 ${span}`}
                    >
                      <Link
                        href={link.href}
                        prefetch={isLiveRoute(link.href) ? undefined : false}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={`relative flex h-full flex-col justify-end rounded-lg p-3 text-[clamp(17px,5.3vw,24px)] font-semibold leading-[1.1] tracking-[-0.03em] transition-colors duration-300 ${
                          active
                            ? "bg-basement-orange/10 text-basement-orange"
                            : "bg-white/5 text-basement-white hover:bg-white/10 hover:text-basement-orange"
                        }`}
                        style={{
                          boxShadow: `inset 0 0 0 1px ${active ? "rgba(255,77,0,0.35)" : "rgba(255,255,255,0.1)"}`,
                        }}
                      >
                        {active && (
                          <span
                            aria-hidden
                            className="absolute right-3 top-3 h-1 w-1 bg-basement-orange"
                          />
                        )}
                        <span className="-my-[0.1em] block overflow-hidden py-[0.1em]">
                          <span data-menu-label className="block">
                            {link.label}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div
                data-menu-item
                className="relative mt-2 max-lg:invisible max-lg:opacity-0"
              >
                <Link
                  href={ctaHref}
                  prefetch={isLiveRoute(ctaHref) ? undefined : false}
                  onClick={() => setOpen(false)}
                  className="btn btn-dark w-full"
                >
                  {ctaLabel}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Fondo que oscurece la página mientras el menú está abierto; un click lo cierra (lo anima la misma timeline) */}
      <div
        ref={backdropRef}
        aria-hidden
        onClick={() => setOpen(false)}
        className="invisible fixed inset-0 z-40 bg-black/75 opacity-0 backdrop-blur-[3px] lg:hidden"
      />
    </>
  );
};
