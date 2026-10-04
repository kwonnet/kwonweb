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
import type { EditorPlugin } from "@draft-js-plugins/editor";
import { createPortal } from "react-dom";
import { formatNumber } from "@/utils";
import Fuse from "fuse.js";
import { postReferences, extractPostReferences } from "@/utils/post-text";



export interface HashTagItem {
  name: string;
  link?: string;
  count?: number;
  id?: number | string;
  [key: string]: any;
}


export interface HashTagItemProps extends DraftDecoratorComponentProps {
  tag?: HashTagItem;
}

interface CreateHashtagPluginOptions {
  hashtagList: HashTagItem[];
  HashtagComponent?: React.ComponentType<HashTagItemProps>;
  fetchSuggestions?: (keyword: string) => Promise<HashTagItem[]>;
  onTagsChange?: (tags: string[]) => void; // 👈 NEW
}
// Somewhere at the top level in your pluginInstance or component
const fuseOptions = {
  keys: ["name"],
  threshold: 0.3, // Lower means stricter matching
};
//

const extractTagsFromContent = (content: string, tagList: HashTagItem[] ): string[] => {
  const singleTags = extractPostReferences(content).tags;

  const multiWordTags = tagList
    .filter(tag => tag.name.includes(" "))
    .filter(tag => content.includes(tag.name))
    .map(tag => tag.name);

  return Array.from(new Set([...singleTags, ...multiWordTags]));
};

const DefaultHashtagComponent = ({
  decoratedText,
  children,
  tag,
}: DraftDecoratorComponentProps & {
  tag?: HashTagItem;
}): React.ReactElement => {
  const href = tag?.link || `/hashtag/${decoratedText.substring(1)}`;
  return (
    <a href={href} style={{ color: "blue", textDecoration: "underline" }}>
      {children}
    </a>
  );
};

const SuggestionPortal: React.FC<{
  suggestions: HashTagItem[];
  onSelect: (tag?: HashTagItem) => void;
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
      {suggestions.map((tag, i) => (
        <div
          key={tag.id ?? tag.name}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(tag);
          }}
          onMouseEnter={() => setFocusedIndex(i)}
          style={{
            padding: "4px 8px",
            cursor: "pointer",
            backgroundColor:
              i === focusedIndex ? "var(--mui-palette-divider)" : "transparent",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <p>{tag.name?.includes(" ") ? tag.name : `#${tag.name}`}</p>
            <p style={{ fontSize: "0.8em" }}>
              {tag.count ? formatNumber(tag.count) : ""}
            </p>
          </div>
        </div>
      ))}
    </div>,
    document.body
  );
};

