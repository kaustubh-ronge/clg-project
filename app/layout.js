import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "EduBridge — Alumni Mentorship Platform",
  description:
    "Connect with verified alumni mentors, discover internships, and accelerate your career through AI-powered mentorship matching.",
  keywords: ["mentorship", "alumni", "students", "internships", "networking"],
};

import FetchInterceptor from "@/components/FetchInterceptor";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.className}>
        <body>
          <FetchInterceptor />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}