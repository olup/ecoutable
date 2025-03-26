export type ChunkType = "text" | "title" | "image";

export interface Chunk {
  type: ChunkType;
  content: string;
}

export function splitMarkdownIntoChunks(markdown: string): Chunk[] {
  const chunks: Chunk[] = [];
  const lines = markdown.split("\n");
  let currentTextChunk = "";

  // First pass: collect all reference-style image definitions
  const imageRefs = new Map<string, string>();
  lines.forEach((line) => {
    const refMatch = line.match(/^\[([^\]]+)\]:\s*(.+)$/);
    if (refMatch) {
      const [, ref, url] = refMatch;
      imageRefs.set(ref, url.trim());
    }
  });

  const flushTextChunk = () => {
    if (currentTextChunk.trim()) {
      chunks.push({
        type: "text",
        content: currentTextChunk.trim(),
      });
      currentTextChunk = "";
    }
  };

  const processImage = (line: string): string | null => {
    // Check for inline image
    const inlineMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (inlineMatch) {
      return inlineMatch[2]; // Return the URL
    }

    // Check for reference-style image
    const refMatch = line.match(/!\[([^\]]*)\]\[([^\]]*)\]/);
    if (refMatch) {
      const ref = refMatch[2] || refMatch[1]; // If ref is empty, use alt text as ref
      return imageRefs.get(ref) || null;
    }

    return null;
  };

  for (const line of lines) {
    // Skip reference definitions as they've been processed
    if (line.match(/^\[([^\]]+)\]:\s*(.+)$/)) {
      continue;
    }

    // Check for title (headers)
    if (line.startsWith("#")) {
      flushTextChunk();
      chunks.push({
        type: "title",
        content: line.trim(),
      });
      continue;
    }

    // Check for image
    const imageUrl = processImage(line);
    if (imageUrl !== null) {
      // Changed condition to check explicitly for null
      // If we found a valid image
      flushTextChunk();
      if (imageUrl) {
        // Only add image chunk if URL was found (not undefined reference)
        chunks.push({
          type: "image",
          content: imageUrl,
        });
      }
      continue;
    }

    // Split text around undefined image references
    const refImageMatch = line.match(/!\[([^\]]*)\]\[([^\]]*)\]/);
    if (refImageMatch && !imageUrl) {
      const parts = line.split(refImageMatch[0]);
      if (parts[0]) {
        currentTextChunk += (currentTextChunk ? "\n" : "") + parts[0];
      }
      flushTextChunk();
      if (parts[1]) {
        currentTextChunk = parts[1];
      }
      continue;
    }

    // If it's not a header or image, add to current text chunk
    if (line.trim()) {
      currentTextChunk += (currentTextChunk ? "\n" : "") + line;
    } else if (currentTextChunk) {
      // Empty line after text content - flush the chunk
      flushTextChunk();
    }
  }

  // Flush any remaining text
  flushTextChunk();

  return chunks;
}
