import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://nexus-ai.aayushostwal.com"),
  icons: {
    icon: [
      { url: "/logos/nexus.svg", type: "image/svg+xml" },
      { url: "/logos/nexus-logo.svg", type: "image/svg+xml" }
    ],
    shortcut: "/logos/nexus.svg",
    apple: "/logos/nexus-logo.svg"
  },
  title: {
    default: "Nexus | Engineering Workflows for Claude Code and Codex",
    template: "%s | Nexus"
  },
  description:
    "Open-source engineering skills and specialist guidance for Claude Code and Codex. Investigate issues, make focused fixes, verify changes, and prepare pull requests.",
  keywords: [
    "Claude Code",
    "Codex",
    "Agent Skills",
    "Engineering Workflows",
    "GitHub Issues",
    "Code Review",
    "Nexus"
  ],
  openGraph: {
    title: "Nexus | Engineering Workflows",
    description: "Reusable skills for issue investigation, verified fixes, and pull requests in Claude Code and Codex.",
    type: "website",
    url: "https://nexus-ai.aayushostwal.com"
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus | Engineering Workflows",
    description: "Open-source skills and specialist guidance for Claude Code and Codex."
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Nexus",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Cross-platform; requires a compatible AI host",
  creator: {
    "@type": "Person",
    name: "Aayush Ostwal",
    url: "https://github.com/aayushostwal"
  },
  description:
    "An open-source plugin toolkit with engineering skills for Claude Code and Codex, plus Claude-specific specialist agent definitions.",
  softwareHelp: {
    "@type": "CreativeWork",
    url: "https://nexus-ai.aayushostwal.com/docs"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}>
        <Providers>
          {children}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        </Providers>
      </body>
    </html>
  );
}
