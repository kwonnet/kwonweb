import type { KeyboardEvent } from 'react';

// Keep game submission local to the focused input. Do not consume IME commits
// or Shift+Enter newlines, and do not resend while Enter is held down.
export function handleGameInputEnter(event: KeyboardEvent<HTMLDivElement>, send: () => boolean | void) {
  if (event.key !== 'Enter') return;
  event.stopPropagation();
  if (event.shiftKey || event.nativeEvent.isComposing || event.keyCode === 229) return;
  event.preventDefault();
  if (event.repeat) return;
  if (send() === true) {
    const input = event.target as HTMLElement;
    if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') input.blur();
  }
}

export function stopGameInputEnterKeyUp(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key !== 'Enter') return;
  event.stopPropagation();
  if (!event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) event.preventDefault();
}
