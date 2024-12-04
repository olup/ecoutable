import { config } from "dotenv";
config({
  path: ".env.local",
});

import {
  audioProcessor,
  getArticle,
  getMarkdownAst,
  processAstNode,
} from "../getArticle";
import { expect, test, it, describe } from "vitest";
import { writeFileSync } from "fs";

describe(
  "getArticle",
  () => {
    it("should return an article object", async () => {
      const article = await getArticle(
        "https://www.teachermagazine.com/au_en/articles/teacher-awards-2024-improving-health-and-wellbeing"
      );
      writeFileSync("testResults/test.md", article.markdownContent);

      const ast = await getMarkdownAst(article.markdownContent);
      writeFileSync("testResults/ast.json", JSON.stringify(ast));

      const blobs = await processAstNode(ast, null, audioProcessor);

      const audio = new Blob(blobs, { type: "audio/mpeg" });
      writeFileSync(
        "testResults/test.mp3",
        Buffer.from(await audio.arrayBuffer())
      );
      expect(audio).toBeTruthy();
    });
  },
  800 * 1000
);
