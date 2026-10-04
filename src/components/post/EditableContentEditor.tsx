'use client'
import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { ContentState, EditorState } from "draft-js";
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
import createLinkifyPlugin from "@draft-js-plugins/linkify";
import "@draft-js-plugins/linkify/lib/plugin.css";
import linkifyStyles from "./Linkify.module.css";

// emoji plugin
import createEmojiPlugin from "@draft-js-plugins/emoji";
import "@draft-js-plugins/emoji/lib/plugin.css";

import Link from "next/link";
import { Box, Typography } from "@mui/material";
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

  const linkifyPlugin = useMemo(
    () =>
      createLinkifyPlugin({
        theme: {
          ...linkifyStyles,
          link: linkifyStyles.link,
        },
      }),
    []
  );
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
  // emoji plugin
  const emojiPlugin = useMemo(
    () => createEmojiPlugin({ useNativeArt: true }),
    []
  );
  const { EmojiSuggestions, EmojiSelect } = emojiPlugin;
  // declare the plugins
  const plugins = useMemo(
    () => [mentionPlugin, hashtagPlugin, linkifyPlugin, emojiPlugin],
    [mentionPlugin, linkifyPlugin, hashtagPlugin, emojiPlugin]
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
            <EmojiSuggestions />
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
            <EmojiSelect closeOnEmojiSelect={true} />
          </Box>
        </Box>
      )}
    </div>
  );
};

export default ContentEditor
