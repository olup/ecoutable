import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const generateCompletion = async (prompt: string) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Failed to generate completion", error);
    return null;
  }
};

export const describeImage = async (imageUrl: string) => {
  try {
    console.log("Describing image with URL:", imageUrl);
    const mimetype = imageUrl.split(".").pop();
    if (mimetype !== "jpg" && mimetype !== "jpeg" && mimetype !== "png") {
      throw new Error("Invalid image format");
    }

    const imageArray = await fetch(imageUrl).then((response) =>
      response.arrayBuffer()
    );
    const base64String = Buffer.from(imageArray).toString("base64");
    const b64dataUrl = `data:image/${mimetype};base64,${base64String}`;

    const response = await openai.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: b64dataUrl,
              },
            },
            {
              type: "text",
              text: `This is an image, describe it in two sentences. 
            Start with something like "here the author added an image of" but feel free to variate.
            End with something like "And now back to the article.", but feel free to variate.
            `,
            },
          ],
        },
      ],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Failed to describe image", imageUrl, error);
    return `Note from the reader: An image was inserted here, but I couldn't describe it.`;
  }
};
