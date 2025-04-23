"use client";
import React, { useState, useEffect } from "react";
import {
  EditorState,
  Modifier,
  ContentBlock,
  DraftDecorator,
  DraftDecoratorComponentProps,
  getDefaultKeyBinding,
  DraftEditorCommand,
  SelectionState,
} from "draft-js";
import { EditorPlugin } from "@draft-js-plugins/editor";
import { createPortal } from "react-dom";
import { Avatar, Stack, Typography } from "@mui/material";
import Fuse from "fuse.js";

export interface MentionItem {
  name: string;
  link: string;
  avatar: string;
  username: string;
  [key: string]: any;
}

export interface MentionItemProps extends DraftDecoratorComponentProps {
  mention?: MentionItem;
}
// Somewhere at the top level in your pluginInstance or component
const fuseOptions = {
  keys: ["name", "username"],
  threshold: 0.3, // Lower means stricter matching
};
// 
const fuse = new Fuse([] as MentionItem[] , fuseOptions);

const randomId = (length: number = 8): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};


interface CreateMentionPluginOptions {
  mentionList: MentionItem[];
  MentionComponent?: React.ComponentType<MentionItemProps>;
  fetchSuggestions?: (keyword: string) => Promise<MentionItem[]>;
  onMentionsChange?: (mentions: string[]) => void; // 👈 NEW
}

const DefaultMentionComponent = ({
  children,
  mention,
}: MentionItemProps): React.ReactElement => {
  const href = mention?.link || `/@${mention?.username}`;
  return (
    <a href={href} style={{ color: "blue", textDecoration: "underline" }}>
      {children}
    </a>
  );
};

const SuggestionPortal: React.FC<{
  suggestions: MentionItem[];
  onSelect: (item?: MentionItem) => void;
  position: { top: number; left: number } | null;
}> = ({ suggestions, onSelect, position }) => {
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    setFocusedIndex(0);
  }, [suggestions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (suggestions.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex(
          (prev) => (prev - 1 + suggestions.length) % suggestions.length
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        onSelect(suggestions[focusedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onSelect();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [suggestions, focusedIndex, onSelect]);

  if (!position || suggestions.length === 0) return null;

  return createPortal(
    <div
      id="mention-portal"
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        background: "var(--mui-palette-background-paper)",
        zIndex: 99999999,
        borderRadius: "4px",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.15)",
        padding: "4px",
        minWidth: 150,
        maxHeight: 200,
        overflowY: "auto",
      }}
    >
      {suggestions.map((item, i) => (
        <div
          key={item?.id ? item.id : randomId()}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item);
          }}
          onMouseEnter={() => setFocusedIndex(i)}
          style={{
            padding: "4px 8px",
            cursor: "pointer",
            backgroundColor:
              i === focusedIndex ? "var(--mui-palette-divider)" : "transparent",
          }}
        >
          <React.Fragment>
            <Stack direction={"row"} alignItems={"center"}>
              <Avatar
                src={item.avatar}
                alt={item.name}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  marginRight: 10,
                }}
              />
              <div>
                <Typography style={{ fontWeight: "bold", fontSize: "12px" }}>
                  {item.name}
                </Typography>
                <Typography style={{ fontSize: "10px", color: "gray" }}>
                  @{item.username}
                </Typography>
              </div>
            </Stack>
          </React.Fragment>
        </div>
      ))}
    </div>,
    document.body
  );
};

