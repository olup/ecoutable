import { OpenAI } from "openai";
import { Resource } from "sst";

const openAI = new OpenAI({ apiKey: Resource.OpenAiApiKey.value });

export const askLlm = async (prompt: string, model = "gpt-4o-mini") => {
  const response = await openAI.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content;
};

export const describeImage = async (imageUrl: string, languageCode: string) => {
  const response = await openAI.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
            },
          },
          {
            type: "text",
            text: `Describe this image in one or two sentences. Start with : "The author inserted an image of...".
            Remember to use the following language : ${languageCode}`,
          },
        ],
      },
    ],
  });

  return response.choices[0].message.content;
};
