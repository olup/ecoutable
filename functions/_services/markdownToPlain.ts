/**
 * Converts markdown text to plain text by removing markdown formatting.
 * For links, keeps only the text portion.
 * For images, removes them entirely.
 *
 * @param markdownText - The markdown text to convert
 * @returns Plain text with markdown formatting removed
 *
 * @example
 * markdownToPlain("**bold** and *italic*") // returns "bold and italic"
 * markdownToPlain("[link text](https://example.com)") // returns "link text"
 * markdownToPlain("![image alt](image.jpg)") // returns ""
 */
function markdownToPlain(markdownText: string): string {
  // Remove images with alt text - ![alt](url)
  let plainText = markdownText.replace(/!\[([^\]]*)\]\([^)]*\)/g, "");

  // Extract link text only - [text](url)
  plainText = plainText.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove bold and italic
  plainText = plainText
    .replace(/\*\*(.*?)\*\*/g, "$1") // **bold**
    .replace(/__(.*?)__/g, "$1") // __bold__
    .replace(/\*(.*?)\*/g, "$1") // *italic*
    .replace(/_(.*?)_/g, "$1"); // _italic_

  // Remove code blocks and inline code
  plainText = plainText
    .replace(/```[^\n]*\n(.*?)\n```/g, "$1") // Code blocks with language
    .replace(/```(.*?)```/g, "$1") // Code blocks without language
    .replace(/`([^`]+)`/g, "$1"); // Inline code

  // Remove headers
  plainText = plainText.replace(/#{1,6}\s+(.+)/g, "$1");

  // Remove blockquotes
  plainText = plainText.replace(/^\s*>\s+(.+)/gm, "$1");

  // Remove horizontal rules
  plainText = plainText.replace(/^\s*[-*_]{3,}\s*$/gm, "");

  // Convert unordered list items
  plainText = plainText.replace(/^\s*[-*+]\s+(.+)/gm, "$1");

  // Convert ordered list items
  plainText = plainText.replace(/^\s*\d+\.\s+(.+)/gm, "$1");

  // Remove extra whitespace
  plainText = plainText
    .replace(/\n{3,}/g, "\n\n") // Replace multiple newlines with double newline
    .trim(); // Remove leading/trailing whitespace

  return plainText;
}

export default markdownToPlain;