const createMentionPlugin = ({
  mentionList,
  fetchSuggestions,
  onMentionsChange,
  MentionComponent = DefaultMentionComponent,
}: CreateMentionPluginOptions) => {
  const pluginInstance = {
    editorRef: null as any,
    suggestions: [] as MentionItem[],
    position: null as { top: number; left: number } | null,
    setEditorStateFn: null as ((state: EditorState) => void) | null,
    getEditorStateFn: null as (() => EditorState) | null,
    mentionList: mentionList || [],
    fetchSuggestions,
    searchTimer: null as NodeJS.Timeout | null,
    lastKeyword: "",
    onMentionsChange
  };

  const mentionStrategy: DraftDecorator["strategy"] = (
    contentBlock: ContentBlock,
    callback: (start: number, end: number) => void
  ) => {
    const text = contentBlock.getText();

    // Decorate known multi-word tags (like "John Doe")
    pluginInstance.mentionList.forEach((tagItem) => {
      const { name } = tagItem;

      // Only match multi-word tags without @
      if (name.includes(" ")) {
        let index = 0;
        while ((index = text.indexOf(name, index)) !== -1) {
          const before = index === 0 ? " " : text[index - 1];
          const after = text[index + name.length] || " ";

          // Make sure it's a full word and not part of another word
          const isWholeWord = /\s/.test(before) && /\s/.test(after);

          if (isWholeWord) {
            callback(index, index + name.length);
          }

          index += name.length;
        }
      }
    });

    // Match single-word mentions like @javascript or @beautiful
    const regex = /@(\w+)/g;
    let matchArr;
    while ((matchArr = regex.exec(text)) !== null) {
      callback(matchArr.index, matchArr.index + matchArr[0].length);
    }
  };

  const insertMention = (
    editorState: EditorState,
    mention: MentionItem
  ): EditorState => {
    const selection = editorState.getSelection();
    const anchorKey = selection.getAnchorKey();
    const content = editorState.getCurrentContent();
    const block = content.getBlockForKey(anchorKey);
    const text = block.getText().slice(0, selection.getAnchorOffset());

    // Match last @word (or @multi word)
    const match = text.match(/@[^\s@]*$/);
    if (!match) return editorState;

    const start = selection.getAnchorOffset() - match[0].length;
    const newSelection = selection.merge({
      anchorOffset: start,
      focusOffset: selection.getAnchorOffset(),
    }) as SelectionState;

    const insertText = `@${mention.username} `;

    const newContent = Modifier.replaceText(content, newSelection, insertText);
    return EditorState.push(editorState, newContent, "insert-characters");
  };

  const mentionPlugin: EditorPlugin = {
    decorators: [
      {
        strategy: mentionStrategy,
        component: (props) => {
          console.log("component strategy", props);
          // This will be something like "@John Doe"
          const decoratedText = props.decoratedText.trim();

          const username = decoratedText.replace(/^@/, "");

          const item = pluginInstance.mentionList.find(
            (t) => t.username.toLowerCase() === username.toLowerCase()
          );
          // Pass `item` as prop, may be undefined for new (not in list) tags
          return <MentionComponent {...props} mention={item} />;
        },
      },
    ],

    initialize: ({ getEditorRef, setEditorState, getEditorState }) => {
      pluginInstance.editorRef = getEditorRef();
      pluginInstance.setEditorStateFn = setEditorState;
      pluginInstance.getEditorStateFn = getEditorState;
    },

    onChange: (editorState: EditorState) => {
      const selection = editorState.getSelection();
      const anchorKey = selection.getAnchorKey();
      const contentState = editorState.getCurrentContent();
      const block = contentState.getBlockForKey(anchorKey);
      const text = block.getText();
      const offset = selection.getAnchorOffset();
      const textUntilCursor = text.slice(0, offset);

      const mentionMatch = textUntilCursor.match(/(?:^|\s)@([a-zA-Z0-9_]+)$/);

      if (mentionMatch) {
        const keyword = mentionMatch[1].toLowerCase();

        pluginInstance.lastKeyword = keyword;

        // search locally list using fuse.js
        fuse.setCollection(pluginInstance.mentionList)
        const filteredLocal = fuse.search(keyword).map((result) => result.item);
        console.log("filteredLocal mentions ", filteredLocal);
        if (filteredLocal.length > 0) {
          pluginInstance.suggestions = filteredLocal;
        } else {
          if (pluginInstance.fetchSuggestions) {
            if (pluginInstance.searchTimer) {
              clearTimeout(pluginInstance.searchTimer);
            }

            pluginInstance.searchTimer = setTimeout(async () => {
              try {
                const results = await pluginInstance.fetchSuggestions!(keyword);
                // Merge and deduplicate
                const combined = [...pluginInstance.mentionList, ...results];
                const uniqueMap = new Map();
                combined.forEach((user) => {
                  if (!uniqueMap.has(user.id)) {
                    uniqueMap.set(user.id, user);
                  }
                });
                const uniqueList: MentionItem[] = Array.from(
                  uniqueMap.values()
                );

                // Update global mention list
                pluginInstance.mentionList = uniqueList;

                // Fuse again to filter merged suggestions
                fuse.setCollection(uniqueList)
                pluginInstance.suggestions = fuse
                  .search(pluginInstance.lastKeyword)
                  .map((r) => r.item);
              } catch (err) {
                console.error("Error fetching suggestions:", err);
              }
            }, 300); // debounce
          }
        }
        // Positioning
        const selection = window?.getSelection();
        const selectionRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        if (selectionRange) {
          const rect = selectionRange.getBoundingClientRect();
          if (
            rect.top !== 0 ||
            rect.left !== 0 ||
            rect.width !== 0 ||
            rect.height !== 0
          ) {
            pluginInstance.position = {
              top: rect.bottom + window.scrollY,
              left: rect.left + window.scrollX,
            };
          } else {
            const editorElement =
              pluginInstance.editorRef?.editor?.editorContainer;
            if (editorElement) {
              const editorRect = editorElement.getBoundingClientRect();
              pluginInstance.position = {
                top: editorRect.top + window.scrollY + 20,
                left: editorRect.left + window.scrollX + 10,
              };
            }
          }
        }
      } else {
        pluginInstance.suggestions = [];
        pluginInstance.position = null;
      }

      // get tags
      const plainText = editorState.getCurrentContent().getPlainText()
      if(plainText.length > 0){
        const extract =  [...plainText.matchAll(/@(\w+)/g)].map((m) => m[1]);
        const mentions = Array.from(new Set(extract))
        pluginInstance.onMentionsChange && pluginInstance.onMentionsChange(mentions);
      }

      return editorState;
    },

    keyBindingFn: (e: React.KeyboardEvent): string | null => {
      if (e.key === "Enter") {
        const selection = pluginInstance.getEditorStateFn?.()?.getSelection();
        if (selection && selection.isCollapsed()) {
          const editorState = pluginInstance.getEditorStateFn?.();
          const anchorKey = selection.getAnchorKey();
          const content = editorState?.getCurrentContent();
          const block = content?.getBlockForKey(anchorKey);
          const offset = selection.getAnchorOffset();
          const text = block?.getText().slice(0, offset);
          const match = text?.match(/@([a-zA-Z0-9_]+)$/);
    
          if (match && pluginInstance.suggestions.length > 0) {
            return "insert-mention";
          }
        }
      }
      return getDefaultKeyBinding(e); // Allow default behavior for other cases
    },

    handleKeyCommand: (
      command: DraftEditorCommand,
      editorState: EditorState,
      _eventTimeStamp: number,
      pluginFunctions: { setEditorState: (state: EditorState) => void }
    ): "handled" | "not-handled" => {
      if (command === ("insert-mention" as string)) {
        const selection = editorState.getSelection();
        if (!selection.isCollapsed()) return "not-handled";
    
        const anchorKey = selection.getAnchorKey();
        const content = editorState.getCurrentContent();
        const block = content.getBlockForKey(anchorKey);
        const offset = selection.getAnchorOffset();
        const text = block.getText().slice(0, offset);
        const match = text.match(/@([a-zA-Z0-9_]+)$/);
    
        if (match && pluginInstance.suggestions.length > 0) {
          // Insert the first suggestion as a mention
          const item = pluginInstance.suggestions[0];
          const newState = insertMention(editorState, item);
          pluginFunctions.setEditorState(newState);
          pluginInstance.suggestions = [];
          pluginInstance.position = null;
          return "handled";
        }
      }
    
      // Allow default behavior for Enter key if no mention context exists
      if (command === "split-block") {
        return "not-handled"; // Let Draft.js handle moving to the next line
      }
    
      return "not-handled";
    },

  };
  

  const MentionSuggestions = () => (
    <SuggestionPortal
      suggestions={pluginInstance.suggestions}
      onSelect={(item) => {
        if (
          item &&
          pluginInstance.setEditorStateFn &&
          pluginInstance.getEditorStateFn
        ) {
          pluginInstance.setEditorStateFn(
            insertMention(pluginInstance.getEditorStateFn(), item)
          );
          pluginInstance.suggestions = [];
          pluginInstance.position = null;
        }
      }}
      position={pluginInstance.position}
    />
  );

  return {
    mentionPlugin,
    MentionSuggestions,
  };
};

