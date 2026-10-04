"use client";
import { memo, useMemo } from "react";
import Link from "next/link";
import { tokenizePostText } from "@/utils/post-text";
import styles from "./ContentEditor.module.css";

/** Reading a post must never initialize an editor, plugins, or suggestion searches. */
function PostText({ content = "", disablePadding = false }: {
  content?: string;
  disablePadding?: boolean;
}) {
  const parts = useMemo(() => tokenizePostText(content), [content]);
  return (
    <div className={`${styles.editor} ${disablePadding ? styles.editorNoPadding : ""}`}
      style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
      {parts.map((part, i) => part.href ? (
        part.external ? <a key={i} href={part.href} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: "var(--mui-palette-info-main)", textDecoration: "none" }}>{part.text}</a> :
        <Link key={i} href={part.href} prefetch={false} onClick={e => e.stopPropagation()} style={{ color: "var(--mui-palette-info-main)", textDecoration: "none", fontWeight: "bold" }}>{part.text}</Link>
      ) : <span key={i}>{part.text}</span>)}
    </div>
  );
}
export default memo(PostText);
