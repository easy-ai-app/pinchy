"use client";

import { useState, useEffect, useRef, useCallback, type FC } from "react";
import { useComposerRuntime } from "@assistant-ui/react";
import {
  SparklesIcon,
  LanguagesIcon,
  BookOpenIcon,
  ZapIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AutocompleteItem {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  icon: React.ReactNode;
  type: "builtin" | "skill";
}

const BUILTIN_ACTIONS: AutocompleteItem[] = [
  {
    id: "summarize",
    name: "Summarize",
    description: "Summarize the conversation",
    prompt: "Please summarize the above conversation.",
    icon: <SparklesIcon className="size-4" />,
    type: "builtin",
  },
  {
    id: "translate",
    name: "Translate",
    description: "Translate to another language",
    prompt: "Please translate the above to: ",
    icon: <LanguagesIcon className="size-4" />,
    type: "builtin",
  },
  {
    id: "explain",
    name: "Explain",
    description: "Explain in simple terms",
    prompt: "Please explain the above in simple terms.",
    icon: <BookOpenIcon className="size-4" />,
    type: "builtin",
  },
];

export const ComposerAutocomplete: FC = () => {
  const composerRuntime = useComposerRuntime();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [items, setItems] = useState<AutocompleteItem[]>(BUILTIN_ACTIONS);
  const [skills, setSkills] = useState<AutocompleteItem[]>([]);
  const popupRef = useRef<HTMLDivElement>(null);

  // Fetch skills once
  useEffect(() => {
    fetch("/api/skills")
      .then((res) => (res.ok ? res.json() : []))
      .then(
        (
          data: {
            id: string;
            name: string;
            description?: string;
            prompt: string;
          }[],
        ) => {
          setSkills(
            data.map((s) => ({
              id: s.id,
              name: s.name,
              description: s.description,
              prompt: s.prompt,
              icon: <ZapIcon className="size-4" />,
              type: "skill" as const,
            })),
          );
        },
      )
      .catch(() => {});
  }, []);

  // Filter items based on query
  useEffect(() => {
    const allItems = [...skills, ...BUILTIN_ACTIONS];
    if (!query) {
      setItems(allItems);
    } else {
      const lower = query.toLowerCase();
      setItems(
        allItems.filter((item) => item.name.toLowerCase().includes(lower)),
      );
    }
    setSelectedIndex(0);
  }, [query, skills]);

  // Listen to composer text changes to detect "/" trigger
  useEffect(() => {
    const unsubscribe = composerRuntime.subscribe(() => {
      const state = composerRuntime.getState();
      const text = state.text;

      // Check if text starts with "/" or has " /" pattern
      const slashMatch = text.match(/(?:^|\s)\/([\w]*)$/);
      if (slashMatch) {
        setQuery(slashMatch[1]);
        setIsOpen(true);
      } else {
        setIsOpen(false);
        setQuery("");
      }
    });
    return unsubscribe;
  }, [composerRuntime]);

  const selectItem = useCallback(
    (item: AutocompleteItem) => {
      const state = composerRuntime.getState();
      const text = state.text;
      // Replace the /command with the prompt
      const newText = text.replace(/(?:^|\s)\/[\w]*$/, "").trim();
      const finalText = newText ? `${newText}\n${item.prompt}` : item.prompt;
      composerRuntime.setText(finalText);
      setIsOpen(false);
      setQuery("");
    },
    [composerRuntime],
  );

  // Handle keyboard navigation — attach to the composer textarea
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && items.length > 0) {
        e.preventDefault();
        selectItem(items[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    // Find the textarea in the composer
    const textarea = document.querySelector(
      ".aui-composer-input",
    ) as HTMLTextAreaElement;
    if (textarea) {
      textarea.addEventListener("keydown", handleKeyDown);
      return () => textarea.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, items, selectedIndex, selectItem]);

  // Scroll selected item into view
  useEffect(() => {
    if (popupRef.current) {
      const selected = popupRef.current.querySelector(
        "[data-selected=true]",
      );
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen || items.length === 0) return null;

  return (
    <div
      ref={popupRef}
      className="absolute bottom-full left-0 z-50 mb-2 w-64 max-h-60 overflow-y-auto rounded-lg border bg-popover p-1 shadow-md"
    >
      <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
        {query ? `Matching "/${query}"` : "Type / to search commands"}
      </div>
      {items.map((item, index) => (
        <button
          key={item.id}
          data-selected={index === selectedIndex}
          onClick={() => selectItem(item)}
          onMouseEnter={() => setSelectedIndex(index)}
          className={cn(
            "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
            index === selectedIndex
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent hover:text-accent-foreground",
          )}
        >
          {item.icon}
          <div className="flex flex-col items-start">
            <span className="font-medium">/{item.name.toLowerCase()}</span>
            {item.description && (
              <span className="text-xs text-muted-foreground">
                {item.description}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};
