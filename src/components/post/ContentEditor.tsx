'use client'
import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  memo,
} from "react";
import { convertFromRaw, EditorState } from "draft-js";
import Editor from "@draft-js-plugins/editor";
import editorStyles from "./ContentEditor.module.css";

// custom hashtag plugin
import customCreateHashtagPlugin, {
  HashTagItem,
  HashTagItemProps,
} from "./hashtag";

// custom mention plugin
import createMentionPlugin, { MentionItem, MentionItemProps } from "./mention";

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
    <Link
      href={href}
      style={{
        color: "#007bff",
        textDecoration: "none",
        fontWeight: "bold",
      }}
    >
      {props.children}
    </Link>
  );
};

// Custom render for mentions
const MentionComponent = (mentionProps: MentionItemProps) => {
  const href = mentionProps?.mention?.link || `/${mentionProps?.decoratedText}`;
  return (
    <Link
      href={href}
      style={{
        color: "#007bff",
        textDecoration: "none",
        fontWeight: "bold",
      }}
    >
      {mentionProps.children}
    </Link>
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

  const tagRef = useRef<string[]>([]);
  const mentionRef = useRef<string[]>([]);

  const [state, setState] = useState<{
    counter: number;
    limit: number;
    tags: string[];
    mentions: string[];
  }>({ counter: 0, limit: 500, tags: [], mentions: [] });

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
      fetchSuggestions: async (keyword) => {
        // const res = await fetch(`/api/search-users?q=${encodeURIComponent(keyword)}`);
        // const data = await res.json();
        // return data.users; // assuming API returns users with `name`, `username`, `avatar`, etc.
        return [];
      },
      onTagsChange(tags) {
        tagRef.current = tags;
      },
    });
  }, []);
  // custom mention plugin
  const { MentionSuggestions, mentionPlugin } = useMemo(() => {
    return createMentionPlugin({
      mentionList: [],
      MentionComponent,
      fetchSuggestions: async (keyword) => {
        try {
          const users = await searchUsers(
            { query: keyword, page: 1, limit: 50 },
            token
          );
          return users.map((user) => ({ ...user, link: `/@${user.username}` }));
        } catch (error) {
          return [];
        }
      },
      onMentionsChange(mentions) {
        mentionRef.current = mentions;
      },
    });
    // eslint-disable-next-line
  }, []);
  // emoji plugin
  const emojiPlugin = useMemo(
    () => createEmojiPlugin({ useNativeArt: true }),
    // eslint-disable-next-line
    []
  );
  const { EmojiSuggestions, EmojiSelect } = emojiPlugin;
  // declare the plugins
  const plugins = useMemo(
    // eslint-disable-next-line
    () => [mentionPlugin, hashtagPlugin, linkifyPlugin, emojiPlugin],
    [mentionPlugin, linkifyPlugin, hashtagPlugin, emojiPlugin]
  );
  const ref = useRef<Editor>(null);
  // const [editorState, setEditorState] = useState(
  //   content ? createEditorStateWithText(content) : EditorState.createEmpty()
  // );
    // const [editorState, setEditorState] = useState(createEditorStateWithText(content));


  const _editorState = EditorState.createWithContent(convertFromRaw({
    entityMap: {},
    blocks: [
      {
        text: content,
        key: 'foo',
        type: 'unstyled',
        entityRanges: [],
        depth: 0,
        inlineStyleRanges: [],
      },
    ],
  }));


const [editorState, setEditorState] = useState(_editorState);



  const onChange = useCallback((_editorState: EditorState) => {
    const textContent = _editorState.getCurrentContent().getPlainText();
    onContentChange &&
      onContentChange({
        content: textContent,
        tags: tagRef.current,
        mentions: mentionRef.current,
      });
    // onTagsChange(getCurrentTags())
    setState((prev) => ({ ...prev, counter: textContent.length }));
    setEditorState(_editorState);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    // setEditorState(() => createEditorStateWithText(content))
    setTimeout(() => {
      !readOnly && ref.current?.focus();
    }, 500);
    return () => {};
  }, [ref]);

  return (
    <div>
      <div
        className={`${editorStyles.editor} ${disablePadding ? editorStyles.editorNoPadding : ""}`}
        // onClick={() => ref.current?.focus()}
        suppressHydrationWarning
      >
        <Editor
          editorState={editorState}
          onChange={(ev) => onChange(ev)}
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
              {state.counter > 0 && (
                <Typography
                  variant="caption"
                  color={state.counter > state.limit ? "error" : "textDisabled"}
                >
                  {state.counter}
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
