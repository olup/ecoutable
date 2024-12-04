import { TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import * as jose from "jose";
import { appRouter } from "../trpc/routers/app";
import { getDb } from "../utils/db";
import { eq } from "drizzle-orm";
import { articles } from "../db/schema";

const jwksUrl = "https://auth.ecoutable.club/.well-known/jwks";

const app = new Hono();

app.get("/", (c) => c.text("Hello Hono!"));

app.get("/rss/:userUuid", async (c) => {
  const userUuid = c.req.param("userUuid");

  const dbArticles = await getDb().query.articles.findMany({
    where: eq(articles.userUuid, userUuid),
  });

  const rssItems = dbArticles
    .filter((a) => !!a.textAudioUrl)
    .map(
      (article) => `
      <item>
        <title>${article.title}</title>
        <link>${article.url}</link>
        <enclosure url="${article.textAudioUrl}" type="audio/mpeg" />
        <guid>${article.uuid}</guid>
        <pubDate>${new Date(article.createdAt).toUTCString()}</pubDate>
      </item>
    `
    )
    .join("");

  const rssFeed = `
    <rss version="2.0">
      <channel>
        <itunes:block>Yes<itunes:block>
        <title>Podcast RSS Feed</title>
        <link>https://yourdomain.com</link>
        <description>A podcast feed generated from articles</description>
        ${rssItems}
      </channel>
    </rss>
  `.trim();

  c.res.headers.set("Content-Type", "application/rss+xml");
  return c.body(rssFeed);
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
