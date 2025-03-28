interface MarkdownChunk {
  type: "text" | "image";
  content: string;
}

export function splitMarkdownIntoChunks(markdown: string): MarkdownChunk[] {
  const lines = markdown.split("\n");
  const chunks: MarkdownChunk[] = [];
  let currentChunk: string[] = [];

  for (const line of lines) {
    const imageMatch = line.match(/!\[.*?\]\((.*?)\)/);

    if (imageMatch) {
      // If we have accumulated text, save it as a chunk
      if (currentChunk.length > 0) {
        chunks.push({
          type: "text",
          content: currentChunk.join("\n"),
        });
        currentChunk = [];
      }

      // Add the image as its own chunk
      chunks.push({
        type: "image",
        content: imageMatch[1], // The URL from the markdown image
      });
    } else {
      currentChunk.push(line);
    }
  }

  // Don't forget any remaining text
  if (currentChunk.length > 0) {
    chunks.push({
      type: "text",
      content: currentChunk.join("\n"),
    });
  }

  return chunks;
}