const createHashtagPlugin = ({
  hashtagList,
  fetchSuggestions,
  onTagsChange,
  HashtagComponent = DefaultHashtagComponent,
}: CreateHashtagPluginOptions): {
  hashtagPlugin: EditorPlugin;
  HashtagSuggestions: React.FC;
} => {
  const fuse = new Fuse([] as HashTagItem[], fuseOptions);
  let searchVersion = 0;
  const pluginInstance = {
    notify: () => {},
    editorRef: null as any,
    suggestions: [] as HashTagItem[],
    position: null as { top: number; left: number } | null,
    setEditorStateFn: null as ((state: EditorState) => void) | null,
    getEditorStateFn: null as (() => EditorState) | null,
    hashtagList: hashtagList || [],
    fetchSuggestions,
    searchTimer: null as NodeJS.Timeout | null,
    lastKeyword: "",
    onTagsChange
  };

  const hashtagStrategy: DraftDecorator["strategy"] = (
    contentBlock: ContentBlock,
    callback: (start: number, end: number) => void
  ) => {
    const text = contentBlock.getText();

    // Decorate known multi-word tags (like "John Doe")
    pluginInstance.hashtagList.forEach((tagItem) => {
      const { name } = tagItem;

      // Only match multi-word tags without #
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

    for (const ref of postReferences(text)) {
      if (ref.kind === "hashtag") callback(ref.start, ref.end);
    }
  };

  const insertHashtag = (
    editorState: EditorState,
    tagName: string
  ): EditorState => {
    const selection = editorState.getSelection();
    const anchorKey = selection.getAnchorKey();
    const content = editorState.getCurrentContent();
    const block = content.getBlockForKey(anchorKey);
    const text = block.getText().slice(0, selection.getAnchorOffset());

    // Find the last #word (up to the cursor)
    const match = text.match(/#[^\s#]*$/);
    if (!match) return editorState;

    const start = selection.getAnchorOffset() - match[0].length;
    const newSelection = selection.merge({
      anchorOffset: start,
      focusOffset: selection.getAnchorOffset(),
    }) as SelectionState;

    const isMultiWord = tagName.includes(" ");
    const insertText = isMultiWord ? `${tagName} ` : `#${tagName} `;

    const newContent = Modifier.replaceText(content, newSelection, insertText);

    return  EditorState.push(
      editorState,
      newContent,
      "insert-characters"
    );

  };

  const hashtagPlugin: EditorPlugin = {
    decorators: [
      {
        strategy: hashtagStrategy,
        component: (props) => {
          // This will be something like "#John Doe"
          const decoratedText = props.decoratedText.trim();

          // Remove the # only from the start, preserving full text like "John Doe"
          const tagName = decoratedText.startsWith("#")
            ? decoratedText.slice(1)
            : decoratedText;

          // Find the matching tag in the hashtag list (case-insensitive)
          const tag = pluginInstance.hashtagList.find(
            (t) => t.name.toLowerCase() === tagName.toLowerCase()
          );

          // Pass `tag` as prop, may be undefined for new (not in list) tags
          return <HashtagComponent {...props} tag={tag} />;
        },
      },
    ],

    willUnmount: () => {
      searchVersion++;
      if (pluginInstance.searchTimer) clearTimeout(pluginInstance.searchTimer);
      pluginInstance.notify = () => {};
    },

    initialize: ({ getEditorRef, setEditorState, getEditorState }) => {
      pluginInstance.editorRef = getEditorRef();
      pluginInstance.setEditorStateFn = setEditorState;
      pluginInstance.getEditorStateFn = getEditorState;
    },

    onChange: (editorState: EditorState): EditorState => {
      const version = ++searchVersion;
      if (pluginInstance.searchTimer) clearTimeout(pluginInstance.searchTimer);
      pluginInstance.suggestions = [];
      const selection = editorState.getSelection();
      if (!selection.isCollapsed()) return editorState;

      const anchorKey = selection.getAnchorKey();
      const currentContent = editorState.getCurrentContent();
      const currentBlock = currentContent.getBlockForKey(anchorKey);
      const blockText = currentBlock.getText();
      const offset = selection.getAnchorOffset();
      const textUpToCursor = blockText.slice(0, offset);
      const hashtagMatch = textUpToCursor.match(/#[^\s#]*$/);

      if (hashtagMatch && hashtagMatch[0] !== "#") {
        // get keyword
        const keyword = hashtagMatch[0].substring(1).toLowerCase();
        pluginInstance.lastKeyword = keyword;
        // search locally list using fuse.js
        fuse.setCollection(pluginInstance.hashtagList);
        const filteredLocal = fuse.search(keyword).map((result) => result.item);
        if (filteredLocal.length > 0) {
          pluginInstance.suggestions = filteredLocal;
        } else {
            const query = keyword.replace("#", "")
          if (pluginInstance.fetchSuggestions && query.length >= 2 ) {
            if (pluginInstance.searchTimer) {
              clearTimeout(pluginInstance.searchTimer);
            }
            pluginInstance.searchTimer = setTimeout(async () => {
              try {
                const results = await pluginInstance.fetchSuggestions!(query);
                if (version !== searchVersion) return;
                // Merge and deduplicate
                const combined = [...pluginInstance.hashtagList, ...results];
                const uniqueMap = new Map();
                combined.forEach((user) => {
                  if (!uniqueMap.has(user.id ?? user.name)) {
                    uniqueMap.set(user.id ?? user.name, user);
                  }
                });
                const uniqueList: HashTagItem[] = Array.from(
                  uniqueMap.values()
                );

                // Update global mention list
                pluginInstance.hashtagList = uniqueList;

                // Fuse again to filter merged suggestions
                fuse.setCollection(uniqueList);
                pluginInstance.suggestions = fuse
                  .search(pluginInstance.lastKeyword)
                  .map((r) => r.item);
                pluginInstance.notify();
              } catch (err) {
                console.error("Error fetching suggestions:", err);
              }
            }, 300); // debounce
          }
        }
        
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0).cloneRange();
          range.collapse(true);
          const rects = range.getClientRects();
          if (rects.length > 0) {
            const rect = rects[0];
            pluginInstance.position = {
              top: rect.bottom + window.scrollY,
              left: rect.left + window.scrollX,
            };
          }
        }
      } 
      else {
        pluginInstance.suggestions = [];
        pluginInstance.position = null;
      }
      // get tags
      const plainText = editorState.getCurrentContent().getPlainText()
      pluginInstance.onTagsChange?.(extractTagsFromContent(plainText, pluginInstance.hashtagList ?? []));
      // return state
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
            const match = text?.match(/#[^\s#]*$/);
      
            if (match && pluginInstance.suggestions.length > 0) {
              return "insert-space-after-hashtag";
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
        if (command === ("insert-space-after-hashtag" as string)) {
          const selection = editorState.getSelection();
          if (!selection.isCollapsed()) return "not-handled";
      
          const anchorKey = selection.getAnchorKey();
          const content = editorState.getCurrentContent();
          const block = content.getBlockForKey(anchorKey);
          const offset = selection.getAnchorOffset();
          const text = block.getText().slice(0, offset);
          const match = text.match(/#[^\s#]*$/);
      
          if (match && pluginInstance.suggestions.length > 0) {
            // Insert the first suggestion as a hashtag
            const tag = pluginInstance.suggestions[0];
            const newState = insertHashtag(editorState, tag.name);
            pluginFunctions.setEditorState(newState);
            pluginInstance.suggestions = [];
            pluginInstance.position = null;
            return "handled";
          } else {
            // Insert a space if no valid hashtag is found
            const newContent = Modifier.insertText(content, selection, " ");
            const newState = EditorState.push(
              editorState,
              newContent,
              "insert-characters"
            );
            pluginFunctions.setEditorState(newState);
            pluginInstance.suggestions = [];
            pluginInstance.position = null;
            return "handled";
          }
        }
      
        // Allow default behavior for Enter key if no hashtag context exists
        if (command === "split-block") {
          return "not-handled"; // Let Draft.js handle moving to the next line
        }
      
        return "not-handled";
      },
  };
  

  const HashtagSuggestions = () => {
    const [, render] = useState(0);
    useEffect(() => {
      pluginInstance.notify = () => render(value => value + 1);
      return () => { pluginInstance.notify = () => {}; };
    }, []);
    return (
    <SuggestionPortal
      suggestions={pluginInstance.suggestions}
      onSelect={(tag) => {
        if (
          tag &&
          pluginInstance.setEditorStateFn &&
          pluginInstance.getEditorStateFn
        ) {
          pluginInstance.setEditorStateFn(
            insertHashtag(pluginInstance.getEditorStateFn(), tag.name)
          );
        }
        pluginInstance.suggestions = [];
        pluginInstance.position = null;
        pluginInstance.notify();
      }}
      position={pluginInstance.position}
    />
    );
  };

  return {
    hashtagPlugin,
    HashtagSuggestions,
  };
};

export default createHashtagPlugin;
