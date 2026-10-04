"use client";
import dynamic from "next/dynamic";
import { memo } from "react";
import PostText from "./PostText";

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
  return <PostText content={props.content} disablePadding={props.disablePadding} />;
}
export default memo(ContentEditor);
