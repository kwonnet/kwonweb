"use client";
import dynamic from "next/dynamic";
import { memo } from "react";
import Link from "next/link";
import { tokenizePostText } from "@/utils/post-text";
import styles from "./ContentEditor.module.css";

const EditableContentEditor = dynamic(() => import("./EditableContentEditor"), {
  ssr: false,
  loading: () => <div style={{ minHeight: 100 }} role="status">Loading editor…</div>,
});

type Props = {
  content?: string;
  readOnly?: boolean;
  disablePadding?: boolean;
  placeholder?: string;
  onContentChange?: (args: { content: string; tags: string[]; mentions: string[] }) => void;
};

function ContentEditor(props: Props) {
  if (!props.readOnly) return <EditableContentEditor {...props} />;
  return (
    <div className={`${styles.editor} ${props.disablePadding ? styles.editorNoPadding : ""}`}
      style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
      {tokenizePostText(props.content ?? "").map((part, i) => part.href ? (
        part.external ? <a key={i} href={part.href} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: "var(--mui-palette-info-main)", textDecoration: "none" }}>{part.text}</a> :
        <Link key={i} href={part.href} prefetch={false} onClick={e => e.stopPropagation()} style={{ color: "var(--mui-palette-info-main)", textDecoration: "none", fontWeight: "bold" }}>{part.text}</Link>
      ) : <span key={i}>{part.text}</span>)}
    </div>
  );
}
export default memo(ContentEditor);
