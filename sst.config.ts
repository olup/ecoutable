/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "readability",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",

      providers: {
        aws: {
          profile: "olup",
        },
      },
    };
  },
  async run() {
    const dbUrl = new sst.Secret("DbUrl");

    const openAiApiKey = new sst.Secret("OpenAiApiKey");

    const bucket = new sst.aws.Bucket("ecoutable", {
      access: "public",
    });

    const queue = new sst.aws.Queue("audioWorkerQueue", {});
    queue.subscribe({
      handler: "backend/src/handlers/audioWorkerHandler.handler",
      link: [bucket, openAiApiKey, dbUrl],
      nodejs: {
        install: [
          "jsdom",
          "puppeteer-core",
          "@sparticuz/chromium",
          "turndown",
          "ws",
          "@mozilla/readability",
        ],
        esbuild: {
          keepNames: true,
        },
      },
      layers: ["arn:aws:lambda:eu-central-1:241533134273:layer:ffmpeg:1"],
      environment: {
        isDev: $dev ? "true" : "false",
      },
    });

    const api = new sst.aws.Function("myFunction", {
      handler: "backend/src/handlers/apiHandler.handler",
      url: true,
      nodejs: {
        install: [
          "jsdom",
          "puppeteer-core",
          "@sparticuz/chromium",
          "turndown",
          "ws",
          "@mozilla/readability",
        ],
        esbuild: {
          keepNames: true,
        },
      },
      link: [bucket, queue, openAiApiKey, dbUrl],
      environment: {
        isDev: $dev ? "true" : "false",
      },
    });

    new sst.aws.StaticSite("myStaticSite", {
      path: "frontend",
      build: { command: "npm run build", output: "dist" },
      dev: { command: "npm run dev" },
      domain: "app.ecoutable.club",
      environment: {
        VITE_API_URL: api.url,
      },
    });
  },
});
