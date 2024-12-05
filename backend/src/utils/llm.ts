import { OpenAI } from "openai";
import { Resource } from "sst";

const openAI = new OpenAI({ apiKey: Resource.OpenAiApiKey.value });

export const askLlm = async (prompt: string, model = "gpt-4o-mini") => {
  const response = await openAI.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content;
};
