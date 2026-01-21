import { useState, useEffect, useRef } from "react";
import { nanoid } from "nanoid";
import ChatFlowService from "./service/chatflow.service";
import "./assets/scss/_webInterFace.scss";
import "./assets/scss/_aiTutorLayout.scss";
import Chatbot from "./assets/Chat-icon.png";
import Agent from "./assets/live-agent-icon.png";
import { HiOutlineAcademicCap, HiOutlineBookOpen } from "react-icons/hi2";

import toast from "react-hot-toast";
import { BiSend } from "react-icons/bi";
import config from "./config.json";
import MediaRenderer from "./MediaRenderer";
import JSON5 from "json5";
import DOMPurify from "dompurify";
import { FiPaperclip, FiX } from "react-icons/fi";
import he from "he";

const SESSION_KEY = "chat_session_id";
const SESSION_TIMESTAMP_KEY = "chat_session_created_at";
const MAX_AGE_MS = 60 * 60 * 1000;

// const getOrCreateSessionId = (): string => {
//   const now = Date.now();
//   const existingId = localStorage.getItem(SESSION_KEY);
//   const createdAt = parseInt(
//     localStorage.getItem(SESSION_TIMESTAMP_KEY) || "0",
//     10,
//   );

//   if (existingId && now - createdAt < MAX_AGE_MS) {
//     return existingId;
//   }

//   const newId = nanoid(12);
//   localStorage.setItem(SESSION_KEY, newId);
//   localStorage.setItem(SESSION_TIMESTAMP_KEY, now.toString());
//   return newId;
// };

const checkAndResetSessionId = () => {
  const now = Date.now();
  const createdAt = parseInt(
    localStorage.getItem(SESSION_TIMESTAMP_KEY) || "0",
    10,
  );
  if (now - createdAt >= MAX_AGE_MS) {
    const newId = nanoid(12);
    localStorage.setItem(SESSION_KEY, newId);
    localStorage.setItem(SESSION_TIMESTAMP_KEY, now.toString());
  }
};

interface ButtonOption {
  label: string;
  payload: string;
}

interface Message {
  id: string;
  sender: "user" | "bot" | "agent";
  text: string;
  time: string;
  buttons?: ButtonOption[];
  media_url?: string;
  media_type?: string;
  media_caption?: string;
}
interface StatusMessage {
  index: number;
  text: string;
  position?: "before" | "after";
}

