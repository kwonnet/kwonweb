export type TextPart = { text: string; href?: string; external?: boolean };

// URLs come first so their path/query/fragment cannot become mentions or hashtags.
// Keep dots/hyphens inside usernames, while leaving sentence punctuation alone.
function textPattern() {
  return /https?:\/\/[^\s<>]+|www\.[^\s<>]+|(?<![\p{L}\p{M}\p{N}_.@#-])(?:@[\p{L}\p{N}_][\p{L}\p{M}\p{N}_]*(?:[.-][\p{L}\p{M}\p{N}_]+)*|#[\p{L}\p{N}_][\p{L}\p{M}\p{N}_]*)/gu;
}

export function postReferences(content: string) {
  return [...content.matchAll(textPattern())].flatMap(match => {
    const text = match[0];
    if (text[0] !== "@" && text[0] !== "#") return [];
    return [{ text, value: text.slice(1), start: match.index!, end: match.index! + text.length,
      kind: text[0] === "@" ? "mention" as const : "hashtag" as const }];
  });
}

/** The editor and reader agree on references, including after deleting all text. */
export function extractPostReferences(content: string) {
  const references = postReferences(content);
  return {
    mentions: [...new Set(references.filter(ref => ref.kind === "mention").map(ref => ref.value))],
    tags: [...new Set(references.filter(ref => ref.kind === "hashtag").map(ref => ref.value))],
  };
}

/** Plain text only; React escapes content and only HTTP(S) URLs become links. */
export function tokenizePostText(content: string): TextPart[] {
  const parts: TextPart[] = [];
  let offset = 0;
  for (const match of content.matchAll(textPattern())) {
    const index = match.index!;
    if (index > offset) parts.push({ text: content.slice(offset, index) });
    const raw = match[0];
    if (raw[0] === "@" || raw[0] === "#") {
      const value = encodeURIComponent(raw.slice(1));
      parts.push({ text: raw, href: raw[0] === "@" ? `/@${value}` : `/hashtags?tag=${value}` });
    } else {
      const text = raw.replace(/[.,!?;:)\]}]+$/, "");
      parts.push({ text, href: text.startsWith("www.") ? `https://${text}` : text, external: true });
      if (text.length < raw.length) parts.push({ text: raw.slice(text.length) });
    }
    offset = index + raw.length;
  }
  if (offset < content.length) parts.push({ text: content.slice(offset) });
  return parts;
}
