"use client";
import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { EditorState } from "draft-js";
import Editor, { createEditorStateWithText } from "@draft-js-plugins/editor";
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

const mentions: MentionItem[] = [
  {
    id: "1",
    name: "Matthew Russell",
    link: "/@mrussell247",
    avatar:
      "https://pbs.twimg.com/profile_images/517863945/mattsailing_400x400.jpg",
    username: "matthew_russell",
  },
  {
    id: "2",
    name: "Julian Krispel-Samsel",
    link: "/@juliandoesstuff",
    avatar: "https://avatars2.githubusercontent.com/u/1188186?v=3&s=400",
    username: "julian_krispel",
  },
  {
    id: "3",
    name: "Jyoti Puri",
    link: "/@jyopur",
    avatar: "https://avatars0.githubusercontent.com/u/2182307?v=3&s=400",
    username: "jyoti_puri",
  },
  {
    id: "4",
    name: "Max Stoiber",
    link: "/@mxstbr",
    avatar: "https://avatars0.githubusercontent.com/u/7525670?s=200&v=4",
    username: "max_stoiber",
  },
  {
    id: "5",
    name: "Nik Graf",
    link: "/@nikgraf",
    avatar: "https://avatars0.githubusercontent.com/u/223045?v=3&s=400",
    username: "nik_graf",
  },
  {
    id: "6",
    name: "Pascal Brandt",
    link: "/@psbrandt",
    avatar:
      "https://pbs.twimg.com/profile_images/688487813025640448/E6O6I011_400x400.png",
    username: "pascal_brandt",
  },
];

const apiMentions: MentionItem[] = [
  {
    id: "7",
    name: "Alice Johnson",
    link: "/@alicej",
    avatar:
      "https://pbs.twimg.com/profile_images/517863945/mattsailing_400x400.jpg",
    username: "alice_j",
  },
  {
    id: "8",
    name: "Bob Smith",
    link: "/@bobsmith",
    avatar: "https://avatars2.githubusercontent.com/u/1188186?v=3&s=400",
    username: "bob_smith",
  },
  {
    id: "9",
    name: "Catherine Lee",
    link: "/@catherinelee",
    avatar: "https://avatars0.githubusercontent.com/u/2182307?v=3&s=400",
    username: "catherine_lee",
  },
  {
    id: "10",
    name: "David Brown",
    link: "/@davidb",
    avatar: "https://avatars0.githubusercontent.com/u/7525670?s=200&v=4",
    username: "david_b",
  },
  {
    id: "11",
    name: "Emma Wilson",
    link: "/@emmawilson",
    avatar: "https://avatars0.githubusercontent.com/u/223045?v=3&s=400",
    username: "emma_wilson",
  },
  {
    id: "12",
    name: "Frank Taylor",
    link: "/@frankt",
    avatar:
      "https://pbs.twimg.com/profile_images/688487813025640448/E6O6I011_400x400.png",
    username: "frank_t",
  },
];

const hashTags: HashTagItem[] = [
  {
    id: "1",
    name: "code",
    link: "/hashtags?tag=code",
    count: Math.floor(Math.random() * 1000000),
  },
  {
    id: "2",
    name: "javascript",
    link: "/hashtags?tag=javascript",
    count: Math.floor(Math.random() * 10009),
  },
  {
    id: "3",
    name: "typescript",
    link: "/hashtags?tag=typescript",
    count: Math.floor(Math.random() * 90),
  },
  {
    id: "4",
    name: "John Doe",
    link: "/hashtags?tag=John Doe",
    count: Math.floor(Math.random() * 10090),
  },
  {
    id: "5",
    name: "aprilfool",
    link: "/hashtags?tag=aprilfool",
    count: Math.floor(Math.random() * 10300),
  },
];

const apiHashtags = [
  {
    id: "6",
    name: "comedy",
    link: "/hashtags?tag=comedy",
    count: Math.floor(Math.random() * 10100),
  },
  {
    id: "7",
    name: "Chris Won",
    link: "/hashtags?tag=Chris Won",
    count: Math.floor(Math.random() * 10090),
  },
  {
    id: "8",
    name: "funny",
    link: "/hashtags?tag=funny",
    count: Math.floor(Math.random() * 10100),
  },
  {
    id: "9",
    name: "Blessing Fletcher",
    link: "/hashtags?tag=Blessing Fletcher",
    count: Math.floor(Math.random() * 10090),
  },
  {
    id: "10",
    name: "fastapi",
    link: "/hashtags?tag=fastapi",
    count: Math.floor(Math.random() * 10100),
  },
  {
    id: "11",
    name: "python",
    link: "/hashtags?tag=python",
    count: Math.floor(Math.random() * 10100),
  },
];

const ContentEditor = ({
  onContentChange,
  content,
  placeholder,
  readOnly = false,
  disablePadding = false
}: {
  content?: string;
  readOnly?: boolean;
  disablePadding?: boolean
  placeholder?: string
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
  const [editorState, setEditorState] = useState(
    content ? createEditorStateWithText(content) : EditorState.createEmpty()
  );

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
  }, []);

  useEffect(() => {
    setTimeout(() => {
      ref.current?.focus();
    }, 500);
    return () => {};
  }, [ref]);

  return (
    <div>
      <div
        className={`${editorStyles.editor} ${disablePadding ? editorStyles.editorNoPadding : ''}`}
        onClick={() => ref.current?.focus()}
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

export default ContentEditor;
