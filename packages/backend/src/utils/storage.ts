import { File } from "@google-cloud/storage";

export async function generateSignedUrl(
  file: File,
  expiresInSeconds: number = 60 * 5 // default: 5 minutes
): Promise<string> {
  const options = {
    version: "v4" as const,
    action: "read" as const, // or 'write', 'delete'
    expires: Date.now() + expiresInSeconds * 1000,
  };

  const [url] = await file.getSignedUrl(options);

  return url;
}