export default createMentionPlugin;

// onChange: (editorState: EditorState) => {
//   const selection = editorState.getSelection();
//   const anchorKey = selection.getAnchorKey();
//   const contentState = editorState.getCurrentContent();
//   const block = contentState.getBlockForKey(anchorKey);
//   const text = block.getText();
//   const offset = selection.getAnchorOffset();
//   const textUntilCursor = text.slice(0, offset);

//   const mentionMatch = textUntilCursor.match(/@([a-zA-Z0-9_ ]*)$/);
//   if (mentionMatch) {
//     const keyword = mentionMatch[1].toLowerCase();

//     pluginInstance.lastKeyword = keyword;

//     if (pluginInstance.fetchSuggestions) {
//       if (pluginInstance.searchTimer) {
//         clearTimeout(pluginInstance.searchTimer);
//       }

//       pluginInstance.searchTimer = setTimeout(async () => {
//         const results = await pluginInstance.fetchSuggestions!(keyword);
//         pluginInstance.suggestions = results;

//         const selectionRange = window.getSelection()?.getRangeAt(0);
//         if (selectionRange) {
//           const rect = selectionRange.getBoundingClientRect();
//           pluginInstance.position = {
//             top: rect.bottom + window.scrollY,
//             left: rect.left + window.scrollX,
//           };
//         }

//         // Force re-render
//         if (
//           pluginInstance.setEditorStateFn &&
//           pluginInstance.getEditorStateFn
//         ) {
//           pluginInstance.setEditorStateFn(
//             EditorState.set(pluginInstance.getEditorStateFn(), {
//               ...editorState,
//               nativelyRenderedContent: false,
//             })
//           );
//         }
//       }, 300); // debounce for 300ms
//     } else {
//       // fallback to local filtering
//       pluginInstance.suggestions = pluginInstance.mentionList.filter(
//         (user) =>
//           user.name.toLowerCase().includes(keyword) ||
//           user.username.toLowerCase().includes(keyword)
//       );
//     }
//   } else {
//     pluginInstance.suggestions = [];
//     pluginInstance.position = null;
//   }

//   return editorState;
// },
