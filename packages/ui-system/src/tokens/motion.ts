/** Motion durations (ms) — physically plausible, not robotic. */
export const motion = {
  easing: {
    easeOutApple: "cubic-bezier(0.16, 1, 0.3, 1)",
    easeSmooth: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  duration: {
    micro: 150,
    microMax: 180,
    ui: 220,
    uiMax: 320,
    page: 520,
    pageMax: 700,
    data: 400,
    dataMax: 500,
    background: 90_000,
  },
  distance: {
    cardEnterY: 8,
    buttonHoverY: -1,
  },
  scale: {
    press: 0.98,
    modalFrom: 0.98,
    modalTo: 1,
  },
} as const;
