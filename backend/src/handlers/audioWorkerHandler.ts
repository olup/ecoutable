import { SQSEvent } from "aws-lambda";
import generateAudioForArticle from "../utils/generateAudio";

export const handler = async (event: SQSEvent) => {
  try {
    console.log("event", event);
    const { Records } = event;
    for (const record of Records) {
      const { body } = record;
      const { articleUuid } = JSON.parse(body);
      await generateAudioForArticle(articleUuid);
    }
  } catch (error) {
    console.log("error", error);
  }

  // always acknowledge the message
  return {};
};
