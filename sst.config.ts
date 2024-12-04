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
    const dbUrl = new sst.Secret("DbUrl", process.env.DATABASE_URL!);

    const openAiApiKey = new sst.Secret(
      "OpenAiApiKey",
      process.env.OPENAI_API_KEY!
    );

    const bucket = new sst.aws.Bucket("ecoutable", {
      access: "public",
    });

    const queue = new sst.aws.Queue("audioWorkerQueue", {});
    queue.subscribe({
      handler: "backend/src/handlers/audioWorkerHandler.handler",
      link: [bucket],
      environment: {
        DATABASE_URL: dbUrl.value,
        OPENAI_API_KEY: openAiApiKey.value,
      },
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
      link: [bucket, queue],
      environment: {
        DATABASE_URL: dbUrl.value,
        OPENAI_API_KEY: openAiApiKey.value,
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
