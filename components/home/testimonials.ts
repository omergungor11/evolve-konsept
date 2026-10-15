import { gsap } from "gsap";

/** Original testimonial geometry, easing, and drag thresholds. */
export function bindTestimonials(carousel: HTMLElement, reduced: boolean) {
  const track = carousel.firstElementChild as HTMLElement | null;
  if (!track) return () => {};
  const cleanup: Array<() => void> = [];
  const cards = Array.from(track.querySelectorAll<HTMLElement>("article"));
  let expanded: number | null = null;
  const count = cards.length / 2;
  function resize(card: HTMLElement, open: boolean, animate: boolean) {
    const quote = card.querySelector<HTMLElement>("[data-review-quote]");
    if (!quote || !card.hasAttribute("data-clickable")) return;
    const collapsed = Math.round(
      3 * parseFloat(getComputedStyle(quote).lineHeight),
    );
    const currentQuote = quote.offsetHeight;
    const currentCard = card.offsetHeight;
    gsap.killTweensOf([card, quote]);
    quote.style.maxHeight = "none";
    card.style.height = "";
    const fullQuote = quote.offsetHeight;
    const fullCard = card.offsetHeight;
    quote.style.maxHeight = `${collapsed}px`;
    const smallCard = card.offsetHeight;
    quote.toggleAttribute("data-clamped", !open);
    card.setAttribute("aria-expanded", String(open));
    const hint = quote.nextElementSibling;
    if (hint?.tagName === "SPAN")
      hint.textContent = open ? "← Click to collapse" : "Click to read more →";
    if (!animate || reduced) {
      quote.style.maxHeight = open ? "" : `${collapsed}px`;
      return;
    }
    quote.style.maxHeight = `${currentQuote}px`;
    card.style.height = `${currentCard}px`;
    gsap
      .timeline({
        onComplete: () => {
          card.style.height = "";
          if (open) quote.style.maxHeight = "";
        },
      })
      .to(
        card,
        {
          height: open ? fullCard : smallCard,
          duration: 0.6,
          ease: "expo.inOut",
        },
        0,
      )
      .to(
        quote,
        {
          maxHeight: open ? fullQuote : collapsed,
          duration: 0.6,
          ease: "expo.inOut",
        },
        0,
      );
  }
  cards.forEach((card, index) => {
    const wrapper = card.parentElement!;
    const quote = card.querySelector<HTMLElement>("[data-review-quote]");
    const parts: Array<[Element | null, number]> = [
      [card, 0.22],
      [card.firstElementChild, 0.05],
      [card.querySelector('[aria-label$="out of 5 stars"]'), 0.07],
      [quote, 0.1],
      [card.querySelector("footer"), 0.06],
    ];
    const move = (event: MouseEvent) => {
      if (reduced) return;
      const bounds = wrapper.getBoundingClientRect();
      const x = event.clientX - bounds.left - bounds.width / 2;
      const y = event.clientY - bounds.top - bounds.height / 2;
      parts.forEach(([element, factor]) => {
        if (element)
          gsap.to(element, {
            x: x * factor,
            y: y * factor,
            duration: 0.5,
            ease: "power2.out",
            overwrite: "auto",
          });
      });
    };
    const leave = () => {
      if (!reduced)
        gsap.to(parts.map(([element]) => element).filter(Boolean), {
          x: 0,
          y: 0,
          duration: 0.8,
          ease: "elastic.out(1, 0.5)",
          overwrite: "auto",
        });
    };
    const toggle = () => {
      expanded = expanded === index % count ? null : index % count;
      cards.forEach((target, i) =>
        resize(target, i % count === expanded, true),
      );
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    };
    if (card.hasAttribute("data-clickable")) {
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      resize(card, false, false);
      card.addEventListener("click", toggle);
      card.addEventListener("keydown", key);
    }
    wrapper.addEventListener("mousemove", move);
    wrapper.addEventListener("mouseleave", leave);
    cleanup.push(() => {
      gsap.killTweensOf(parts.map(([element]) => element).filter(Boolean));
      wrapper.removeEventListener("mousemove", move);
      wrapper.removeEventListener("mouseleave", leave);
      card.removeEventListener("click", toggle);
      card.removeEventListener("keydown", key);
    });
  });
  if (!reduced) {
    const half = track.scrollWidth / 2;
    const wrap = gsap.utils.wrap(-half, 0);
    // Native speed is half-width / 50: 3512 / 50 = 70.24 px per second.
    const speed = half / 50;
    let x = 0,
      dragging = false,
      hovering = false,
      pressed = false,
      startX = 0,
      startPosition = 0,
      pointer: number | null = null,
      suppressClick = false;
    let ticking = false;
    const tick = (_time: number, delta: number) => {
      if (!dragging && !hovering) x -= (delta / 1000) * speed;
      x = wrap(x);
      gsap.set(track, { x });
    };
    // Observe the stationary viewport; a translated track must not stop its own ticker.
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      if (visible && !ticking) {
        gsap.ticker.add(tick);
        ticking = true;
      } else if (!visible && ticking) {
        gsap.ticker.remove(tick);
        ticking = false;
      }
    });
    observer.observe(carousel);
    const enter = () => {
      hovering = true;
    };
    const leave = () => {
      hovering = false;
    };
    const down = (event: PointerEvent) => {
      if (
        pointer !== null ||
        (event.target as Element).closest(
          "button,a",
        )
      )
        return;
      pointer = event.pointerId;
      suppressClick = false;
      pressed = true;
      dragging = false;
      startX = event.clientX;
      startPosition = x;
    };
    const move = (event: PointerEvent) => {
      if (event.pointerId !== pointer || !pressed) return;
      const distance = event.clientX - startX;
      if (!dragging) {
        if (Math.abs(distance) < 5) return;
        dragging = true;
        suppressClick = true;
        track.style.cursor = "grabbing";
        try {
          track.setPointerCapture(event.pointerId);
        } catch {}
      }
      x = startPosition + distance;
    };
    const up = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return;
      if (dragging) {
        try {
          track.releasePointerCapture(event.pointerId);
        } catch {}
      }
      dragging = false;
      pressed = false;
      pointer = null;
      track.style.cursor = "grab";
    };
    const click = (event: MouseEvent) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    };
    track.style.cursor = "grab";
    track.addEventListener("click", click, true);
    track.addEventListener("pointerdown", down);
    track.addEventListener("pointerenter", enter);
    track.addEventListener("pointerleave", leave);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    cleanup.push(() => {
      observer.disconnect();
      gsap.ticker.remove(tick);
      track.removeEventListener("click", click, true);
      track.removeEventListener("pointerdown", down);
      track.removeEventListener("pointerenter", enter);
      track.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    });
  }
  return () => cleanup.forEach((dispose) => dispose());
}
