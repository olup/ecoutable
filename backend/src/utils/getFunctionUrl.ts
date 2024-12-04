import { VercelRequest } from "@vercel/node";

export const getFunctionUrl = (req: VercelRequest) => {
  // Get protocol (http or https) from the x-forwarded-proto header
  const protocol = req.headers["x-forwarded-proto"] || "http"; // Default to 'http' if not provided
  const host = req.headers.host; // Example: "your-vercel-project.vercel.app"
  const fullUrl = `${protocol}://${host}`; // Full URL of the request
  return fullUrl;
};
