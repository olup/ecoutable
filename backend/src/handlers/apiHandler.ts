import { TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import * as jose from "jose";
import { appRouter } from "../trpc/routers/app";
import { getDb } from "../utils/db";
import { eq } from "drizzle-orm";
import { articles } from "../db/schema";
import { escapeXml } from "@/utils/escapeXml";

const jwksUrl = "https://auth.ecoutable.club/.well-known/jwks";

const app = new Hono();

app.get("/", (c) => c.text("Hello Hono!"));

app.get("/rss/:userUuid", async (c) => {
  const userUuid = c.req.param("userUuid");

  try {
    // Fetch articles from the database
    const dbArticles = await getDb().query.articles.findMany({
      where: eq(articles.userUuid, userUuid),
    });

    // Generate RSS items
    const rssItems = dbArticles
      .filter((article) => !!article.textAudioUrl) // Filter out articles without audio URLs
      .map((article) => {
        const title = escapeXml(article.title);
        const link = escapeXml(article.url);
        const enclosureUrl = escapeXml(article.textAudioUrl!);
        const pubDate = new Date(article.createdAt).toUTCString();

        return `
          <item>
            <title>${title}</title>
            <link>${link}</link>
            <enclosure url="${enclosureUrl}" type="audio/mpeg" />
            <guid>${article.uuid}</guid>
            <pubDate>${pubDate}</pubDate>
          </item>
        `.trim();
      })
      .join("");

    // Construct the RSS feed
    const rssFeed = `
      <rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
        <channel>
          <itunes:block>Yes</itunes:block>
          <title>Podcast RSS Feed</title>
          <link>https://app.ecoutable.club</link>
          <itunes:image href="https://api.dicebear.com/9.x/glass/png?seed=${userUuid}" />
          <itunes:category text="Technology" />
          <description>A podcast feed generated from articles</description>
          <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
          ${rssItems}
        </channel>
      </rss>
    `.trim();

    // Set response headers and return the RSS feed
    c.res.headers.set("Content-Type", "application/rss+xml; charset=utf-8");
    return c.body(rssFeed);
  } catch (error) {
    console.error("Error generating RSS feed:", error);
    return c.body("Internal server error", 500);
  }
});

app.use("/trpc/*", (c) =>
  fetchRequestHandler({
    endpoint: "/trpc",
    router: appRouter,
    req: c.req.raw,
    createContext: async ({ req }) => {
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.split(" ")[1];
      if (!token) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No token provided",
        });
      }
      const jwks = jose.createRemoteJWKSet(new URL(jwksUrl));
      const { payload } = await jose.jwtVerify(token, jwks).catch((err) => {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid token",
        });
      });

      const email = payload["email"] as string;
      return {
        db: getDb(),
        user: {
          email,
        },
      };
    },
  }).then((res) => c.body(res.body, res))
);

export const handler = handle(app);
