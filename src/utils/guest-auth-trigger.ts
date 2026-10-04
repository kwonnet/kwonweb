/** Install once per guest visit. Capture interactions before links or post actions run. */
export function installGuestAuthTrigger(doc: Document, open: (mode: "signin" | "signup") => void, delay = 10_000) {
  let triggered = false;
  const reveal = (mode: "signin" | "signup" = "signup") => {
    if (!triggered) { triggered = true; open(mode); }
  };
  const timer = setTimeout(reveal, delay);
  const onClick = (event: Event) => {
    const target = event.target as Element | null;
    if (target?.closest?.("[data-guest-auth-dialog]")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const mode = target?.closest?.("[data-auth-mode]")?.getAttribute("data-auth-mode");
    reveal(mode === "signin" ? "signin" : "signup");
  };
  const onScroll = (event: Event) => {
    const target = event.target as Element | null;
    if (target?.closest?.("[data-guest-auth-dialog]")) return;
    const offset = target === (doc as unknown) ? doc.scrollingElement?.scrollTop : target?.scrollTop;
    if (offset && offset > 0) reveal();
  };
  // pointerdown blocks focus and mouse/touch controls; click also covers keyboard activation.
  doc.addEventListener("pointerdown", onClick, true);
  doc.addEventListener("click", onClick, true);
  doc.addEventListener("scroll", onScroll, true);
  return () => {
    clearTimeout(timer);
    doc.removeEventListener("pointerdown", onClick, true);
    doc.removeEventListener("click", onClick, true);
    doc.removeEventListener("scroll", onScroll, true);
  };
}
