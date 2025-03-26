import { describe, test, expect } from "vitest";
import { splitMarkdownIntoChunks, type Chunk } from "./article";

describe("splitMarkdownIntoChunks", () => {
  test("should handle basic text chunks", () => {
    const markdown = "This is a paragraph.\n\nThis is another paragraph.";
    const expected: Chunk[] = [
      { type: "text", content: "This is a paragraph." },
      { type: "text", content: "This is another paragraph." },
    ];
    expect(splitMarkdownIntoChunks(markdown)).toEqual(expected);
  });

  test("should process titles (headers)", () => {
    const markdown = "# Main Title\n## Subtitle\nSome text\n### Another level";
    const expected: Chunk[] = [
      { type: "title", content: "# Main Title" },
      { type: "title", content: "## Subtitle" },
      { type: "text", content: "Some text" },
      { type: "title", content: "### Another level" },
    ];
    expect(splitMarkdownIntoChunks(markdown)).toEqual(expected);
  });

  test("should handle inline images", () => {
    const markdown =
      "Some text\n![Alt text](http://example.com/image.jpg)\nMore text";
    const expected: Chunk[] = [
      { type: "text", content: "Some text" },
      { type: "image", content: "http://example.com/image.jpg" },
      { type: "text", content: "More text" },
    ];
    expect(splitMarkdownIntoChunks(markdown)).toEqual(expected);
  });

  test("should process reference-style images", () => {
    const markdown =
      "Start\n![Alt text][img1]\nMiddle\n![Another][img2]\nEnd\n[img1]: http://example.com/1.jpg\n[img2]: http://example.com/2.jpg";
    const expected: Chunk[] = [
      { type: "text", content: "Start" },
      { type: "image", content: "http://example.com/1.jpg" },
      { type: "text", content: "Middle" },
      { type: "image", content: "http://example.com/2.jpg" },
      { type: "text", content: "End" },
    ];
    expect(splitMarkdownIntoChunks(markdown)).toEqual(expected);
  });

  test("should handle mixed content", () => {
    const markdown =
      "# Title\nParagraph 1\n\n## Subtitle\n![Image](test.jpg)\nParagraph 2";
    const expected: Chunk[] = [
      { type: "title", content: "# Title" },
      { type: "text", content: "Paragraph 1" },
      { type: "title", content: "## Subtitle" },
      { type: "image", content: "test.jpg" },
      { type: "text", content: "Paragraph 2" },
    ];
    expect(splitMarkdownIntoChunks(markdown)).toEqual(expected);
  });

  test("should handle empty string", () => {
    expect(splitMarkdownIntoChunks("")).toEqual([]);
  });

  test("should handle whitespace-only string", () => {
    expect(splitMarkdownIntoChunks("   \n  \n  ")).toEqual([]);
  });

  test("should handle image reference with empty alt text", () => {
    const markdown = "![](http://example.com/image.jpg)";
    const expected: Chunk[] = [
      { type: "image", content: "http://example.com/image.jpg" },
    ];
    expect(splitMarkdownIntoChunks(markdown)).toEqual(expected);
  });

  test("should handle multiple reference images with shared definitions", () => {
    const markdown =
      "![First][ref]\n![Second][ref]\n[ref]: http://example.com/shared.jpg";
    const expected: Chunk[] = [
      { type: "image", content: "http://example.com/shared.jpg" },
      { type: "image", content: "http://example.com/shared.jpg" },
    ];
    expect(splitMarkdownIntoChunks(markdown)).toEqual(expected);
  });

  test("should ignore undefined reference images", () => {
    const markdown = "Text\n![Missing][notfound]\nMore text";
    const expected: Chunk[] = [
      { type: "text", content: "Text" },
      { type: "text", content: "More text" },
    ];
    expect(splitMarkdownIntoChunks(markdown)).toEqual(expected);
  });
});
