/** Install once per guest visit. Browsing/scrolling is allowed; actions require login. */
export function installGuestAuthTrigger(doc: Document, open: (mode: "signin" | "signup") => void, delay = 30_000) {
  let triggered = false;
  const reveal = (mode: "signin" | "signup" = "signin") => {
    if (!triggered) { triggered = true; open(mode); }
  };
  const timer = setTimeout(reveal, delay);
  const onAction = (event: Event) => {
    const target = event.target as Element | null;
    if (target?.closest?.("[data-guest-auth-dialog]")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const mode = target?.closest?.("[data-auth-mode]")?.getAttribute("data-auth-mode");
    reveal(mode === "signup" ? "signup" : "signin");
  };
  const onKeyDown = (event: KeyboardEvent) => {
    // Tab and scrolling keys can explore the preview. Typing/activating controls cannot.
    const target = event.target as Element | null;
    if (target?.closest?.("[data-guest-auth-dialog]")) return;
    const control = target?.closest?.("a,button,input,textarea,select,[role=button],[contenteditable=true]");
    if ((target?.matches?.("input,textarea,[contenteditable=true]") && event.key !== "Tab") ||
        (control && (event.key === "Enter" || event.key === " "))) onAction(event);
  };
  const onRequest = () => reveal();
  // Do not capture pointerdown: on touch screens it would block scrolling before a tap.
  doc.addEventListener("click", onAction, true);
  doc.addEventListener("submit", onAction, true);
  doc.addEventListener("keydown", onKeyDown, true);
  doc.addEventListener("guest-auth-required", onRequest);
  return () => {
    clearTimeout(timer);
    doc.removeEventListener("click", onAction, true);
    doc.removeEventListener("submit", onAction, true);
    doc.removeEventListener("keydown", onKeyDown, true);
    doc.removeEventListener("guest-auth-required", onRequest);
  };
}

/** Also usable by shared cards so they cannot navigate/mutate without the layout listener. */
export function requestGuestLogin() {
  document.dispatchEvent(new Event("guest-auth-required"));
}
