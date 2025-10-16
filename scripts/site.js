import anime from "https://esm.sh/animejs@3.2.1/lib/anime.es.js";
import Typed from "https://esm.sh/typed.js@2.1.0";

// Header underline animation
const bar = document.querySelector(".header__bar");
if (bar) {
  anime({ targets: bar, width: ["0%", "100%"], easing: "easeOutQuad", duration: 1200, delay: 200 });
  const header = bar.closest("header");
  if (header) {
    ["mouseenter", "focusin"].forEach((evt) => {
      header.addEventListener(evt, () => {
        anime({
          targets: bar,
          opacity: [0.6, 1],
          easing: "easeInOutSine",
          direction: "alternate",
          duration: 500,
        });
      });
    });
  }
}

// Hero typing
const heroTarget = document.querySelector(".hero-typed");
if (heroTarget) {
  new Typed(heroTarget, {
    strings: [
      "notes",
      "references",
      "weekly logs",
      "snippets",
    ],
    typeSpeed: 40,
    backSpeed: 20,
    backDelay: 1100,
    smartBackspace: true,
    loop: true,
    showCursor: true,
    cursorChar: "▌",
  });
}

// Sidebar search placeholder typing (wait for Pagefind UI to render input)
const searchContainer = document.querySelector("#search");
if (searchContainer) {
  const initTyping = () => {
    const input = searchContainer.querySelector("input");
    if (input && !input.dataset.typedAttached) {
      input.dataset.typedAttached = "1";
      const hintsAttr = searchContainer.getAttribute("data-hints");
      const hints = hintsAttr ? JSON.parse(hintsAttr) : [
        "Search: RFD 1",
        "Search: deno task build",
        "Search: code snippets",
      ];
      new Typed(input, {
        strings: hints,
        typeSpeed: 18,
        backSpeed: 12,
        backDelay: 1600,
        loop: true,
        showCursor: false,
        attr: "placeholder",
      });
    }
  };
  initTyping();
  const mo = new MutationObserver(initTyping);
  mo.observe(searchContainer, { childList: true, subtree: true });
}
