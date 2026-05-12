import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://nexus-agent-kit.vercel.app"),
  title: {
    default: "Nexus | AI Agents Platform",
    template: "%s | Nexus"
  },
  description:
    "Nexus is a futuristic developer ecosystem to discover, orchestrate, and compose AI agents, skills, workflows, and automation pipelines.",
  keywords: [
    "AI Agents",
    "Developer Platform",
    "Multi-Agent Orchestration",
    "MCP",
    "DevOps Automation",
    "AI Engineering",
    "Nexus"
  ],
  openGraph: {
    title: "Nexus | Agentify Your Terminal",
    description: "Build autonomous engineering systems with composable AI agents, skills, and workflows.",
    type: "website",
    url: "https://nexus-agent-kit.vercel.app"
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus | AI Engineering OS",
    description: "Open-source operating system for AI engineering teams."
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Nexus",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  creator: {
    "@type": "Person",
    name: "Aayush Ostwal",
    url: "https://github.com/aayushostwal"
  },
  description:
    "A modern AI agents platform for discovering and orchestrating skills, workflows, and autonomous developer automation.",
  softwareHelp: {
    "@type": "CreativeWork",
    url: "https://nexus-agent-kit.vercel.app/docs"
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
