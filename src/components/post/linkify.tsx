import type { DraftDecorator, ContentBlock } from "draft-js";
import { tokenizePostText } from "@/utils/post-text";
import type { ReactNode } from "react";

// Share the safe URL tokenizer with the read-only post renderer. No HTML parsing
// or legacy linkify-it dependency is needed to decorate composer links.
export function linkStrategy(block: ContentBlock, callback: (start: number, end: number) => void) {
  let offset = 0;
  for (const token of tokenizePostText(block.getText())) {
    if (token.href && token.external) callback(offset, offset + token.text.length);
    offset += token.text.length;
  }
}

function ComposerLink({ decoratedText, children }: { decoratedText: string; children: ReactNode }) {
  const href = tokenizePostText(decoratedText).find(part => part.external)?.href;
  return <a href={href} target="_blank" rel="noopener noreferrer" onClick={event => event.stopPropagation()} style={{ color: "var(--mui-palette-info-main)", textDecoration: "none" }}>{children}</a>;
}

export default function createLinkifyPlugin(): { decorators: DraftDecorator[] } {
  return { decorators: [{ strategy: linkStrategy, component: ComposerLink }] };
}
