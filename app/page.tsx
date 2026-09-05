"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./page.module.css";

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
};

type Chat = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
};

type View =
  | "chat"
  | "chats"
  | "explore"
  | "settings";

type Theme = "dark" | "light";

type SettingSection =
  | "general"
  | "appearance"
  | "chat"
  | "privacy"
  | "about";

const STORAGE_KEY = "cipher-os-chats-v2";
const THEME_KEY = "cipher-os-theme";
const SIDEBAR_KEY = "cipher-os-sidebar";

const DEFAULT_WELCOME_MESSAGE =
  "Hello 👋 I’m Cipher. What are we working on today?";

const QUICK_ACTIONS = [
  {
    title: "Explain a concept",
    description: "Break down something difficult",
    prompt: "Explain a difficult concept to me in a simple way.",
    icon: "✦",
  },
  {
    title: "Solve a problem",
    description: "Think through a challenge",
    prompt: "Help me solve a problem step by step.",
    icon: "⌁",
  },
  {
    title: "Write something",
    description: "Create polished content",
    prompt: "Help me write something professionally.",
    icon: "Aa",
  },
  {
    title: "Build with code",
    description: "Work through a technical idea",
    prompt: "Help me build something with code.",
    icon: "</>",
  },
];

const NAV_ITEMS: {
  id: View;
  label: string;
  icon: string;
}[] = [
  {
    id: "chat",
    label: "Chat",
    icon: "⌂",
  },
  {
    id: "chats",
    label: "Chats",
    icon: "◌",
  },
  {
    id: "explore",
    label: "Explore",
    icon: "✦",
  },
];

const SETTINGS_ITEMS: {
  id: SettingSection;
  label: string;
  icon: string;
}[] = [
  {
    id: "general",
    label: "General",
    icon: "◫",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: "◐",
  },
  {
    id: "chat",
    label: "Chat",
    icon: "◌",
  },
  {
    id: "privacy",
    label: "Privacy",
    icon: "◇",
  },
  {
    id: "about",
    label: "About",
    icon: "ⓘ",
  },
];

