export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Nexus Platform Updates</title>
    <link>https://nexus-agent-kit.vercel.app</link>
    <description>Latest Nexus docs and platform updates.</description>
    <item>
      <title>Nexus Documentation Portal</title>
      <link>https://nexus-agent-kit.vercel.app/docs</link>
      <description>Explore getting started, workflows, guardrails, and orchestration guides.</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8"
    }
  });
}
