interface Metadata {
  title?: string;
  description?: string;
  image?: string;
  locale?: string;
}

export function extractMetadata(document: Document): Metadata {
  const metadata: Metadata = {
    // Title: OG > Twitter > HTML
    title:
      document
        .querySelector('meta[property="og:title"]')
        ?.getAttribute("content") ||
      document
        .querySelector('meta[name="twitter:title"]')
        ?.getAttribute("content") ||
      document.querySelector("title")?.textContent ||
      undefined,

    // Description: OG > Twitter > HTML
    description:
      document
        .querySelector('meta[property="og:description"]')
        ?.getAttribute("content") ||
      document
        .querySelector('meta[name="twitter:description"]')
        ?.getAttribute("content") ||
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content") ||
      undefined,

    // Image: OG > Twitter
    image:
      document
        .querySelector('meta[property="og:image"]')
        ?.getAttribute("content") ||
      document
        .querySelector('meta[name="twitter:image"]')
        ?.getAttribute("content") ||
      undefined,

    // Locale: HTML
    locale:
      document
        .querySelector(`meta[property="og:locale"]`)
        ?.getAttribute("content")
        ?.slice(0, 2) ||
      document.querySelector(`html`)?.getAttribute("lang") ||
      undefined,
  };

  return metadata;
}
