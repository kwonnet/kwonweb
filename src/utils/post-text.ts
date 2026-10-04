export type TextPart = { text: string; href?: string; external?: boolean };

/** Plain text only; React escapes content and only HTTP(S) URLs become links. */
export function tokenizePostText(content: string): TextPart[] {
  const parts: TextPart[] = [];
  const pattern = /https?:\/\/[^\s<>]+|www\.[^\s<>]+|(?<![\p{L}\p{N}_])[@#][\p{L}\p{N}_]+/gu;
  let offset = 0;
  for (const match of content.matchAll(pattern)) {
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