function createId(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function createChat(): Chat {
  const now = Date.now();

  return {
    id: createId("chat"),
    title: "New conversation",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

function createMessage(
  role: Role,
  content: string
): Message {
  return {
    id: createId("msg"),
    role,
    content,
    timestamp: Date.now(),
  };
}

function makeTitle(text: string) {
  const cleaned = text.trim().replace(/\s+/g, " ");

  if (cleaned.length <= 38) {
    return cleaned;
  }

  return `${cleaned.slice(0, 38).trim()}…`;
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(timestamp);
}

function getInitials() {
  return "C";
}

function scrollToBottom(
  ref: React.RefObject<HTMLDivElement | null>
) {
  requestAnimationFrame(() => {
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  });
}

function Icon({
  name,
  size = 18,
}: {
  name: string;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );

    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      );

    case "send":
      return (
        <svg {...common}>
          <path d="M21 3 10 14" />
          <path d="m21 3-7 18-4-7-7-4 18-7Z" />
        </svg>
      );

    case "copy":
      return (
        <svg {...common}>
          <rect
            x="8"
            y="8"
            width="11"
            height="11"
            rx="2"
          />
          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
        </svg>
      );

    case "edit":
      return (
        <svg {...common}>
          <path d="m4 16.5-.6 3.1 3.1-.6L18.8 6.7a2 2 0 0 0-2.8-2.8L4 16.5Z" />
          <path d="m14.6 6.4 3 3" />
        </svg>
      );

    case "trash":
      return (
        <svg {...common}>
          <path d="M4 7h16" />
          <path d="M9 7V4h6v3" />
          <path d="M7 7l1 13h8l1-13" />
          <path d="M10 11v5M14 11v5" />
        </svg>
      );

    case "chevron":
      return (
        <svg {...common}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );

    case "sun":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      );

    case "moon":
      return (
        <svg {...common}>
          <path d="M20.5 14.8A8.5 8.5 0 0 1 9.2 3.5 8.5 8.5 0 1 0 20.5 14.8Z" />
        </svg>
      );

    case "monitor":
      return (
        <svg {...common}>
          <rect
            x="3"
            y="4"
            width="18"
            height="12"
            rx="2"
          />
          <path d="M8 20h8M12 16v4" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "lock":
      return (
        <svg {...common}>
          <rect
            x="5"
            y="10"
            width="14"
            height="10"
            rx="2"
          />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      );

    case "database":
      return (
        <svg {...common}>
          <ellipse
            cx="12"
            cy="5"
            rx="7"
            ry="3"
          />
          <path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />
          <path d="M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7" />
        </svg>
      );

    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3 19 6v5c0 5-3.2 8.4-7 10-3.8-1.6-7-5-7-10V6l7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );

    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10v6" />
          <path d="M12 7h.01" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
  }
}

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] =
    useState<string | null>(null);

  const [view, setView] =
    useState<View>("chat");

  const [settingsSection, setSettingsSection] =
    useState<SettingSection>("general");

  const [theme, setTheme] =
    useState<Theme>("dark");

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  const [editingChatId, setEditingChatId] =
    useState<string | null>(null);

  const [editingTitle, setEditingTitle] =
    useState("");

  const [copiedId, setCopiedId] =
    useState<string | null>(null);

  const [temperature, setTemperature] =
    useState(0.7);

  const [enterToSend, setEnterToSend] =
    useState(true);

  const [showTimestamps, setShowTimestamps] =
    useState(true);

  const [compactMessages, setCompactMessages] =
    useState(false);

  const [confirmDeleteChats, setConfirmDeleteChats] =
    useState(true);

  const [notifications, setNotifications] =
    useState(true);

  const [statusMessage, setStatusMessage] =
    useState("");

  const bottomRef =
    useRef<HTMLDivElement | null>(null);

  const copyTimeout =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const statusTimeout =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  useEffect(() => {
    try {
      const savedChats =
        localStorage.getItem(STORAGE_KEY);

      if (savedChats) {
        const parsed = JSON.parse(savedChats);

        if (Array.isArray(parsed)) {
          setChats(parsed);
        }
      }

      const savedTheme =
        localStorage.getItem(
          THEME_KEY
        ) as Theme | null;

      if (
        savedTheme === "dark" ||
        savedTheme === "light"
      ) {
        setTheme(savedTheme);
      }

      const savedSidebar =
        localStorage.getItem(SIDEBAR_KEY);

      if (savedSidebar === "collapsed") {
        setSidebarCollapsed(true);
      }
    } catch {
      // Ignore malformed local storage.
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(chats)
    );
  }, [chats, loaded]);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      THEME_KEY,
      theme
    );

    document.documentElement.dataset.theme =
      theme;
  }, [theme, loaded]);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      SIDEBAR_KEY,
      sidebarCollapsed
        ? "collapsed"
        : "expanded"
    );
  }, [
    sidebarCollapsed,
    loaded,
  ]);

  useEffect(() => {
    return () => {
      if (copyTimeout.current) {
        clearTimeout(copyTimeout.current);
      }

      if (statusTimeout.current) {
        clearTimeout(statusTimeout.current);
      }
    };
  }, []);

  const sortedChats = useMemo(
    () =>
      [...chats].sort(
        (a, b) =>
          b.updatedAt - a.updatedAt
      ),
    [chats]
  );

  const filteredChats = useMemo(() => {
    const q =
      search.trim().toLowerCase();

    if (!q) {
      return sortedChats;
    }

    return sortedChats.filter(
      (chat) =>
        chat.title
          .toLowerCase()
          .includes(q) ||
        chat.messages.some(
          (msg) =>
            msg.content
              .toLowerCase()
              .includes(q)
        )
    );
  }, [search, sortedChats]);

  const activeChat = useMemo(
    () =>
      chats.find(
        (chat) =>
          chat.id === activeChatId
      ) ?? null,
    [activeChatId, chats]
  );

  useEffect(() => {
    if (!activeChatId) return;

    scrollToBottom(bottomRef);
  }, [
    activeChatId,
    activeChat?.messages.length,
    isTyping,
  ]);

  function showStatus(text: string) {
    setStatusMessage(text);

    if (statusTimeout.current) {
      clearTimeout(
        statusTimeout.current
      );
    }

    statusTimeout.current =
      setTimeout(() => {
        setStatusMessage("");
      }, 1800);
  }

  function createAndOpenChat() {
    const chat = createChat();

    setChats((current) => [
      chat,
      ...current,
    ]);

    setActiveChatId(chat.id);
    setView("chat");
    setMessage("");
    setCopiedId(null);
    setIsTyping(false);
  }

  function openChat(chatId: string) {
    setActiveChatId(chatId);
    setView("chat");
    setMessage("");
    setCopiedId(null);
    setIsTyping(false);
  }

  function openSettings(
    section: SettingSection
  ) {
    setSettingsSection(section);
    setView("settings");
  }

  function updateTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    showStatus(
      `${nextTheme === "dark" ? "Dark" : "Light"} mode enabled`
    );
  }

  function deleteChat(chatId: string) {
    const target = chats.find(
      (chat) => chat.id === chatId
    );

    if (!target) return;

    if (confirmDeleteChats) {
      const confirmed =
        window.confirm(
          `Delete "${target.title}"?`
        );

      if (!confirmed) return;
    }

    const remaining =
      chats.filter(
        (chat) => chat.id !== chatId
      );

    setChats(remaining);

    if (activeChatId === chatId) {
      const next =
        remaining[0] ?? null;

      setActiveChatId(
        next?.id ?? null
      );
    }

    showStatus("Conversation deleted");
  }

  function beginRename(chat: Chat) {
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  }

  function cancelRename() {
    setEditingChatId(null);
    setEditingTitle("");
  }

  function saveRename(chatId: string) {
    const title =
      editingTitle.trim();

    if (!title) {
      cancelRename();
      return;
    }

    setChats((current) =>
      current.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              title:
                title.slice(0, 80),
              updatedAt:
                Date.now(),
            }
          : chat
      )
    );

    cancelRename();
    showStatus("Conversation renamed");
  }

  async function copyMessage(
    messageId: string,
    content: string
  ) {
    try {
      await navigator.clipboard.writeText(
        content
      );

      setCopiedId(messageId);

      if (copyTimeout.current) {
        clearTimeout(
          copyTimeout.current
        );
      }

      copyTimeout.current =
        setTimeout(() => {
          setCopiedId(null);
        }, 1500);
    } catch {
      showStatus(
        "Copy failed"
      );
    }
  }

  function useQuickPrompt(
    prompt: string
  ) {
    if (!activeChatId) {
      createAndOpenChat();
    }

    setView("chat");
    setMessage(prompt);
  }

  async function sendMessage(
    forcedText?: string
  ) {
    const text =
      (
        forcedText ??
        message
      ).trim();

    if (!text || isTyping) {
      return;
    }

    let targetChatId =
      activeChatId;

    let history: Message[] = [];

    if (!targetChatId) {
      const chat = createChat();

      targetChatId = chat.id;

      setChats((current) => [
        chat,
        ...current,
      ]);

      setActiveChatId(chat.id);
    } else {
      history =
        chats.find(
          (chat) =>
            chat.id ===
            targetChatId
        )?.messages ?? [];
    }

    const userMessage =
      createMessage(
        "user",
        text
      );

    setChats((current) =>
      current.map((chat) => {
        if (
          chat.id !==
          targetChatId
        ) {
          return chat;
        }

        return {
          ...chat,
          title:
            chat.messages.length ===
            0
              ? makeTitle(text)
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

    try {
      const response =
        await fetch(
          "/api/chat",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              message: text,
              history,
              settings: {
                temperature,
              },
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to reach Cipher."
        );
      }

      const reply =
        typeof data.reply ===
        "string"
          ? data.reply.trim()
          : "";

      if (!reply) {
        throw new Error(
          "Cipher returned an empty response."
        );
      }

      const assistantMessage =
        createMessage(
          "assistant",
          reply
        );

      setChats((current) =>
        current.map((chat) => {
          if (
            chat.id !==
            targetChatId
          ) {
            return chat;
          }

          return {
            ...chat,
            messages: [
              ...chat.messages,
              assistantMessage,
            ],
            updatedAt:
              Date.now(),
          };
        })
      );
    } catch (error) {
      console.error(
        "Cipher request failed:",
        error
      );

      const fallback =
        "I couldn't connect to Cipher right now. Please check your connection and try again.";

      const assistantMessage =
        createMessage(
          "assistant",
          fallback
        );

      setChats((current) =>
        current.map((chat) => {
          if (
            chat.id !==
            targetChatId
          ) {
            return chat;
          }

          return {
            ...chat,
            messages: [
              ...chat.messages,
              assistantMessage,
            ],
            updatedAt:
              Date.now(),
          };
        })
      );
    } finally {
      setIsTyping(false);
    }
  }

  function clearAllChats() {
    if (chats.length === 0) {
      showStatus(
        "No conversations to clear"
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Clear every Cipher conversation saved on this device?"
      );

    if (!confirmed) return;

    setChats([]);
    setActiveChatId(null);
    setView("chat");

    showStatus(
      "All conversations cleared"
    );
  }

  function renderBrand() {
    return (
      <div
        className={
          styles.brandArea
        }
      >
        <button
          className={
            styles.brandButton
          }
          onClick={() => {
            setView("chat");
            setActiveChatId(
              activeChatId
            );
          }}
          aria-label="Cipher OS"
        >
          <div
            className={
              styles.brandMark
            }
          >
            C
          </div>

          {!sidebarCollapsed && (
            <div
              className={
                styles.brandWords
              }
            >
              <strong>
                CIPHER
              </strong>
              <span>OS</span>
            </div>
          )}
        </button>
      </div>
    );
  }

  function renderSidebar() {
    return (
      <aside
        className={`${styles.sidebar} ${
          sidebarCollapsed
            ? styles.sidebarCollapsed
            : ""
        }`}
      >
        {renderBrand()}

        <div
          className={
            styles.sidebarSection
          }
        >
          {!sidebarCollapsed && (
            <div
              className={
                styles.sidebarLabel
              }
            >
              WORKSPACE
            </div>
          )}

          <button
            className={
              styles.sidebarNewChat
            }
            onClick={
              createAndOpenChat
            }
          >
            <span
              className={
                styles.newChatIcon
              }
            >
              <Icon
                name="plus"
                size={17}
              />
            </span>

            {!sidebarCollapsed && (
              <span>
                New chat
              </span>
            )}
          </button>

          <div
            className={
              styles.navList
            }
          >
            {NAV_ITEMS.map(
              (item) => (
                <button
                  key={item.id}
                  className={
                    view ===
                      item.id
                      ? styles.navActive
                      : styles.navButton
                  }
                  onClick={() => {
                    setView(
                      item.id
                    );

                    if (
                      item.id ===
                      "chats"
                    ) {
                      setSearch(
                        ""
                      );
                    }
                  }}
                  title={
                    sidebarCollapsed
                      ? item.label
                      : undefined
                  }
                >
                  <span
                    className={
                      styles.navIcon
                    }
                  >
                    {item.icon}
                  </span>

                  {!sidebarCollapsed && (
                    <>
                      <span>
                        {
                          item.label
                        }
                      </span>

                      {item.id ===
                        "chats" &&
                        chats.length >
                          0 && (
                          <span
                            className={
                              styles.navBadge
                            }
                          >
                            {
                              chats.length >
                              99
                                ? "99+"
                                : chats.length
                            }
                          </span>
                        )}
                    </>
                  )}
                </button>
              )
            )}
          </div>
        </div>

        <div
          className={
            styles.sidebarBottom
          }
        >
          {!sidebarCollapsed && (
            <div
              className={
                styles.sidebarLabel
              }
            >
              SYSTEM
            </div>
          )}

          <button
            className={
              view === "settings"
                ? styles.navActive
                : styles.navButton
            }
            onClick={() =>
              openSettings(
                settingsSection
              )
            }
            title={
              sidebarCollapsed
                ? "Settings"
                : undefined
            }
          >
            <span
              className={
                styles.navIcon
              }
            >
              ⚙
            </span>

            {!sidebarCollapsed && (
              <span>
                Settings
              </span>
            )}
          </button>

          <div
            className={
              styles.systemCard
            }
          >
            <span
              className={
                styles.systemDot
              }
            />

            {!sidebarCollapsed && (
              <div>
                <strong>
                  System online
                </strong>
                <small>
                  OpenRouter connected
                </small>
              </div>
            )}
          </div>

          <button
            className={
              styles.collapseButton
            }
            onClick={() =>
              setSidebarCollapsed(
                (value) => !value
              )
            }
            title={
              sidebarCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >
            <span>
              {sidebarCollapsed
                ? "›"
                : "‹"}
            </span>

            {!sidebarCollapsed && (
              <span>
                Collapse
              </span>
            )}
          </button>
        </div>
      </aside>
    );
  }

  function renderChatHeader() {
    const title =
      activeChat?.title ??
      "New conversation";

    return (
      <div
        className={
          styles.chatHeader
        }
      >
        <div
          className={
            styles.chatHeaderTitle
          }
        >
          <span
            className={
              styles.chatHeaderDot
            }
          />

          <div>
            <span
              className={
                styles.chatHeaderEyebrow
              }
            >
              CIPHER OS
            </span>

            <h2>{title}</h2>
          </div>
        </div>

        <div
          className={
            styles.chatHeaderActions
          }
        >
          {statusMessage && (
            <span
              className={
                styles.statusToast
              }
            >
              {statusMessage}
            </span>
          )}

          {activeChat && (
            <>
              <button
                className={
                  styles.headerIconButton
                }
                onClick={() =>
                  beginRename(
                    activeChat
                  )
                }
                title="Rename conversation"
                aria-label="Rename conversation"
              >
                <Icon
                  name="edit"
                  size={16}
                />
              </button>

              <button
                className={`${styles.headerIconButton} ${styles.headerDanger}`}
                onClick={() =>
                  deleteChat(
                    activeChat.id
                  )
                }
                title="Delete conversation"
                aria-label="Delete conversation"
              >
                <Icon
                  name="trash"
                  size={16}
                />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  function renderWelcome() {
    return (
      <div
        className={
          styles.welcomeArea
        }
      >
        <div
          className={
            styles.welcomeOrb
          }
        >
          <span>C</span>
        </div>

        <div
          className={
            styles.welcomeEyebrow
          }
        >
          YOUR PERSONAL AI WORKSPACE
        </div>

        <h1>
          Think clearly.
          <br />
          <span>Build boldly.</span>
        </h1>

        <p>
          Cipher helps you learn,
          create, solve problems
          and turn ideas into
          useful outcomes.
        </p>

        <div
          className={
            styles.quickGrid
          }
        >
          {QUICK_ACTIONS.map(
            (action) => (
              <button
                key={action.title}
                className={
                  styles.quickCard
                }
                onClick={() =>
                  useQuickPrompt(
                    action.prompt
                  )
                }
              >
                <span
                  className={
                    styles.quickIcon
                  }
                >
                  {action.icon}
                </span>

                <span
                  className={
                    styles.quickCopy
                  }
                >
                  <strong>
                    {action.title}
                  </strong>
                  <small>
                    {
                      action.description
                    }
                  </small>
                </span>

                <span
                  className={
                    styles.quickArrow
                  }
                >
                  →
                </span>
              </button>
            )
          )}
        </div>
      </div>
    );
  }

  function renderMessage(
    current: Message,
    index: number
  ) {
    const isUser =
      current.role ===
      "user";

    return (
      <div
        key={current.id}
        className={`${styles.messageRow} ${
          isUser
            ? styles.userRow
            : styles.assistantRow
        } ${
          compactMessages
            ? styles.compactMessage
            : ""
        }`}
      >
        <div
          className={
            styles.messageAvatar
          }
        >
          {isUser
            ? "You"
            : "C"}
        </div>

        <div
          className={
            styles.messageBody
          }
        >
          <div
            className={
              styles.messageMeta
            }
          >
            <strong>
              {isUser
                ? "You"
                : "Cipher"}
            </strong>

            {showTimestamps && (
              <span>
                {formatTime(
                  current.timestamp
                )}
              </span>
            )}
          </div>

          <div
            className={
              styles.messageBubble
            }
          >
            <p>
              {current.content}
            </p>
          </div>

          {!isUser && (
            <div
              className={
                styles.messageTools
              }
            >
              <button
                onClick={() =>
                  copyMessage(
                    current.id,
                    current.content
                  )
                }
              >
                <Icon
                  name="copy"
                  size={13}
                />

                {copiedId ===
                current.id
                  ? "Copied"
                  : "Copy"}
              </button>

              <span>
                #{index + 1}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderChat() {
    const messages =
      activeChat?.messages ??
      [];

    return (
      <section
        className={
          styles.chatWorkspace
        }
      >
        {renderChatHeader()}

        <div
          className={
            styles.chatScroll
          }
        >
          {messages.length === 0 ? (
            renderWelcome()
          ) : (
            <div
              className={
                styles.messageList
              }
            >
              {messages.map(
                renderMessage
              )}

              {isTyping && (
                <div
                  className={`${styles.messageRow} ${styles.assistantRow}`}
                >
                  <div
                    className={
                      styles.messageAvatar
                    }
                  >
                    C
                  </div>

                  <div
                    className={
                      styles.messageBody
                    }
                  >
                    <div
                      className={
                        styles.messageMeta
                      }
                    >
                      <strong>
                        Cipher
                      </strong>
                      <span>
                        Thinking
                      </span>
                    </div>

                    <div
                      className={
                        styles.typingBubble
                      }
                    >
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                </div>
              )}

              <div
                ref={
                  bottomRef
                }
              />
            </div>
          )}
        </div>

        <div
          className={
            styles.composerDock
          }
        >
          <div
            className={
              styles.composer
            }
          >
            <textarea
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                    "Enter" &&
                  !event.shiftKey &&
                  enterToSend
                ) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Message Cipher..."
              rows={1}
              aria-label="Message Cipher"
            />

            <button
              className={
                styles.sendButton
              }
              onClick={() =>
                sendMessage()
              }
              disabled={
                !message.trim() ||
                isTyping
              }
              title="Send message"
              aria-label="Send message"
            >
              <Icon
                name="send"
                size={17}
              />
            </button>
          </div>

          <div
            className={
              styles.composerFooter
            }
          >
            <span>
              {enterToSend
                ? "Enter to send"
                : "Click send to submit"}
            </span>

            <span>
              Cipher can make mistakes.
            </span>
          </div>
        </div>
      </section>
    );
  }

  function renderChats() {
    return (
      <section
        className={
          styles.contentPage
        }
      >
        <div
          className={
            styles.pageIntro
          }
        >
          <div>
            <span
              className={
                styles.pageEyebrow
              }
            >
              CONVERSATIONS
            </span>

            <h1>
              Your chats
            </h1>

            <p>
              Search, revisit and
              manage your previous
              conversations.
            </p>
          </div>

          <button
            className={
              styles.primaryButton
            }
            onClick={
              createAndOpenChat
            }
          >
            <Icon
              name="plus"
              size={15}
            />
            New chat
          </button>
        </div>

        <div
          className={
            styles.searchBar
          }
        >
          <Icon
            name="search"
            size={17}
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search conversations"
            aria-label="Search conversations"
          />
        </div>

        <div
          className={
            styles.chatList
          }
        >
          {filteredChats.length ===
          0 ? (
            <div
              className={
                styles.noResults
              }
            >
              <div
                className={
                  styles.noResultsIcon
                }
              >
                ◌
              </div>

              <h3>
                {search
                  ? "No matches"
                  : "No conversations yet"}
              </h3>

              <p>
                {search
                  ? "Try a different search term."
                  : "Start your first conversation with Cipher."}
              </p>

              {!search && (
                <button
                  className={
                    styles.secondaryButton
                  }
                  onClick={
                    createAndOpenChat
                  }
                >
                  Start a conversation
                </button>
              )}
            </div>
          ) : (
            filteredChats.map(
              (chat) => (
                <div
                  key={chat.id}
                  className={
                    styles.chatListItem
                  }
                >
                  {editingChatId ===
                  chat.id ? (
                    <div
                      className={
                        styles.renameRow
                      }
                    >
                      <input
                        value={
                          editingTitle
                        }
                        autoFocus
                        onChange={(
                          event
                        ) =>
                          setEditingTitle(
                            event
                              .target
                              .value
                          )
                        }
                        onKeyDown={(
                          event
                        ) => {
                          if (
                            event.key ===
                            "Enter"
                          ) {
                            saveRename(
                              chat.id
                            );
                          }

                          if (
                            event.key ===
                            "Escape"
                          ) {
                            cancelRename();
                          }
                        }}
                      />

                      <button
                        onClick={() =>
                          saveRename(
                            chat.id
                          )
                        }
                        title="Save"
                      >
                        <Icon
                          name="check"
                          size={16}
                        />
                      </button>

                      <button
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
                          styles.chatListMain
                        }
                        onClick={() =>
                          openChat(
                            chat.id
                          )
                        }
                      >
                        <div
                          className={
                            styles.chatListIcon
                          }
                        >
                          ◌
                        </div>

                        <div
                          className={
                            styles.chatListText
                          }
                        >
                          <strong>
                            {
                              chat.title
                            }
                          </strong>

                          <div>
                            <span>
                              {
                                chat
                                  .messages
                                  .length
                              }{" "}
                              messages
                            </span>

                            <span>
                              •
                            </span>

                            <span>
                              {formatDate(
                                chat.updatedAt
                              )}
                            </span>
                          </div>
                        </div>

                        <Icon
                          name="chevron"
                          size={17}
                        />
                      </button>

                      <div
                        className={
                          styles.chatListActions
                        }
                      >
                        <button
                          onClick={() =>
                            beginRename(
                              chat
                            )
                          }
                          title="Rename"
                        >
                          <Icon
                            name="edit"
                            size={15}
                          />
                        </button>

                        <button
                          onClick={() =>
                            deleteChat(
                              chat.id
                            )
                          }
                          title="Delete"
                        >
                          <Icon
                            name="trash"
                            size={15}
                          />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            )
          )}
        </div>
      </section>
    );
  }

  function renderExplore() {
    return (
      <section
        className={
          styles.contentPage
        }
      >
        <div
          className={
            styles.pageIntro
          }
        >
          <div>
            <span
              className={
                styles.pageEyebrow
              }
            >
              EXPLORE
            </span>

            <h1>
              Everything in one workspace.
            </h1>

            <p>
              Cipher is designed to
              be more than a chat box.
            </p>
          </div>
        </div>

        <div
          className={
            styles.exploreHero
          }
        >
          <div>
            <span
              className={
                styles.exploreHeroLabel
              }
            >
              CIPHER OS
            </span>

            <h2>
              A focused place to
              think, create and
              build.
            </h2>

            <p>
              Use conversations as
              working sessions,
              revisit ideas later,
              and keep everything
              organized from one
              interface.
            </p>
          </div>

          <div
            className={
              styles.exploreOrb
            }
          >
            C
          </div>
        </div>

        <div
          className={
            styles.exploreGrid
          }
        >
          <div
            className={
              styles.exploreCard
            }
          >
            <span>
              01
            </span>
            <strong>
              Knowledge
            </strong>
            <p>
              Ask questions,
              understand concepts
              and learn through
              conversation.
            </p>
          </div>

          <div
            className={
              styles.exploreCard
            }
          >
            <span>
              02
            </span>
            <strong>
              Problem solving
            </strong>
            <p>
              Break complicated
              tasks into clear,
              manageable steps.
            </p>
          </div>

          <div
            className={
              styles.exploreCard
            }
          >
            <span>
              03
            </span>
            <strong>
              Technology
            </strong>
            <p>
              Work through code,
              architecture and
              technical ideas.
            </p>
          </div>

          <div
            className={
              styles.exploreCard
            }
          >
            <span>
              04
            </span>
            <strong>
              Creative work
            </strong>
            <p>
              Brainstorm, write,
              refine and develop
              ideas into something
              useful.
            </p>
          </div>
        </div>
      </section>
    );
  }

  function renderSettingRow({
    title,
    description,
    children,
  }: {
    title: string;
    description: string;
    children: React.ReactNode;
  }) {
    return (
      <div
        className={
          styles.settingRow
        }
      >
        <div
          className={
            styles.settingCopy
          }
        >
          <strong>
            {title}
          </strong>
          <span>
            {description}
          </span>
        </div>

        {children}
      </div>
    );
  }

  function renderToggle(
    enabled: boolean,
    onChange: () =>
      void
  ) {
    return (
      <button
        className={`${styles.toggle} ${
          enabled
            ? styles.toggleOn
            : ""
        }`}
        onClick={onChange}
        aria-pressed={enabled}
      >
        <span />
      </button>
    );
  }

  function renderSettings() {
    return (
      <section
        className={
          styles.settingsPage
        }
      >
        <div
          className={
            styles.settingsLayout
          }
        >
          <div
            className={
              styles.settingsNav
            }
          >
            <div
              className={
                styles.settingsHeading
              }
            >
              <span
                className={
                  styles.pageEyebrow
                }
              >
                CIPHER OS
              </span>

              <h1>
                Settings
              </h1>

              <p>
                Customize your
                workspace.
              </p>
            </div>

            <div
              className={
                styles.settingsMenu
              }
            >
              {SETTINGS_ITEMS.map(
                (item) => (
                  <button
                    key={
                      item.id
                    }
                    className={
                      settingsSection ===
                      item.id
                        ? styles.settingsMenuActive
                        : styles.settingsMenuButton
                    }
                    onClick={() =>
                      setSettingsSection(
                        item.id
                      )
                    }
                  >
                    <span>
                      {
                        item.icon
                      }
                    </span>
                    {
                      item.label
                    }
                  </button>
                )
              )}
            </div>
          </div>

          <div
            className={
              styles.settingsPanel
            }
          >
            {settingsSection ===
              "general" && (
              <>
                <div
                  className={
                    styles.settingsPanelHeader
                  }
                >
                  <h2>
                    General
                  </h2>
                  <p>
                    Basic controls for
                    how Cipher OS
                    behaves.
                  </p>
                </div>

                <div
                  className={
                    styles.settingsCard
                  }
                >
                  {renderSettingRow(
                    {
                      title:
                        "Notifications",
                      description:
                        "Allow Cipher OS to show workspace notifications.",
                      children:
                        renderToggle(
                          notifications,
                          () =>
                            setNotifications(
                              (
                                value
                              ) =>
                                !value
                            )
                        ),
                    }
                  )}

                  {renderSettingRow(
                    {
                      title:
                        "Enter to send",
                      description:
                        "Press Enter to send a message instead of creating a new line.",
                      children:
                        renderToggle(
                          enterToSend,
                          () =>
                            setEnterToSend(
                              (
                                value
                              ) =>
                                !value
                            )
                        ),
                    }
                  )}
                </div>

                <div
                  className={
                    styles.settingsCard
                  }
                >
                  <div
                    className={
                      styles.cardTitle
                    }
                  >
                    Workspace
                  </div>

                  {renderSettingRow(
                    {
                      title:
                        "Sidebar",
                      description:
                        "Choose how much navigation space you want.",
                      children: (
                        <button
                          className={
                            styles.selectButton
                          }
                          onClick={() =>
                            setSidebarCollapsed(
                              (
                                value
                              ) =>
                                !value
                            )
                          }
                        >
                          {sidebarCollapsed
                            ? "Compact"
                            : "Expanded"}
                        </button>
                      ),
                    }
                  )}
                </div>
              </>
            )}

            {settingsSection ===
              "appearance" && (
              <>
                <div
                  className={
                    styles.settingsPanelHeader
                  }
                >
                  <h2>
                    Appearance
                  </h2>

                  <p>
                    Make Cipher feel
                    right for your
                    workspace.
                  </p>
                </div>

                <div
                  className={
                    styles.themeGrid
                  }
                >
                  <button
                    className={`${styles.themeCard} ${
                      theme ===
                      "light"
                        ? styles.themeCardActive
                        : ""
                    }`}
                    onClick={() =>
                      updateTheme(
                        "light"
                      )
                    }
                  >
                    <div
                      className={
                        styles.themePreviewLight
                      }
                    >
                      <div />
                      <div />
                      <div />
                    </div>

                    <div
                      className={
                        styles.themeCardText
                      }
                    >
                      <strong>
                        Light
                      </strong>

                      <span>
                        Bright and
                        minimal
                      </span>
                    </div>

                    {theme ===
                      "light" && (
                      <span
                        className={
                          styles.themeCheck
                        }
                      >
                        <Icon
                          name="check"
                          size={15}
                        />
                      </span>
                    )}
                  </button>

                  <button
                    className={`${styles.themeCard} ${
                      theme ===
                      "dark"
                        ? styles.themeCardActive
                        : ""
                    }`}
                    onClick={() =>
                      updateTheme(
                        "dark"
                      )
                    }
                  >
                    <div
                      className={
                        styles.themePreviewDark
                      }
                    >
                      <div />
                      <div />
                      <div />
                    </div>

                    <div
                      className={
                        styles.themeCardText
                      }
                    >
                      <strong>
                        Dark
                      </strong>

                      <span>
                        Focused and
                        immersive
                      </span>
                    </div>

                    {theme ===
                      "dark" && (
                      <span
                        className={
                          styles.themeCheck
                        }
                      >
                        <Icon
                          name="check"
                          size={15}
                        />
                      </span>
                    )}
                  </button>
                </div>

                <div
                  className={
                    styles.settingsCard
                  }
                >
                  <div
                    className={
                      styles.cardTitle
                    }
                  >
                    Interface
                  </div>

                  {renderSettingRow(
                    {
                      title:
                        "Compact messages",
                      description:
                        "Reduce vertical spacing between chat messages.",
                      children:
                        renderToggle(
                          compactMessages,
                          () =>
                            setCompactMessages(
                              (
                                value
                              ) =>
                                !value
                            )
                        ),
                    }
                  )}

                  {renderSettingRow(
                    {
                      title:
                        "Show timestamps",
                      description:
                        "Display the time beside each message.",
                      children:
                        renderToggle(
                          showTimestamps,
                          () =>
                            setShowTimestamps(
                              (
                                value
                              ) =>
                                !value
                            )
                        ),
                    }
                  )}
                </div>
              </>
            )}

            {settingsSection ===
              "chat" && (
              <>
                <div
                  className={
                    styles.settingsPanelHeader
                  }
                >
                  <h2>
                    Chat
                  </h2>
                  <p>
                    Tune your
                    conversation
                    experience.
                  </p>
                </div>

                <div
                  className={
                    styles.settingsCard
                  }
                >
                  <div
                    className={
                      styles.cardTitle
                    }
                  >
                    Response behavior
                  </div>

                  <div
                    className={
                      styles.rangeBlock
                    }
                  >
                    <div
                      className={
                        styles.rangeHeader
                      }
                    >
                      <div>
                        <strong>
                          Creativity
                        </strong>
                        <span>
                          Controls how
                          varied the AI
                          responses can
                          be.
                        </span>
                      </div>

                      <strong>
                        {temperature.toFixed(
                          1
                        )}
                      </strong>
                    </div>

                    <input
                      className={
                        styles.rangeInput
                      }
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={
                        temperature
                      }
                      onChange={(
                        event
                      ) =>
                        setTemperature(
                          Number(
                            event
                              .target
                              .value
                          )
                        )
                      }
                    />

                    <div
                      className={
                        styles.rangeLabels
                      }
                    >
                      <span>
                        Precise
                      </span>
                      <span>
                        Balanced
                      </span>
                      <span>
                        Creative
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={
                    styles.settingsCard
                  }
                >
                  {renderSettingRow(
                    {
                      title:
                        "Local conversation history",
                      description:
                        "Keep conversations saved in this browser.",
                      children: (
                        <span
                          className={
                            styles.activePill
                          }
                        >
                          Active
                        </span>
                      ),
                    }
                  )}

                  {renderSettingRow(
                    {
                      title:
                        "History storage",
                      description:
                        "Current conversations are stored locally on this device.",
                      children: (
                        <span
                          className={
                            styles.storagePill
                          }
                        >
                          Local
                        </span>
                      ),
                    }
                  )}
                </div>
              </>
            )}

            {settingsSection ===
              "privacy" && (
              <>
                <div
                  className={
                    styles.settingsPanelHeader
                  }
                >
                  <h2>
                    Privacy
                  </h2>

                  <p>
                    Understand what is
                    stored by this
                    version of Cipher
                    OS.
                  </p>
                </div>

                <div
                  className={
                    styles.privacyBanner
                  }
                >
                  <div
                    className={
                      styles.privacyIcon
                    }
                  >
                    <Icon
                      name="shield"
                      size={21}
                    />
                  </div>

                  <div>
                    <strong>
                      Local-first
                      conversations
                    </strong>
                    <p>
                      Your current chat
                      history is stored
                      in your browser's
                      local storage.
                    </p>
                  </div>
                </div>

                <div
                  className={
                    styles.settingsCard
                  }
                >
                  {renderSettingRow(
                    {
                      title:
                        "Confirm before deleting",
                      description:
                        "Ask for confirmation before removing conversations.",
                      children:
                        renderToggle(
                          confirmDeleteChats,
                          () =>
                            setConfirmDeleteChats(
                              (
                                value
                              ) =>
                                !value
                            )
                        ),
                    }
                  )}
                </div>

                <div
                  className={
                    styles.dangerZone
                  }
                >
                  <div>
                    <div
                      className={
                        styles.cardTitle
                      }
                    >
                      Danger zone
                    </div>

                    <p>
                      Permanently remove
                      all conversations
                      stored on this
                      browser.
                    </p>
                  </div>

                  <button
                    className={
                      styles.dangerAction
                    }
                    onClick={
                      clearAllChats
                    }
                  >
                    Clear all chats
                  </button>
                </div>
              </>
            )}

            {settingsSection ===
              "about" && (
              <>
                <div
                  className={
                    styles.settingsPanelHeader
                  }
                >
                  <h2>
                    About Cipher OS
                  </h2>

                  <p>
                    Your personal AI
                    workspace.
                  </p>
                </div>

                <div
                  className={
                    styles.aboutCard
                  }
                >
                  <div
                    className={
                      styles.aboutBrand
                    }
                  >
                    C
                  </div>

                  <div>
                    <strong>
                      Cipher OS
                    </strong>

                    <p>
                      A focused AI
                      workspace built
                      for learning,
                      creativity,
                      problem solving
                      and technical
                      work.
                    </p>
                  </div>
                </div>

                <div
                  className={
                    styles.infoRows
                  }
                >
                  <div>
                    <span>
                      Version
                    </span>
                    <strong>
                      1.0
                    </strong>
                  </div>

                  <div>
                    <span>
                      AI provider
                    </span>
                    <strong>
                      OpenRouter
                    </strong>
                  </div>

                  <div>
                    <span>
                      Storage
                    </span>
                    <strong>
                      Local browser storage
                    </strong>
                  </div>

                  <div>
                    <span>
                      Interface
                    </span>
                    <strong>
                      Cipher OS Workspace
                    </strong>
                  </div>
                </div>

                <div
                  className={
                    styles.aboutNote
                  }
                >
                  <Icon
                    name="info"
                    size={17}
                  />
                  <span>
                    More account,
                    synchronization
                    and cloud
                    features can be
                    added as the
                    backend evolves.
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <main
      className={`${styles.appShell} ${
        theme === "light"
          ? styles.lightMode
          : styles.darkMode
      }`}
    >
      {renderSidebar()}

      <section
        className={
          styles.mainArea
        }
      >
        {view === "chat" &&
          renderChat()}

        {view === "chats" &&
          renderChats()}

        {view === "explore" &&
          renderExplore()}

        {view === "settings" &&
          renderSettings()}
      </section>
    </main>
  );
}