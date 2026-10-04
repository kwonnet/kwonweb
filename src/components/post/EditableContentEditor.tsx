'use client'
import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { ContentState, EditorState, Modifier } from "draft-js";
import { extractPostReferences } from "@/utils/post-text";
import Editor from "@draft-js-plugins/editor";
import editorStyles from "./ContentEditor.module.css";

// custom hashtag plugin
import customCreateHashtagPlugin, {
  HashTagItemProps,
} from "./hashtag";

// custom mention plugin
import createMentionPlugin, { MentionItemProps } from "./mention";

// linkify plugin
import createLinkifyPlugin from "./linkify";

import dynamic from "next/dynamic";
import type { EmojiClickData } from "emoji-picker-react";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

import Link from "next/link";
import { Box, Typography, IconButton, Popover } from "@mui/material";
import { searchUsers } from "@/lib/users";
import { useAuthSession } from "@/hooks";

const HashtagComponent = (props: HashTagItemProps) => {
  const text = props?.decoratedText?.replace(/^#/, "");
  const href = props?.tag?.link || `/hashtags?tag=${text}`;
  return (
    <Typography
      component={Link}
      onClick={ev => ev.stopPropagation()}
      href={href}
      color="info"
      sx={{
        // color: "#007bff",
        textDecoration: "none",
        fontWeight: "bold",
      }}
    >
      {props.children}
    </Typography>
  );
};

// Custom render for mentions
const MentionComponent = (mentionProps: MentionItemProps) => {
  const href = mentionProps?.mention?.link || `/${mentionProps?.decoratedText}`;
  return (
    <Typography
      component={Link}
      onClick={ev => ev.stopPropagation()}
      href={href}
      color="info"
      sx={{
        // color: "#007bff",
        textDecoration: "none",
        fontWeight: "bold",
      }}
    >
      {mentionProps.children}
    </Typography>
  );
};

const ContentEditor = ({
  onContentChange,
  placeholder,
  readOnly = false,
  disablePadding = false,
  content=""
}: {
  content?: string;
  readOnly?: boolean;
  disablePadding?: boolean;
  placeholder?: string;
  onContentChange?: (args: {
    content: string;
    tags: string[];
    mentions: string[];
  }) => void;
}) => {
  const { token } = useAuthSession();

  const linkifyPlugin = useMemo(() => createLinkifyPlugin(), []);
  // custom hash tag plugin
  const { HashtagSuggestions, hashtagPlugin } = useMemo(() => {
    return customCreateHashtagPlugin({
      hashtagList: [],
      HashtagComponent,
    });
  }, []);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  // custom mention plugin
  const { MentionSuggestions, mentionPlugin } = useMemo(() => {
    return createMentionPlugin({
      mentionList: [],
      MentionComponent,
      fetchSuggestions: async (keyword) => {
        try {
          const users = await searchUsers(
            { query: keyword, page: 1, limit: 50 },
            tokenRef.current
          );
          return users.map((user) => ({ ...user, link: `/@${user.username}` }));
        } catch (error) {
          return [];
        }
      },
    });
  }, []);
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLButtonElement | null>(null);
  const plugins = useMemo(
    () => [mentionPlugin, hashtagPlugin, linkifyPlugin],
    [mentionPlugin, linkifyPlugin, hashtagPlugin]
  );
  const ref = useRef<Editor>(null);
  // Create the immutable Draft state once, not on every keystroke/parent render.
  const [editorState, setEditorState] = useState(() =>
    EditorState.createWithContent(ContentState.createFromText(content))
  );
  const lastText = useRef(content);
  const counter = editorState.getCurrentContent().getPlainText().length;

  const onChange = useCallback((nextState: EditorState) => {
    setEditorState(nextState);
    const text = nextState.getCurrentContent().getPlainText();
    // Focus/caret/plugin updates must not re-render the entire composer/thread list.
    if (text === lastText.current) return;
    lastText.current = text;
    onContentChange?.({ content: text, ...extractPostReferences(text) });
  }, [onContentChange]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      !readOnly && ref.current?.focus();
    }, 500);
    return () => clearTimeout(timeout);
  }, [readOnly]);

  return (
    <div>
      <div
        className={`${editorStyles.editor} ${disablePadding ? editorStyles.editorNoPadding : ""}`}
        // onClick={() => ref.current?.focus()}
        suppressHydrationWarning
      >
        <Editor
          editorState={editorState}
          onChange={onChange}
          plugins={plugins}
          ref={ref}
          placeholder={placeholder || "What's happening?"}
          readOnly={readOnly}
          
        />
        {!readOnly && (
          <>
            <HashtagSuggestions />
            <MentionSuggestions />
          </>
        )}

        {!readOnly && (
          <Box sx={{ position: "relative" }}>
            <Box
              sx={{ position: "absolute", right: -12, top: 2, fontSize: 10 }}
            >
              {counter > 0 && (
                <Typography
                  variant="caption"
                  color={counter > 500 ? "error" : "textDisabled"}
                >
                  {counter}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </div>
      {!readOnly && (
        <Box sx={{ position: "relative" }}>
          <Box
            className="emoji-select-btn"
            sx={{
              position: "absolute !important",
              right: 30,
              top: -17,
              fontSize: 10,
            }}
          >
            <IconButton size="small" aria-label="Choose emoji" onMouseDown={event => event.preventDefault()} onClick={event => setEmojiAnchor(event.currentTarget)}><EmojiEmotionsOutlinedIcon fontSize="small" /></IconButton>
            <Popover open={Boolean(emojiAnchor)} anchorEl={emojiAnchor} onClose={() => setEmojiAnchor(null)} disableRestoreFocus anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
              {emojiAnchor && <EmojiPicker onEmojiClick={(data: EmojiClickData) => {
                const updated = Modifier.replaceText(editorState.getCurrentContent(), editorState.getSelection(), data.emoji, editorState.getCurrentInlineStyle());
                const next = EditorState.push(editorState, updated, "insert-characters");
                onChange(EditorState.forceSelection(next, updated.getSelectionAfter()));
                setEmojiAnchor(null);
                // forceSelection restores the caret after React commits this state.
                // Focusing synchronously makes Draft emit the previous state again.
              }} />}
            </Popover>
          </Box>
        </Box>
      )}
    </div>
  );
};

export default ContentEditor
