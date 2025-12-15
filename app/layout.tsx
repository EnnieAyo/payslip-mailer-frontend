import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryProvider } from "@/contexts/QueryProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Payslip Mailer",
  description: "Employee payslip management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-dark-900 text-dark-900 dark:text-gray-100 transition-colors duration-200`}
      >
        <ThemeProvider>
          <SidebarProvider>
            <QueryProvider>
              <AuthProvider>
                  {children}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 5000,
                    className: '',
                    style: {},
                    success: {
                      style: {
                        background: 'var(--background)',
                        color: 'var(--foreground)',
                        border: '1px solid #FCD34D',
                      },
                      iconTheme: {
                        primary: '#FCD34D',
                        secondary: 'var(--background)',
                      },
                    },
                    error: {
                      style: {
                        background: 'var(--background)',
                        color: 'var(--foreground)',
                        border: '1px solid #EF4444',
                      },
                    },
                  }}
                />
              </AuthProvider>
            </QueryProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
