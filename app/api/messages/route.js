import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/authChecks";

// GET /api/messages?conversationId=xxx
export async function GET(request) {
  try {
    const { user, error } = await requireActiveUser();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      // Return all conversations for this user
      const conversations = await db.conversation.findMany({
        where: {
          OR: [{ studentId: user.id }, { alumniId: user.id }],
        },
        include: {
          student: true,
          alumni: true,
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { updatedAt: "desc" },
      });
      return NextResponse.json({ conversations });
    }

    // Verify user is part of this conversation
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || (conversation.studentId !== user.id && conversation.alumniId !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await db.message.findMany({
      where: { conversationId },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" },
    });

    // Mark messages as read
    await db.message.updateMany({
      where: { conversationId, senderId: { not: user.id }, read: false },
      data: { read: true },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/messages — send a message
export async function POST(request) {
  try {
    const { user, error } = await requireActiveUser();
    if (error) return error;

    const { conversationId, text } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    // Verify user is part of conversation
    const conversation = await db.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || (conversation.studentId !== user.id && conversation.alumniId !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await db.message.create({
      data: { conversationId, senderId: user.id, text: text.trim() },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    });

    // Update conversation timestamp
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Notify the other person
    const recipientId =
      conversation.studentId === user.id ? conversation.alumniId : conversation.studentId;

    await db.notification.create({
      data: {
        userId: recipientId,
        type: "NEW_MESSAGE",
        title: "New Message",
        message: `${user.name}: ${text.substring(0, 60)}${text.length > 60 ? "..." : ""}`,
        link: "/dashboard/messages",
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
