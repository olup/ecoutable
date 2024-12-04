import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import { remark } from "remark";
import { generateAudio } from "./tts";
import { MardownTypes } from "./markdownTypes";
import { Resource } from "sst";
import { askLlm } from "./llm";
import { extractMetadata } from "./extractMetadata";

const localChromePath =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const turndown = new TurndownService();
const isLocal = Resource.App.stage === "dev";
console.log("isLocal:", isLocal);

export const getArticle = async (url: string) => {
  // get url with puppeteer
  const browser = await puppeteer.launch({
    headless: chromium.headless,
    executablePath: isLocal ? localChromePath : await chromium.executablePath(),
    args: isLocal ? puppeteer.defaultArgs() : chromium.args,
  });
  const page = await browser.newPage();
  await page.goto(url);
  const articleHtml = await page.content();
  await browser.close();

  // get og metadata

  // use readability to parse the article
  const doc: Document = new JSDOM(articleHtml).window.document;

  const metadata = extractMetadata(doc);

  const readability = new Readability(doc);
  const article = readability.parse();
  if (!article) {
    throw new Error("Could not parse article");
  }

  const markdownContent = turndown.turndown(article.content);

  if (!article.lang) {
    const lang = await askLlm(
      `What is the language of this article: ${article.content.slice(
        0,
        100
      )}. Only output the language code, e.g. en`
    );
    article.lang = lang as string;
  }

  return {
    title: article.title,
    htmlContent: article.content,
    textContent: article.textContent,
    markdownContent,
    lang: metadata.locale || article.lang,
  };
};

export const getAstNodeTextContent = async (node: any): Promise<string> => {
  const { type, children, value } = node as any; // `children` is typical in remark AST
  if (value) return value;
  if (children && Array.isArray(children)) {
    const textContent = await Promise.all(
      children.map((child) => getAstNodeTextContent(child))
    );
    return textContent.join("");
  }
  return "";
};

export const processAstNode = async (
  node: any,
  parentBlockType: string | null
): Promise<{ type: string; content: string }[]> => {
  const blockArray: { type: string; content: string }[] = [];
  const { type, children } = node as any;

  if (type === "paragraph") {
    const textContent = await getAstNodeTextContent(node);
    blockArray.push({ type: "paragraph", content: textContent });
  }

  if (type === "heading") {
    const textContent = await getAstNodeTextContent(node);
    blockArray.push({ type: "heading", content: textContent });
  }

  if (children && Array.isArray(children)) {
    const blockType = `${parentBlockType}.${type}`;
    for (const child of children) {
      blockArray.push(...(await processAstNode(child, blockType)));
    }
  }

  return blockArray;
};
