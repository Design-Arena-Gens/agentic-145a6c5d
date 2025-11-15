"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
};

const fallbackPrompts = [
  "Summarize what we just discussed.",
  "Give me three creative marketing ideas.",
  "Help me plan a productive morning routine.",
  "Explain a complex topic in simple terms.",
];

const assistantGreeting: Message = {
  id: "assistant-greeting",
  role: "assistant",
  content:
    "Hey there! I’m Chatmate—your friendly brainstorming partner. Ask me anything, explore ideas, or tap on a prompt to get started.",
  createdAt: Date.now(),
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([assistantGreeting]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(fallbackPrompts);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  const isSendDisabled = useMemo(
    () => input.trim().length === 0 || isLoading,
    [input, isLoading],
  );

  const updateTextareaHeight = useCallback(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(
      textareaRef.current.scrollHeight,
      180,
    )}px`;
  }, []);

  useEffect(() => {
    updateTextareaHeight();
  }, [input, updateTextareaHeight]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmedContent = content.trim();
      if (!trimmedContent || isLoading) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmedContent,
        createdAt: Date.now(),
      };

      const history = [...messages, userMessage];

      setInput("");
      setMessages(history);
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: history.map(({ role, content }) => ({ role, content })),
          }),
        });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.statusText}`);
        }

        const data: { reply: string; suggestions?: string[] } =
          await response.json();

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          createdAt: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setSuggestions(
          data.suggestions && data.suggestions.length > 0
            ? data.suggestions
            : fallbackPrompts,
        );
      } catch (error) {
        const fallbackMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "I ran into a hiccup while thinking that through. Give it another try in a moment.",
          createdAt: Date.now(),
        };
        setMessages((prev) => [...prev, fallbackMessage]);
        console.error(error);
      } finally {
        setIsLoading(false);
        textareaRef.current?.focus();
      }
    },
    [isLoading, messages],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void sendMessage(input);
    },
    [sendMessage, input],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void sendMessage(input);
      }
    },
    [input, sendMessage],
  );

  const renderTimestamp = (timestamp: number) => {
    const formatter = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return formatter.format(timestamp);
  };

  return (
    <div className={styles.page}>
      <div className={styles.chatShell}>
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.avatar} aria-hidden="true">
              🤖
            </span>
            <div>
              <h1>Chatmate</h1>
              <p>Always-on co-creator for questions, plans, and ideas.</p>
            </div>
          </div>
          <div className={styles.status}>
            <span className={styles.statusDot} aria-hidden="true" />
            <span>{isLoading ? "Thinking..." : "Online"}</span>
          </div>
        </header>

        <section className={styles.promptStrip} aria-label="Suggested prompts">
          {suggestions.map((prompt) => (
            <button
              key={prompt}
              className={styles.promptPill}
              type="button"
              onClick={() => {
                setInput(prompt);
                textareaRef.current?.focus();
                updateTextareaHeight();
              }}
            >
              {prompt}
            </button>
          ))}
        </section>

        <div
          ref={scrollContainerRef}
          className={styles.messages}
          aria-live="polite"
        >
          {messages.map((message) => (
            <article
              key={message.id}
              className={`${styles.messageRow} ${
                message.role === "user" ? styles.userRow : styles.assistantRow
              }`}
            >
              <div className={styles.bubble}>
                <p>{message.content}</p>
                <span className={styles.timestamp}>
                  {renderTimestamp(message.createdAt)}
                </span>
              </div>
            </article>
          ))}
          {isLoading ? (
            <div className={`${styles.messageRow} ${styles.assistantRow}`}>
              <div className={`${styles.bubble} ${styles.thinkingBubble}`}>
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
              </div>
            </div>
          ) : null}
        </div>

        <form className={styles.composer} onSubmit={handleSubmit}>
          <label htmlFor="chat-input" className={styles.visuallyHidden}>
            Message Chatmate
          </label>
          <textarea
            id="chat-input"
            ref={textareaRef}
            className={styles.textarea}
            placeholder="Ask me anything…"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            aria-label="Chat input"
          />
          <button
            className={styles.sendButton}
            type="submit"
            disabled={isSendDisabled}
            aria-label="Send message"
          >
            <svg
              className={styles.sendIcon}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M3.4 2.2 21.2 11a1.1 1.1 0 0 1 0 2L3.4 21.8A1.1 1.1 0 0 1 2 20.7v-6.6a1.1 1.1 0 0 1 .9-1 28.7 28.7 0 0 1 8.4-1.4 28.7 28.7 0 0 1-8.4-1.5 1.1 1.1 0 0 1-.9-1V3.3A1.1 1.1 0 0 1 3.4 2.2Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
