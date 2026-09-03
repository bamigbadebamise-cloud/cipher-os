"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";
import { cipherKnowledge } from "./cipher";

type Message = {
  role: "user" | "cipher";
  content: string;
  timestamp?: number;
};

type Chat = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
};

type Page = "home" | "chats" | "explore" | "settings";

const STORAGE_KEY = "cipher-chats";

const STOP_WORDS = new Set([
  "what",
  "whats",
  "what's",
  "is",
  "are",
  "the",
  "a",
  "an",
  "to",
  "of",
  "for",
  "in",
  "on",
  "at",
  "and",
  "or",
  "do",
  "does",
  "did",
  "can",
  "could",
  "would",
  "should",
  "how",
  "why",
  "when",
  "where",
  "who",
  "which",
  "me",
  "my",
  "you",
  "your",
  "please",
  "tell",
  "explain",
  "mean",
  "means",
  "about",
  "give",
  "get",
  "with",
  "be",
  "it",
  "this",
  "that",
  "from",
  "as",
  "i",
  "im",
  "i'm",
  "we",
  "our",
  "they",
  "their",
  "was",
  "were",
  "will",
  "just",
  "so",
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[?!.,'"`():;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePidgin(text: string): string {
  let result = normalize(text);

  const replacements: Record<string, string> = {
    "how far": "hello",
    "how you dey": "how are you",
    "how body": "how are you",
    "how far na": "hello",
    "wetin": "what",
    "wetin be": "what is",
    "wetin dey": "what is",
    "wetin you fit do": "what can you do",
    "wetin you sabi": "what do you know",
    "you sabi": "you know",
    "sabi": "know",
    "dey": "are",
    "abeg": "please",
    "oya": "go",
    "make we": "let us",
    "make i": "let me",
    "una": "you",
    "una go": "you will",
    "no wahala": "no problem",
    "wahala": "problem",
    "egbon": "brother",
    "bros": "brother",
    "bro": "brother",
    "jare": "",
    "sha": "",
    "na so": "yes",
    "ehen": "yes",
    "chai": "",
    "shey": "is",
    "abi": "or",
    "dem": "they",
    "am": "it",
    "go dey": "will be",
    "dey do": "are doing",
    "fit": "can",
    "don": "have",
    "done": "have",
  };

  const phrases = Object.keys(replacements).sort(
    (a, b) => b.length - a.length
  );

  for (const phrase of phrases) {
    const replacement = replacements[phrase];

    result = result.replace(
      new RegExp(`\\b${phrase}\\b`, "g"),
      replacement
    );
  }

  return result.replace(/\s+/g, " ").trim();
}

const SYNONYMS: Record<string, string[]> = {
  help: ["assist", "support", "aid", "guide"],
  explain: ["describe", "clarify", "teach", "breakdown"],
  meaning: ["definition", "means", "define"],
  computer: ["pc", "laptop", "machine", "system"],
  programming: ["coding", "code", "software development"],
  developer: ["programmer", "coder", "software engineer"],
  website: ["site", "webpage", "web app"],
  application: ["app", "software"],
  phone: ["mobile", "smartphone", "device"],
  school: ["university", "college", "campus"],
  student: ["undergraduate", "learner"],
  exam: ["test", "examination", "assessment"],
  engineering: ["engineer"],
  mathematics: ["math", "calculation"],
  science: ["scientific"],
  money: ["cash", "funds", "finance"],
  business: ["company", "enterprise", "brand"],
  design: ["graphic", "creative", "art"],
  music: ["song", "audio"],
  question: ["query", "problem"],
  answer: ["response", "reply"],
  remember: ["memory", "recall"],
};

function getImportantWords(text: string): string[] {
  return normalizePidgin(text)
    .split(" ")
    .filter(
      (word) =>
        word.length > 2 &&
        !STOP_WORDS.has(word)
    );
}

function synonymMatches(
  word: string,
  target: string
): boolean {
  if (word === target) return true;

  const group = SYNONYMS[word];

  if (group?.includes(target)) {
    return true;
  }

  for (const [base, synonyms] of Object.entries(SYNONYMS)) {
    if (synonyms.includes(word) && base === target) {
      return true;
    }
  }

  return false;
}

function getGreeting(query: string): string | null {
  const normalized = normalizePidgin(query);

  const greetings = [
    "hello",
    "hi",
    "hey",
    "hiya",
    "howdy",
    "yo",
    "sup",
    "wassup",
    "what's up",
    "whats up",
    "how far",
    "how are you",
    "good morning",
    "good afternoon",
    "good evening",
  ];

  if (greetings.includes(normalized)) {
    return "Hello 👋 I'm Cipher. How can I help you?";
  }

  if (
    normalized === "thanks" ||
    normalized === "thank you" ||
    normalized === "thank"
  ) {
    return "You're welcome 🤝";
  }

  return null;
}

function findAnswer(
  query: string,
  previousMessages: Message[] = []
): string {
  const originalQuery = query.trim();

  if (!originalQuery) {
    return "Ask me something and I'll do my best to help.";
  }

  const greeting = getGreeting(originalQuery);

  if (greeting) {
    return greeting;
  }

  const normalizedQuery = normalizePidgin(originalQuery);
  const queryWords = getImportantWords(normalizedQuery);

  const followUpWords = new Set([
    "it",
    "that",
    "this",
    "them",
    "they",
    "more",
    "again",
    "why",
    "how",
    "what",
    "which",
    "explain",
    "continue",
    "another",
    "example",
    "examples",
    "mean",
    "means",
  ]);

  const isShortFollowUp =
    queryWords.length <= 5 &&
    queryWords.some((word) =>
      followUpWords.has(word)
    );

  let contextWords: string[] = [];

  if (
    isShortFollowUp &&
    previousMessages.length > 0
  ) {
    const recentUserMessages =
      previousMessages
        .filter((msg) => msg.role === "user")
        .slice(-3);

    contextWords = recentUserMessages.flatMap(
      (msg) => getImportantWords(msg.content)
    );
  }

  let bestMatch:
    | (typeof cipherKnowledge)[number]
    | null = null;

  let bestScore = 0;

  for (const item of cipherKnowledge) {
    const question = normalizePidgin(item.question);

    const keywords = item.keywords.map(
      (keyword) => normalizePidgin(keyword)
    );

    const questionWords =
      getImportantWords(question);

    let score = 0;

    if (normalizedQuery === question) {
      score += 150;
    }

    if (
      question.includes(normalizedQuery) &&
      normalizedQuery.length > 4
    ) {
      score += 40;
    }

    for (const keyword of keywords) {
      if (!keyword) continue;

      if (normalizedQuery.includes(keyword)) {
        score += keyword.includes(" ")
          ? 25
          : 10;
      }

      const keywordWords =
        getImportantWords(keyword);

      for (const word of queryWords) {
        if (keywordWords.includes(word)) {
          score += 5;
        }

        for (const keywordWord of keywordWords) {
          if (
            synonymMatches(
              word,
              keywordWord
            )
          ) {
            score += 4;
          }
        }
      }
    }

    for (const word of queryWords) {
      if (questionWords.includes(word)) {
        score += 7;
      }

      for (const questionWord of questionWords) {
        if (
          synonymMatches(
            word,
            questionWord
          )
        ) {
          score += 4;
        }
      }
    }

    if (
      isShortFollowUp &&
      contextWords.length > 0
    ) {
      for (const word of contextWords) {
        if (questionWords.includes(word)) {
          score += 3;
        }

        for (const keyword of keywords) {
          if (
            getImportantWords(keyword).includes(
              word
            )
          ) {
            score += 3;
          }
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  if (
    bestMatch &&
    bestScore >= 7
  ) {
    return bestMatch.answer;
  }

  if (
    isShortFollowUp &&
    previousMessages.length > 0
  ) {
    const lastUserMessage =
      [...previousMessages]
        .reverse()
        .find(
          (msg) => msg.role === "user"
        );

    if (lastUserMessage) {
      return `I understand you're continuing from your previous question about "${lastUserMessage.content}". Ask the specific part you want me to explain.`;
    }
  }

  if (
    normalizedQuery.includes("who are you") ||
    normalizedQuery.includes("what are you")
  ) {
    return "I'm Cipher OS, a local knowledge-based assistant built to answer questions from my knowledge base.";
  }

  if (
    normalizedQuery.includes("what can you do") ||
    normalizedQuery.includes("what can you help")
  ) {
    return "I can answer questions from my knowledge base, help with technology, learning, general knowledge, engineering, creativity, and many everyday topics.";
  }

  if (
    normalizedQuery.includes("you understand pidgin")
  ) {
    return "Yes 🇳🇬 I can understand Nigerian English and common Pidgin expressions.";
  }

  return "I'm not sure about that yet. Try asking the question another way, or make it a little more specific.";
}

function createChat(): Chat {
  const now = Date.now();

  return {
    id: `${now}-${Math.random()
      .toString(36)
      .substring(2, 10)}`,
    title: "New Chat",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

function createTitle(
  message: string
): string {
  const cleaned = message
    .trim()
    .replace(/\s+/g, " ");

  if (cleaned.length <= 32) {
    return cleaned;
  }

  return `${cleaned.substring(0, 32)}...`;
}

function formatTime(timestamp?: number): string {
  if (!timestamp) return "";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

export default function Home() {
  const [chats, setChats] =
    useState<Chat[]>([]);

  const [activeChatId, setActiveChatId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const [isTyping, setIsTyping] =
    useState(false);

  const [currentPage, setCurrentPage] =
    useState<Page>("home");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [editingChatId, setEditingChatId] =
    useState<string | null>(null);

  const [editingTitle, setEditingTitle] =
    useState("");

  const [loaded, setLoaded] =
    useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [copiedMessage, setCopiedMessage] =
    useState<string | null>(null);

  const responseTimer =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const copyTimer =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const savedChats =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (savedChats) {
        const parsed =
          JSON.parse(savedChats);

        if (Array.isArray(parsed)) {
          setChats(parsed);

          if (parsed.length > 0) {
            const sorted = [...parsed].sort(
              (a, b) =>
                b.updatedAt -
                a.updatedAt
            );

            setActiveChatId(
              sorted[0].id
            );
          }
        }
      }
    } catch {
      localStorage.removeItem(
        STORAGE_KEY
      );
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    return () => {
      if (responseTimer.current) {
        clearTimeout(
          responseTimer.current
        );
      }

      if (copyTimer.current) {
        clearTimeout(
          copyTimer.current
        );
      }
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(chats)
    );
  }, [chats, loaded]);

  const activeChat =
    chats.find(
      (chat) =>
        chat.id === activeChatId
    ) || null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [
    activeChat?.messages.length,
    isTyping,
  ]);

  useEffect(() => {
    setCopiedMessage(null);
  }, [activeChatId]);

  const sortedChats = useMemo(() => {
    return [...chats].sort(
      (a, b) =>
        b.updatedAt -
        a.updatedAt
    );
  }, [chats]);

  const filteredChats =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      if (!query) {
        return sortedChats;
      }

      return sortedChats.filter(
        (chat) => {
          const titleMatch =
            chat.title
              .toLowerCase()
              .includes(query);

          const messageMatch =
            chat.messages.some(
              (msg) =>
                msg.content
                  .toLowerCase()
                  .includes(query)
            );

          return (
            titleMatch ||
            messageMatch
          );
        }
      );
    }, [
      sortedChats,
      searchQuery,
    ]);

  function navigateTo(page: Page) {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  }

  function newChat() {
    if (responseTimer.current) {
      clearTimeout(
        responseTimer.current
      );

      responseTimer.current = null;
    }

    setCopiedMessage(null);

    const chat = createChat();

    setChats((prev) => [
      chat,
      ...prev,
    ]);

    setActiveChatId(chat.id);
    setMessage("");
    setIsTyping(false);
    setCurrentPage("home");
    setMobileMenuOpen(false);
  }

  function openChat(
    chatId: string
  ) {
    if (responseTimer.current) {
      clearTimeout(
        responseTimer.current
      );

      responseTimer.current = null;
    }

    setCopiedMessage(null);
    setActiveChatId(chatId);
    setMessage("");
    setIsTyping(false);
    setCurrentPage("home");
    setMobileMenuOpen(false);
  }

  function deleteChat(
    chatId: string
  ) {
    const chat =
      chats.find(
        (item) =>
          item.id === chatId
      );

    if (!chat) return;

    const confirmed =
      window.confirm(
        `Delete "${chat.title}"?\n\nThis conversation will be permanently removed from this browser.`
      );

    if (!confirmed) return;

    if (responseTimer.current) {
      clearTimeout(
        responseTimer.current
      );

      responseTimer.current = null;
    }

    setCopiedMessage(null);

    const remainingChats =
      chats.filter(
        (item) =>
          item.id !== chatId
      );

    setChats(
      remainingChats
    );

    if (
      activeChatId ===
      chatId
    ) {
      if (
        remainingChats.length >
        0
      ) {
        const nextChat =
          [...remainingChats].sort(
            (a, b) =>
              b.updatedAt -
              a.updatedAt
          )[0];

        setActiveChatId(
          nextChat.id
        );
      } else {
        setActiveChatId(null);
      }

      setIsTyping(false);
      setCurrentPage("home");
    }
  }

  function startRename(
    chat: Chat
  ) {
    setEditingChatId(chat.id);
    setEditingTitle(
      chat.title
    );
  }

  function cancelRename() {
    setEditingChatId(null);
    setEditingTitle("");
  }

  function saveRename(
    chatId: string
  ) {
    const title =
      editingTitle.trim();

    if (!title) {
      cancelRename();
      return;
    }

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              title:
                title.substring(
                  0,
                  60
                ),
              updatedAt:
                Date.now(),
            }
          : chat
      )
    );

    cancelRename();
  }

  async function copyMessage(
    content: string,
    messageIndex: number
  ) {
    const copyKey =
      `${activeChatId}-${messageIndex}`;

    try {
      await navigator.clipboard.writeText(
        content
      );

      setCopiedMessage(copyKey);

      if (copyTimer.current) {
        clearTimeout(
          copyTimer.current
        );
      }

      copyTimer.current =
        setTimeout(() => {
          setCopiedMessage(null);
          copyTimer.current = null;
        }, 1500);
    } catch {
      setCopiedMessage(null);
    }
  }

  function sendMessage() {
    const text =
      message.trim();

    if (
      !text ||
      isTyping
    ) {
      return;
    }

    let chatId =
      activeChatId;

    let chatForAnswer =
      activeChat;

    if (!chatId) {
      const newChatItem =
        createChat();

      chatId =
        newChatItem.id;

      chatForAnswer =
        newChatItem;

      setChats((prev) => [
        newChatItem,
        ...prev,
      ]);

      setActiveChatId(
        chatId
      );
    }

    if (!chatForAnswer) {
      chatForAnswer =
        chats.find(
          (chat) =>
            chat.id === chatId
        ) || null;
    }

    const previousMessages =
      chatForAnswer?.messages ||
      [];

    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const finalChatId =
      chatId;

    setChats((prev) =>
      prev.map((chat) => {
        if (
          chat.id !==
          finalChatId
        ) {
          return chat;
        }

        return {
          ...chat,

          title:
            chat.messages
              .length === 0
              ? createTitle(text)
              : chat.title,

          messages: [
            ...chat.messages,
            userMessage,
          ],

          updatedAt:
            Date.now(),
        };
      })
    );

    setMessage("");
    setIsTyping(true);
    setCopiedMessage(null);

    if (
      responseTimer.current
    ) {
      clearTimeout(
        responseTimer.current
      );
    }

    responseTimer.current =
      setTimeout(() => {
        const answer =
          findAnswer(
            text,
            previousMessages
          );

        const cipherMessage:
          Message = {
          role: "cipher",
          content: answer,
          timestamp: Date.now(),
        };

        setChats((prev) =>
          prev.map((chat) => {
            if (
              chat.id !==
              finalChatId
            ) {
              return chat;
            }

            const lastMessage =
              chat.messages[
                chat.messages.length - 1
              ];

            if (
              lastMessage?.role ===
                "cipher" &&
              lastMessage.content ===
                answer
            ) {
              return chat;
            }

            return {
              ...chat,

              messages: [
                ...chat.messages,
                cipherMessage,
              ],

              updatedAt:
                Date.now(),
            };
          })
        );

        setIsTyping(false);
        responseTimer.current =
          null;
      }, 1200);
  }

  function startQuestion(
    question: string
  ) {
    if (!activeChatId) {
      const chat =
        createChat();

      setChats((prev) => [
        chat,
        ...prev,
      ]);

      setActiveChatId(
        chat.id
      );
    }

    setCurrentPage("home");
    setMessage(question);
    setMobileMenuOpen(false);
  }

  function renderHome() {
    const currentMessages =
      activeChat?.messages ||
      [];

    return (
      <div
        className={
          styles.homeContainer
        }
      >
        <div
          className={
            styles.chat
          }
        >
          {currentMessages.length ===
          0 ? (
            <div
              className={
                styles.welcome
              }
            >
              <div
                className={
                  styles.avatar
                }
              >
                C
              </div>

              <h2>
                Welcome to
                Cipher OS
              </h2>

              <p>
                Your intelligent
                workspace for
                thinking,
                creating,
                learning and
                getting things
                done.
              </p>

              <div
                className={
                  styles.suggestions
                }
              >
                <button
                  onClick={() =>
                    startQuestion(
                      "What can you help me with?"
                    )
                  }
                >
                  What can you
                  help me with?
                </button>

                <button
                  onClick={() =>
                    startQuestion(
                      "Explain something to me"
                    )
                  }
                >
                  Explain
                  something to me
                </button>

                <button
                  onClick={() =>
                    startQuestion(
                      "Help me solve a problem"
                    )
                  }
                >
                  Help me solve a
                  problem
                </button>
              </div>
            </div>
          ) : (
            <div
              className={
                styles.messages
              }
            >
              {currentMessages.map(
                (msg, index) => {
                  const copyKey =
                    `${activeChatId}-${index}`;

                  return (
                    <div
                      key={`${msg.role}-${index}`}
                      className={
                        msg.role ===
                        "user"
                          ? styles.userMessage
                          : styles.assistantMessage
                      }
                    >
                      <div
                        className={
                          styles.messageHeader
                        }
                      >
                        <div
                          className={
                            styles.messageIdentity
                          }
                        >
                          {msg.role ===
                          "cipher" ? (
                            <div
                              className={
                                styles.messageAvatar
                              }
                            >
                              C
                            </div>
                          ) : (
                            <div
                              className={
                                styles.userAvatar
                              }
                            >
                              You
                            </div>
                          )}

                          <div>
                            <div
                              className={
                                styles.messageName
                              }
                            >
                              {msg.role ===
                              "user"
                                ? "You"
                                : "Cipher"}
                            </div>

                            {msg.timestamp && (
                              <div
                                className={
                                  styles.messageTime
                                }
                              >
                                {formatTime(
                                  msg.timestamp
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {msg.role ===
                          "cipher" && (
                          <div
                            className={
                              styles.messageActions
                            }
                          >
                            <button
                              className={
                                styles.copyButton
                              }
                              onClick={() =>
                                copyMessage(
                                  msg.content,
                                  index
                                )
                              }
                              title="Copy response"
                              aria-label="Copy Cipher response"
                            >
                              {copiedMessage ===
                              copyKey
                                ? "✓ Copied"
                                : "📋 Copy"}
                            </button>
                          </div>
                        )}
                      </div>

                      <div
                        className={
                          styles.messageContent
                        }
                      >
                        <p>
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  );
                }
              )}

              {isTyping && (
                <div
                  className={
                    styles.assistantMessage
                  }
                >
                  <div
                    className={
                      styles.messageHeader
                    }
                  >
                    <div
                      className={
                        styles.messageIdentity
                      }
                    >
                      <div
                        className={
                          styles.messageAvatar
                        }
                      >
                        C
                      </div>

                      <div>
                        <div
                          className={
                            styles.messageName
                          }
                        >
                          Cipher
                        </div>

                        <div
                          className={
                            styles.messageTime
                          }
                        >
                          Thinking...
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={
                      styles.typing
                    }
                  >
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}

              <div
                ref={
                  messagesEndRef
                }
              />
            </div>
          )}
        </div>

        <div
          className={
            styles.inputArea
          }
        >
          <div
            className={
              styles.inputBox
            }
          >
            <input
              type="text"
              placeholder="Ask Cipher anything..."
              value={message}
              onChange={(e) =>
                setMessage(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key ===
                  "Enter"
                ) {
                  sendMessage();
                }
              }}
            />

            <button
              className={
                styles.sendButton
              }
              onClick={
                sendMessage
              }
              disabled={
                !message.trim() ||
                isTyping
              }
              aria-label="Send message"
              title="Send message"
            >
              ↑
            </button>
          </div>

          <p
            className={
              styles.disclaimer
            }
          >
            Cipher OS can make
            mistakes. Check
            important
            information.
          </p>
        </div>
      </div>
    );
  }

  function renderChats() {
    return (
      <div
        className={
          styles.pageContent
        }
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap: "15px",
          }}
        >
          <div>
            <h2>Chats</h2>

            <p
              className={
                styles.pageDescription
              }
            >
              Your saved
              conversations
              with Cipher.
            </p>
          </div>

          <button
            className={
              styles.newChat
            }
            onClick={newChat}
            style={{
              width: "auto",
              marginBottom: 0,
              whiteSpace:
                "nowrap",
            }}
          >
            + New Chat
          </button>
        </div>

        {chats.length > 0 && (
          <div
            style={{
              marginTop:
                "25px",
            }}
          >
            <input
              type="text"
              value={
                searchQuery
              }
              onChange={(e) =>
                setSearchQuery(
                  e.target.value
                )
              }
              placeholder="Search chats..."
              style={{
                width: "100%",
                padding:
                  "13px 15px",
                borderRadius:
                  "10px",
                border:
                  "1px solid #30353d",
                outline: "none",
                background:
                  "#15191f",
                color: "white",
                fontSize:
                  "14px",
                boxSizing:
                  "border-box",
              }}
            />
          </div>
        )}

        {chats.length === 0 ? (
          <div
            className={
              styles.emptyState
            }
          >
            <div>💬</div>

            <h3>
              No chats yet
            </h3>

            <p>
              Start a new
              conversation
              with Cipher.
            </p>
          </div>
        ) : filteredChats.length ===
          0 ? (
          <div
            className={
              styles.emptyState
            }
          >
            <div>🔎</div>

            <h3>
              No chats found
            </h3>

            <p>
              Try a different
              search term.
            </p>
          </div>
        ) : (
          <div
            className={
              styles.chatHistory
            }
          >
            {filteredChats.map(
              (chat) => (
                <div
                  key={chat.id}
                  className={
                    styles.historyItem
                  }
                >
                  {editingChatId ===
                  chat.id ? (
                    <div
                      style={{
                        flex: 1,
                        display:
                          "flex",
                        gap: "8px",
                        alignItems:
                          "center",
                        padding:
                          "8px",
                      }}
                    >
                      <input
                        autoFocus
                        value={
                          editingTitle
                        }
                        onChange={(
                          e
                        ) =>
                          setEditingTitle(
                            e.target
                              .value
                          )
                        }
                        onKeyDown={(
                          e
                        ) => {
                          if (
                            e.key ===
                            "Enter"
                          ) {
                            saveRename(
                              chat.id
                            );
                          }

                          if (
                            e.key ===
                            "Escape"
                          ) {
                            cancelRename();
                          }
                        }}
                        style={{
                          flex: 1,
                          padding:
                            "10px 12px",
                          borderRadius:
                            "8px",
                          border:
                            "1px solid #30353d",
                          outline:
                            "none",
                          background:
                            "#101318",
                          color:
                            "white",
                        }}
                      />

                      <button
                        className={
                          styles.deleteChat
                        }
                        onClick={() =>
                          saveRename(
                            chat.id
                          )
                        }
                        title="Save"
                      >
                        ✓
                      </button>

                      <button
                        className={
                          styles.deleteChat
                        }
                        onClick={
                          cancelRename
                        }
                        title="Cancel"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        className={
                          styles.historyButton
                        }
                        onClick={() =>
                          openChat(
                            chat.id
                          )
                        }
                      >
                        <span>
                          💬
                        </span>

                        <div>
                          <strong>
                            {
                              chat.title
                            }
                          </strong>

                          <small>
                            {
                              chat
                                .messages
                                .length
                            }{" "}
                            message
                            {chat
                              .messages
                              .length !==
                            1
                              ? "s"
                              : ""}
                          </small>
                        </div>
                      </button>

                      <button
                        className={
                          styles.deleteChat
                        }
                        onClick={() =>
                          startRename(
                            chat
                          )
                        }
                        title="Rename chat"
                      >
                        ✏️
                      </button>

                      <button
                        className={
                          styles.deleteChat
                        }
                        onClick={() =>
                          deleteChat(
                            chat.id
                          )
                        }
                        title="Delete chat"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    );
  }

  function renderExplore() {
    return (
      <div
        className={
          styles.pageContent
        }
      >
        <h2>
          Explore
        </h2>

        <p
          className={
            styles.pageDescription
          }
        >
          Explore what Cipher
          OS can help you
          with.
        </p>

        <div
          className={
            styles.featureGrid
          }
        >
          <div
            className={
              styles.featureCard
            }
          >
            <span>🧠</span>

            <h3>
              Knowledge
            </h3>

            <p>
              Ask Cipher
              questions from
              its knowledge
              base.
            </p>
          </div>

          <div
            className={
              styles.featureCard
            }
          >
            <span>💡</span>

            <h3>
              Problem Solving
            </h3>

            <p>
              Work through
              questions and
              everyday
              problems.
            </p>
          </div>

          <div
            className={
              styles.featureCard
            }
          >
            <span>💻</span>

            <h3>
              Technology
            </h3>

            <p>
              Explore
              programming and
              technology
              topics.
            </p>
          </div>

          <div
            className={
              styles.featureCard
            }
          >
            <span>🎨</span>

            <h3>
              Creative
            </h3>

            <p>
              Use Cipher as a
              creative thinking
              workspace.
            </p>
          </div>
        </div>
      </div>
    );
  }

  function renderSettings() {
    return (
      <div
        className={
          styles.pageContent
        }
      >
        <h2>
          Settings
        </h2>

        <p
          className={
            styles.pageDescription
          }
        >
          Manage your Cipher
          OS preferences.
        </p>

        <div
          className={
            styles.settingsCard
          }
        >
          <div>
            <strong>
              Appearance
            </strong>

            <p>
              Dark mode
            </p>
          </div>

          <span
            className={
              styles.settingStatus
            }
          >
            Active
          </span>
        </div>

        <div
          className={
            styles.settingsCard
          }
        >
          <div>
            <strong>
              Knowledge Base
            </strong>

            <p>
              Local Cipher
              knowledge system
            </p>
          </div>

          <span
            className={
              styles.settingStatus
            }
          >
            Active
          </span>
        </div>

        <div
          className={
            styles.settingsCard
          }
        >
          <div>
            <strong>
              Chat Memory
            </strong>

            <p>
              Conversations
              saved locally
            </p>
          </div>

          <span
            className={
              styles.settingStatus
            }
          >
            Active
          </span>
        </div>

        <div
          className={
            styles.settingsCard
          }
        >
          <div>
            <strong>
              AI Connection
            </strong>

            <p>
              No external AI
              service connected
            </p>
          </div>

          <span
            className={
              styles.settingStatus
            }
          >
            Local
          </span>
        </div>
      </div>
    );
  }

  return (
    <main
      className={
        styles.container
      }
    >
      <aside
        className={
          styles.sidebar
        }
      >
        <div
          className={
            styles.logo
          }
        >
          CIPHER
          <span>
            OS
          </span>
        </div>

        <button
          className={
            styles.newChat
          }
          onClick={newChat}
        >
          + New Chat
        </button>

        <nav
          className={
            styles.nav
          }
        >
          <button
            className={
              currentPage === "home"
                ? styles.activeNav
                : ""
            }
            onClick={() =>
              navigateTo("home")
            }
          >
            ⌂ Home
          </button>

          <button
            className={
              currentPage === "chats"
                ? styles.activeNav
                : ""
            }
            onClick={() =>
              navigateTo("chats")
            }
          >
            ◉ Chats
          </button>

          <button
            className={
              currentPage === "explore"
                ? styles.activeNav
                : ""
            }
            onClick={() =>
              navigateTo("explore")
            }
          >
            ✦ Explore
          </button>
        </nav>

        <div
          className={
            styles.sidebarBottom
          }
        >
          <button
            className={
              currentPage === "settings"
                ? styles.activeNav
                : ""
            }
            onClick={() =>
              navigateTo("settings")
            }
          >
            ⚙ Settings
          </button>
        </div>
      </aside>

      <section
        className={
          styles.main
        }
      >
        <header
          className={
            styles.header
          }
        >
          <button
            className={
              styles.mobileMenuButton
            }
            onClick={() =>
              setMobileMenuOpen(
                !mobileMenuOpen
              )
            }
            aria-label="Open navigation"
          >
            {mobileMenuOpen
              ? "×"
              : "☰"}
          </button>

          <div>
            <h1>
              {currentPage ===
                "home" &&
                "Cipher OS"}

              {currentPage ===
                "chats" &&
                "Chats"}

              {currentPage ===
                "explore" &&
                "Explore"}

              {currentPage ===
                "settings" &&
                "Settings"}
            </h1>

            <p>
              {currentPage ===
                "home" &&
                "Your personal AI operating system"}

              {currentPage ===
                "chats" &&
                "Your conversation history"}

              {currentPage ===
                "explore" &&
                "Discover Cipher OS capabilities"}

              {currentPage ===
                "settings" &&
                "Configure your workspace"}
            </p>
          </div>

          <div
            className={
              styles.status
            }
          >
            <span />
            Online
          </div>
        </header>

        {mobileMenuOpen && (
          <div
            className={
              styles.mobileMenu
            }
          >
            <button
              className={
                currentPage === "home"
                  ? styles.activeNav
                  : ""
              }
              onClick={() =>
                navigateTo("home")
              }
            >
              ⌂ Home
            </button>

            <button
              className={
                currentPage === "chats"
                  ? styles.activeNav
                  : ""
              }
              onClick={() =>
                navigateTo("chats")
              }
            >
              ◉ Chats
            </button>

            <button
              className={
                currentPage === "explore"
                  ? styles.activeNav
                  : ""
              }
              onClick={() =>
                navigateTo("explore")
              }
            >
              ✦ Explore
            </button>

            <button
              className={
                currentPage === "settings"
                  ? styles.activeNav
                  : ""
              }
              onClick={() =>
                navigateTo("settings")
              }
            >
              ⚙ Settings
            </button>

            <button
              className={
                styles.mobileNewChat
              }
              onClick={newChat}
            >
              + New Chat
            </button>
          </div>
        )}

        {currentPage ===
          "home" &&
          renderHome()}

        {currentPage ===
          "chats" &&
          renderChats()}

        {currentPage ===
          "explore" &&
          renderExplore()}

        {currentPage ===
          "settings" &&
          renderSettings()}
      </section>
    </main>
  );
}