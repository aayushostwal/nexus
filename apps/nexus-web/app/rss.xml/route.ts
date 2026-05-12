export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Nexus Platform Updates</title>
    <link>https://nexus-agent-kit.vercel.app</link>
    <description>Latest Nexus docs and platform updates.</description>
    <item>
      <title>Nexus Skills and Agents Marketplace</title>
      <link>https://nexus-agent-kit.vercel.app</link>
      <description>Explore installable skills, specialist agents, and token-efficient AI terminal workflows.</description>
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
