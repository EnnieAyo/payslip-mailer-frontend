import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryProvider } from "@/contexts/QueryProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { Toaster } from "react-hot-toast";
import { generateOrganizationSchema } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: process.env.NEXT_PUBLIC_APP_NAME || "Payslip Mailer",
    template: `%s | ${process.env.NEXT_PUBLIC_APP_NAME || "Payslip Mailer"}`,
  },
  description: "Secure and efficient employee payslip management system. Upload, manage, and distribute payslips to employees via email with automated batch processing.",
  keywords: ["payslip management", "employee management", "payroll system", "payslip distribution", "HR management", "employee payslips"],
  authors: [{ name: process.env.NEXT_PUBLIC_APP_NAME || "Payslip Mailer" }],
  creator: process.env.NEXT_PUBLIC_APP_NAME || "Payslip Mailer",
  publisher: process.env.NEXT_PUBLIC_APP_NAME || "Payslip Mailer",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    title: process.env.NEXT_PUBLIC_APP_NAME || "Payslip Mailer",
    description: "Secure and efficient employee payslip management system",
    siteName: process.env.NEXT_PUBLIC_APP_NAME || "Payslip Mailer",
  },
  twitter: {
    card: "summary",
    title: process.env.NEXT_PUBLIC_APP_NAME || "Payslip Mailer",
    description: "Secure and efficient employee payslip management system",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = generateOrganizationSchema();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
      </head>
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
