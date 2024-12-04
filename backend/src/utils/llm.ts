import { OpenAI } from "openai";

const openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const askLlm = async (prompt: string, model = "gpt-4o-mini") => {
  const response = await openAI.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content;
};
