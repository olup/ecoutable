//eslint-disable

export function preprocessDom<T>(document: T): T {
  //@ts-ignore
  const headers = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
  headers.forEach((header: HTMLElement) => {
    // Remove classes and IDs, to overcome the 'negative regex'
    header.removeAttribute("class");
    header.removeAttribute("id");
    // Remove all child nodes, such as anchor divs (e.g., in Substack's case)
    const textContent = header.textContent || ""; // Ensure textContent is not null
    while (header.firstChild) {
      header.removeChild(header.firstChild);
    }
    // Add only text content
    header.textContent = textContent;
  });

  return document;
}
