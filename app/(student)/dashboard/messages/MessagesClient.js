"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

function ConversationItem({ conv, currentUserId, isActive, onClick }) {
  const other = conv.studentId === currentUserId ? conv.alumni : conv.student;
  const lastMsg = conv.messages[0];
  const initials = other.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div
      onClick={onClick}
      style={{
        padding: "0.875rem 1rem", borderRadius: 12, cursor: "pointer",
        background: isActive ? "rgba(99,102,241,0.12)" : "transparent",
        border: isActive ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
        transition: "all 0.2s ease", display: "flex", alignItems: "center", gap: "0.75rem",
      }}
    >
      <div className="avatar" style={{ flexShrink: 0, fontSize: "0.85rem" }}>
        {other.avatarUrl
          ? <img src={other.avatarUrl} alt={other.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          : initials}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {other.name}
        </p>
        {lastMsg && (
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {lastMsg.senderId === currentUserId ? "You: " : ""}{lastMsg.text}
          </p>
        )}
      </div>
    </div>
  );
}

export default function MessagesClient({ conversations, currentUserId }) {
  const searchParams = useSearchParams();
  const initConvId = searchParams.get("conversationId");

  const [activeConvId, setActiveConvId] = useState(initConvId || conversations[0]?.id || null);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const otherUser = activeConv
    ? activeConv.studentId === currentUserId ? activeConv.alumni : activeConv.student
    : null;

  async function fetchMessages(convId) {
    if (!convId) return;
    const res = await fetch(`/api/messages?conversationId=${convId}`);
    const data = await res.json();
    if (data.messages) setMessages(data.messages);
  }

  useEffect(() => {
    if (!activeConvId) return;
    setLoadingMsgs(true);
    fetchMessages(activeConvId).finally(() => setLoadingMsgs(false));

    // Poll every 3 seconds for new messages
    pollRef.current = setInterval(() => fetchMessages(activeConvId), 3000);
    return () => clearInterval(pollRef.current);
  }, [activeConvId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !activeConvId || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConvId, text }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setText("");
      }
    } catch {
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  if (conversations.length === 0) {
    return (
      <div>
        <h1 className="section-title">Messages 💬</h1>
        <p className="section-subtitle">Your conversations with mentors/mentees.</p>
        <div className="empty-state" style={{ marginTop: "3rem" }}>
          <div className="empty-state-icon">💬</div>
          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary)" }}>No conversations yet</h3>
          <p style={{ fontSize: "0.875rem" }}>
            Conversations unlock after a mentorship request is accepted.{" "}
            <a href="/dashboard/mentors" style={{ color: "var(--brand-light)" }}>Find a mentor</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="section-title" style={{ marginBottom: "1.5rem" }}>Messages 💬</h1>
      <div className="glass" style={{ borderRadius: 16, display: "flex", height: "calc(100vh - 160px)", overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: 280, borderRight: "1px solid var(--border)", padding: "1rem", overflowY: "auto", flexShrink: 0 }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
            Conversations
          </p>
          {conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conv={conv}
              currentUserId={currentUserId}
              isActive={conv.id === activeConvId}
              onClick={() => setActiveConvId(conv.id)}
            />
          ))}
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Header */}
          {otherUser && (
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
              <div className="avatar" style={{ width: 36, height: 36, fontSize: "0.85rem", flexShrink: 0 }}>
                {otherUser.avatarUrl
                  ? <img src={otherUser.avatarUrl} alt={otherUser.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  : otherUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>{otherUser.name}</p>
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Mentor–Mentee Chat</p>
              </div>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: 8 }}>
            {loadingMsgs ? (
              <div style={{ display: "flex", justifyContent: "center", paddingTop: "2rem" }}>
                <div className="loading-spinner" />
              </div>
            ) : messages.length === 0 ? (
              <div className="empty-state" style={{ marginTop: "2rem" }}>
                <div className="empty-state-icon">👋</div>
                <p>No messages yet. Say hello!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.senderId === currentUserId;
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "70%", padding: "0.625rem 0.875rem", borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      background: isMine ? "linear-gradient(135deg, #6366f1, #a855f7)" : "rgba(255,255,255,0.07)",
                      color: isMine ? "white" : "var(--text-primary)",
                      fontSize: "0.875rem", lineHeight: 1.5,
                    }}>
                      {msg.text}
                      <div style={{ fontSize: "0.65rem", opacity: 0.7, marginTop: 3, textAlign: isMine ? "right" : "left" }}>
                        {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
            <input
              className="input"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={sending}
            />
            <button type="submit" className="btn-primary" disabled={!text.trim() || sending} style={{ flexShrink: 0 }}>
              {sending ? "..." : "Send →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
