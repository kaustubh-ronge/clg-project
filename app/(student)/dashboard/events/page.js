import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import EventsClient from "./EventsClient";

export default async function EventsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/onboarding");

  const events = await db.event.findMany({
    include: { attendees: { include: { user: { select: { id: true, name: true } } } } },
    orderBy: { date: "asc" },
  });

  const eventsWithRsvp = events.map((e) => ({
    ...e,
    isRsvped: e.attendees.some((a) => a.userId === user.id),
    attendeeCount: e.attendees.length,
  }));

  return <EventsClient events={eventsWithRsvp} isAdmin={user.role === "ADMIN"} />;
}