const ChatInterface = () => {
  const chatflowService = ChatFlowService();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const chatBodyRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const sessionIdRef = useRef<string>(nanoid(12));
  localStorage.setItem("chat_session_id", sessionIdRef.current);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [_unreadCount, setUnreadCount] = useState(0);
  const [hasFetchedInitial, setHasFetchedInitial] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [_isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const originalSessionId = useRef(localStorage.getItem(SESSION_KEY));
  const [_selectedPayload, _setSelectedPayload] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const [_statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
  const [_mediaLoader, setMediaLoader] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  let offset = 0;
  let allMessages: any[] = [];

  useEffect(() => {
    if (
      !originalSessionId.current ||
      originalSessionId.current === sessionIdRef.current
    ) {
      fetchHistory();
    }
    const interval = setInterval(checkAndResetSessionId, 1000);

    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  const stripPTags = (html: string): string => {
    return html.replace(
      /<li[^>]*>\s*<p[^>]*>(.*?)<\/p>\s*<\/li>/gi,
      "<li>$1</li>",
    );
  };

  let selectedVoice: SpeechSynthesisVoice | null = null;

  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();

    // Try to pick a female English voice
    selectedVoice =
      voices.find((v) => v.name.toLowerCase().includes("female")) ||
      voices.find((v) => v.name.toLowerCase().includes("woman")) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null;
  };

  // Load voices (some browsers load async)
  window.speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;

    const cleanText = text.replace(/<[^>]*>/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);

    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1.1;

    if (selectedVoice) utterance.voice = selectedVoice;

    // 🔹 When speech starts → show video
    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    // 🔹 When speech ends → hide video
    utterance.onend = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const decodeHtml = (html: string): string => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  const parseRawMessage = (raw: string) => {
    try {
      let cleaned = raw.trim();
      const parsed = JSON5.parse(cleaned);
      return parsed.map((entry: any) => ({
        message: decodeHtml(entry.message || ""),
        buttons: entry.buttons || [],
        media_url: entry.media_url,
        media_type: entry.media_type,
        media_caption: entry.caption || "",
      }));
    } catch (e) {
      return [];
    }
  };

  const fetchBotResponse = async (message: string, mediaType?: string) => {
    try {
      const payload: any = {
        session_id: sessionIdRef.current,
        message,
      };

      if (mediaType) {
        payload.media_type = mediaType;
      }

      const response = await chatflowService.chatflow(
        config.accountName,
        payload,
      );
      const botDataArray = response.data.response;

      const isProcessing =
        (Array.isArray(botDataArray) &&
          botDataArray[0] === "Message is being processed...") ||
        botDataArray === "Message is being processed...";

      if (isProcessing) {
        const loaderMessage: Message = {
          id: "loader",
          sender: "bot",
          text: "Loader",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        setMessages((prev) => {
          const withoutLoader = prev.filter((msg) => msg.id !== "loader");
          return [...withoutLoader, loaderMessage];
        });

        return;
      }

      setMessages((prev) => prev.filter((msg) => msg.id !== "loader"));

      if (Array.isArray(botDataArray)) {
        const newMessages: Message[] = botDataArray.map(
          (item: any): Message => {
            const isText = typeof item === "string";
            const msgContent = isText
              ? item
              : item.message || JSON.stringify(item);

            return {
              id: nanoid(12),
              sender: item.sender === "agent" ? "agent" : "bot",
              text: String(msgContent),
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              buttons:
                !isText && item.buttons
                  ? item.buttons.map((btn: any) => ({
                      label: btn.title,
                      payload: btn.payload,
                    }))
                  : undefined,
              media_url: !isText ? item.media_url : undefined,
              media_type: !isText ? item.media_type : undefined,
              media_caption: !isText ? item.media_caption : undefined,
            };
          },
        );
        setMessages((prev) => [...prev, ...newMessages]);
      } else if (typeof botDataArray === "string") {
        const newMessage: Message = {
          id: nanoid(12),
          sender: "bot",
          text: botDataArray,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, newMessage]);
      }

      await checkNotificationCount();
    } catch (error: any) {
      toast.error(error.response?.data?.message);
    }
  };
  const stripHtmlTags = (value: string): string => {
    const temp = document.createElement("div");
    temp.innerHTML = value;
    return temp.textContent || temp.innerText || "";
  };

  const handleSend = async (msgOverride?: string) => {
    setIsSending(true);

    // const content = msgOverride || input.trim();
    const rawContent = msgOverride || input;
    const content = stripHtmlTags(rawContent).trim();

    try {
      if (pendingFile) {
        const formData = new FormData();
        formData.append("files", pendingFile);
        formData.append("upload_type", "customer");
        formData.append("account_name", config.accountName);

        setMediaLoader(true);

        try {
          const response = await chatflowService.upload_media(formData);
          const { success, message, errors, data } = response.data;

          if (!success) {
            toast.error(errors || message || "Upload failed.");
            return;
          }

          const mediaUrl = data?.url;
          const extension = pendingFile.name.split(".").pop()?.toLowerCase();
          const mediaType = extension ? `.${extension}` : undefined;

          if (!mediaUrl) {
            toast.error("Upload succeeded but URL not returned.");
            return;
          }

          const userMessage: Message = {
            id: nanoid(12),
            sender: "user",
            text: pendingFile.name,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            media_url: mediaUrl,
            media_type: mediaType,
          };

          setMessages((prev) => [...prev, userMessage]);
          await fetchBotResponse(mediaUrl, mediaType);
          setInput("");
        } catch (error: any) {
          let errorMsg = "Failed to upload media.";
          if (error?.response?.data) {
            const errData = error.response.data;
            errorMsg = errData.errors || errData.message || errorMsg;
          }
          toast.error(errorMsg);
        } finally {
          setPendingFile(null);
          setFilePreviewUrl(null);
          setMediaLoader(false);
        }

        return;
      }

      if (!content) return;

      const userMessage: Message = {
        id: nanoid(12),
        sender: "user",
        text: content,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, userMessage]);
      if (!msgOverride) setInput("");
      await fetchBotResponse(content);
    } finally {
      setIsSending(false);
    }
  };

  const handleScroll = () => {
    if (!chatBodyRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatBodyRef.current;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      setIsAtBottom(true);
      setUnreadCount(0);
    } else {
      setIsAtBottom(false);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(checkNotificationCount, 3000);
    return () => clearInterval(intervalId);
  }, []);

  const checkNotificationCount = async () => {
    try {
      const response = await chatflowService.chatflow_notification(
        config.accountName,
        {
          params: { session_id: sessionIdRef.current },
        },
      );
      setCurrentStatus(response.data.current_state);
      const count = response.data.notification_count;
      if (count >= 1) await fetchHistory();
    } catch (error: any) {
      toast.error(error.response?.data?.message);
    }
  };

  const fetchHistory = async () => {
    const limit = 5;
    let hasNext = true;

    try {
      while (hasNext) {
        const response = await chatflowService.chatflow_history(
          config.accountName,
          {
            params: { session_id: sessionIdRef.current },
          },
          { limit, offset },
        );
        const historyArray = response.data.results;
        const newMessages: Message[] = [];

        for (const item of historyArray) {
          const utcDate = new Date(item.message_at + " UTC");
          const time = utcDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });

          if (item.sender === "human" && item.message?.trim()) {
            if (item.message.trim().includes("media_url")) {
              try {
                const parsed = JSON5.parse(item.message.trim());
                newMessages.push({
                  id: item.id.toString(),
                  sender: "user",
                  text: parsed.message ?? "",
                  time,
                  media_url: parsed.media_url,
                  media_type: parsed.media_type,
                  media_caption: parsed.caption,
                });
              } catch (e) {}
            } else {
              newMessages.push({
                id: item.id.toString(),
                sender: "user",
                text: item.message,
                time,
              });
            }
          }

          if (item.sender === "bot" || item.sender === "agent") {
            const raw = item.message?.trim();
            let handled = false;
            if (raw?.startsWith("[{")) {
              const parsedEntries = parseRawMessage(raw);
              if (parsedEntries.length) {
                parsedEntries.forEach((entry: any) => {
                  newMessages.push({
                    id: item.id.toString(),
                    sender: item.sender === "agent" ? "agent" : "bot",
                    text: entry.message || "",
                    time,
                    buttons: entry.buttons?.map((btn: any) => ({
                      label: btn.title,
                      payload: btn.payload,
                    })),
                    media_url: entry.media_url,
                    media_type: entry.media_type,
                    media_caption:
                      entry.caption || entry.media_caption || undefined,
                  });
                });
                handled = true;
              }
            } else if (item.message.trim().includes("media_url")) {
              try {
                const parsed = JSON5.parse(item.message.trim());
                newMessages.push({
                  id: item.id.toString(),
                  sender: item.sender === "agent" ? "agent" : "bot",
                  text: parsed.message ?? "",
                  time,
                  media_url: parsed.media_url,
                  media_type: parsed.media_type,
                  media_caption: parsed.caption,
                });
              } catch (e) {}
            }

            if (!handled && raw) {
              newMessages.push({
                id: item.id.toString(),
                sender: item.sender === "agent" ? "agent" : "bot",
                text: raw,
                time,
              });
            }
          }
        }

        if (response.data.next) {
          offset += limit;
        } else {
          hasNext = false;
        }
        const seenIds = new Set<string>();
        const combined = [...allMessages, ...newMessages];

        const uniqueMessages = combined.filter((msg) => {
          if (seenIds.has(msg.id)) return false;
          seenIds.add(msg.id);
          return true;
        });

        allMessages = uniqueMessages;
      }

      setMessages(allMessages);
    } catch (error: any) {
      toast.error(error.response?.data?.message);
    }
  };
  useEffect(() => {
    if (!hasFetchedInitial) setHasFetchedInitial(true);
    setTimeout(scrollToBottom, 100);
  }, []);

  // useEffect(() => {
  //   const lastMsg = messages[messages.length - 1];
  //   if (
  //     lastMsg &&
  //     (lastMsg.sender == "bot" || lastMsg.sender == "agent") &&
  //     lastMsg.id !== "loader"
  //   ) {
  //     speakText(lastMsg.text);
  //     if (isAtBottom) {
  //       scrollToBottom();
  //       setUnreadCount(0);
  //     } else {
  //       setUnreadCount((prev) => prev + 1);
  //     }
  //   } else {
  //     scrollToBottom();
  //     setUnreadCount(0);
  //   }
  // }, [messages]);

  // useEffect(() => {
  //   const handleBeforeUnload = () =>
  //     localStorage.setItem("chat_exit_type", "reload");
  //   window.addEventListener("beforeunload", handleBeforeUnload);
  //   return () => {
  //     const exitType = localStorage.getItem("chat_exit_type");
  //     if (exitType !== "reload") localStorage.removeItem("chat_session_id");
  //     localStorage.removeItem("chat_exit_type");
  //     window.removeEventListener("beforeunload", handleBeforeUnload);
  //   };
  // }, []);



const lastSpokenMessageIdRef = useRef<string | null>(null);

useEffect(() => {
  // find newest unread bot/agent message
  const newBotMessages = messages.filter(
    (msg) =>
      (msg.sender === "bot" || msg.sender === "agent") && msg.id !== "loader",
  );

  if (newBotMessages.length === 0) return;

  const lastMsg = newBotMessages[newBotMessages.length - 1];

  // avoid speaking same message twice
  if (lastSpokenMessageIdRef.current === lastMsg.id) return;

  lastSpokenMessageIdRef.current = lastMsg.id;

  // 🔊 Speak it
  speakText(lastMsg.text);

  if (isAtBottom) {
    scrollToBottom();
    setUnreadCount(0);
  } else {
    setUnreadCount((prev) => prev + 1);
  }
}, [messages]);





  const noUserMessages =
    messages.filter((m) => m.sender === "user").length === 0;

  const MAX_FILE_SIZE_MB = 50;

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      toast.error(`File size exceeds ${MAX_FILE_SIZE_MB} MB limit.`);
      setPendingFile(null);
      setFilePreviewUrl(null);
      event.target.value = "";
      return;
    }

    setPendingFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
  };

  const isUrl = (str: string): boolean => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const getCleanFileName = (fileName: string) => {
    return fileName
      .replace(/^\d{8}_\d{6}_/, "")
      .replace(/_\d{4}-\d{2}-\d{2}_to_\d{4}-\d{2}-\d{2}/, "");
  };

  useEffect(() => {
    if (currentStatus !== prevStatusRef.current) {
      const lastMsgIndex = messages.length - 1;

      if (currentStatus === "live_agent") {
        setStatusMessages((prev: any) => [
          ...prev,
          {
            index: lastMsgIndex,
            text: "Please hold on while we connect you to live agent…",
            position: "before",
          },
        ]);
      } else if (
        prevStatusRef.current === "live_agent" &&
        currentStatus === "chatbot"
      ) {
        setTimeout(() => {
          setStatusMessages((prev: any) => [
            ...prev,
            {
              index: messages.length,
              text: "Chat is handed over to bot",
              position: "after",
            },
          ]);
        }, 3000);
      }

      prevStatusRef.current = currentStatus;
    }
  }, [currentStatus]);

  return (
    <div className="ai-tutor-app">
      <header className="ai-topbar">
        <div className="ai-logo">
          <HiOutlineAcademicCap className="logo-icon" />

          <div className="logo-text">
            <span className="logo-title">AI Tutor</span>
            <h6 className="logo-subtitle">Let's learn together! 🚀</h6>
          </div>
        </div>

        <span>⚙️</span>
      </header>

      <div className="main-container">
        <aside className="ai-sidebar">
          <button className="new-chat-btn">+ Start New Chat</button>

          <div className="sidebar-section">
            <p className="sidebar-title">Pick a Subject</p>
            <ul>
              <li className="active"> 🔬 Science</li>
              <li>📐 Mathematics</li>
              <li>📖 Literature</li>
              <li>🌍 History</li>
            </ul>
          </div>

          <div className="sidebar-section">
            <p className="sidebar-title">Choose Lesson/Chapter</p>
            <div className="static-pill">Biology</div>
          </div>

          <div className="sidebar-section">
            <p className="sidebar-title"> 💭 Your Recent Chats</p>

            <div className="recent-chat-item">
              <div>
                <p className="chat-title"> What Is Photosynthesis ? </p>
                <h6 className="chat-date">Today</h6>
              </div>
            </div>
            <div className="recent-chat-item">
              <div>
                <p className="chat-title">
                  Help me to solve this Quadratic equation
                </p>
                <h6 className="chat-date">Yesterday</h6>
              </div>
            </div>
          </div>
        </aside>

        <main className="ai-main">
          {/* ===== Chat Area ===== */}

          <section className="ai-chat-container">
            <div className="chat-wrapper">
              <div
                className="chat-body"
                ref={chatBodyRef}
                onScroll={handleScroll}
              >
                {/* ===== Welcome Screen ===== */}
                {noUserMessages && (
                  <div className="welcome-screen">
                    <div className="welcome-icon">
                      <HiOutlineBookOpen />
                    </div>
                    <h2>Hey there! Ready to learn? 👋</h2>
                    <p>
                      I'm your friendly AI tutor, here to help you understand
                      anything! Ask me questions, get homework help, or practice
                      for your next test.
                    </p>

                    <div className="suggestions">
                      <div>💡 "Explain photosynthesis like I'm 10"</div>
                      <div>📐 "Help me solve x² + 5x + 6 = 0"</div>
                      <div>🎯 "Quiz me on the American Revolution"</div>
                    </div>

                    <div className="quick-actions">
                      <button disabled>✨ Explain this simply</button>
                      <button disabled>📝 Help with homework</button>
                      <button disabled>🎯 Quiz me!</button>
                    </div>
                  </div>
                )}

                {/* ===== Messages ===== */}
                {messages.map((msg, index) => {
                  const previousMessage = messages[index - 1];
                  const isSameSender =
                    previousMessage && previousMessage.sender === msg.sender;

                  const extractMinute = (time?: string) =>
                    time ? time.split(":").slice(0, 2).join(":") : null;

                  const currentMinute = extractMinute(msg.time);
                  const previousMinute = previousMessage
                    ? extractMinute(previousMessage.time)
                    : null;

                  const shouldShowHeader =
                    !isSameSender || currentMinute !== previousMinute;

                  return (
                    <div key={msg.id} className={`chat-message ${msg.sender}`}>
                      {msg.sender !== "user" && shouldShowHeader && (
                        <div className="bot-meta">
                          <img
                            src={msg.sender === "agent" ? Agent : Chatbot}
                            className="bot-avatar"
                          />
                          <span className="bot-agent-time">{msg.time}</span>
                        </div>
                      )}

                      {msg.sender === "user" && shouldShowHeader && (
                        <div className="user-meta">
                          <span className="time">{msg.time}</span>
                        </div>
                      )}

                      <div className="text">
                        {msg.text === "Loader" ? (
                          <div className="dot-loader">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        ) : msg.media_url && isUrl(msg.media_url) ? (
                          <MediaRenderer
                            media_type={msg.media_type || ""}
                            media_url={msg.media_url}
                            caption={msg.media_caption}
                            width="200px"
                          />
                        ) : (
                          <div
                            className="bot-text"
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(
                                stripPTags(he.decode(msg.text)).replace(
                                  /\n/g,
                                  "<br/>",
                                ),
                              ),
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {isSpeaking === true && (
                <div className="ai-speaking-overlay">
                  <video
                    src="/women_speaking.mp4"
                    autoPlay
                    muted
                    loop
                    className="ai-speaking-video"
                    height={"200px"}
                    width={"200px"}
                    
                  />
                </div>
              )}

              {/* ===== Input Bar ===== */}
              <div className="chat-input">
                <div className="input-container">
                  {filePreviewUrl && pendingFile && (
                    <div className="inline-preview">
                      <span>📄</span>
                      <span className="file-name">
                        {getCleanFileName(pendingFile.name)}
                      </span>
                      <button
                        className="cancel-btn"
                        onClick={() => {
                          setPendingFile(null);
                          setFilePreviewUrl(null);
                        }}
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    onChange={handleMediaUpload}
                  />

                  <input
                    className="message-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={pendingFile ? "" : "Write message here..."}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  />
                  <button
                    className="attach-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FiPaperclip size={18} />
                  </button>
                </div>

                <button className="send-btn" onClick={() => handleSend()}>
                  <BiSend />
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default ChatInterface;
