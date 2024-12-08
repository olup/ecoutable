import { unescapeXml } from "./escapeXml";
import WebSocket from "ws";

export const CHROMIUM_FULL_VERSION = "130.0.2849.68";
export const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";

type subLine = {
  part: string;
  start: number;
  end: number;
};

type configure = {
  voice?: string;
  lang?: string;
  outputFormat?: string;
  saveSubtitles?: boolean;
  rate?: string;
  pitch?: string;
  volume?: string;
  timeout?: number;
};

class EdgeTTS {
  private voice: string;
  private lang: string;
  private outputFormat: string;
  private saveSubtitles: boolean;
  private rate: string;
  private pitch: string;
  private volume: string;
  private timeout: number;

  constructor({
    voice = "en-US-EricNeural",
    lang = "en-US",
    outputFormat = "audio-24khz-48kbitrate-mono-mp3",
    saveSubtitles = false,
    rate = "default",
    pitch = "default",
    volume = "default",
    timeout = 10000,
  }: configure = {}) {
    this.voice = voice;
    this.lang = lang;
    this.outputFormat = outputFormat;
    this.saveSubtitles = saveSubtitles;
    this.rate = rate;
    this.pitch = pitch;
    this.volume = volume;
    this.timeout = timeout;
  }

  async _connectWebSocket(): Promise<WebSocket> {
    const wsConnect = new WebSocket(
      `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`
    );

    return new Promise((resolve, reject) => {
      wsConnect.onopen = () => {
        wsConnect.send(`Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n
          {
            "context": {
              "synthesis": {
                "audio": {
                  "metadataoptions": {
                    "sentenceBoundaryEnabled": "false",
                    "wordBoundaryEnabled": "true"
                  },
                  "outputFormat": "${this.outputFormat}"
                }
              }
            }
          }
        `);
        resolve(wsConnect);
      };

      wsConnect.onerror = (error) => {
        reject(error);
      };
    });
  }

  async ttsPromise(text: string, params?: GenerateAudioParams) {
    const _wsConnect = await this._connectWebSocket();
    console.log("connected to websocket, tts starting", params?.voice);

    return new Promise<Blob>((resolve, reject) => {
      let audioChunks: ArrayBuffer[] = [];

      _wsConnect.onclose = (event) => {
        console.log("websocket closed", event);
        reject("Websocket closed");
      };

      _wsConnect.onerror = (error) => {
        console.log("websocket error", error);
        reject(error);
      };

      _wsConnect.addEventListener("message", async (message) => {
        if (typeof message.data !== "string") {
          const blob = new Blob([message.data as BlobPart]);

          const separator = "Path:audio\r\n";
          const bytes = new Uint8Array(await blob.arrayBuffer());
          const binaryString = new TextDecoder().decode(bytes);

          const index = binaryString.indexOf(separator) + separator.length;
          const audioData = bytes.subarray(index);
          return audioChunks.push(audioData);
        }

        // if (message.data.includes("Path:audio.metadata")) {
        //   const jsonString = message.data
        //     .split("Path:audio.metadata")[1]
        //     .trim();
        //   const json = JSON.parse(jsonString) as AudioMetadata;

        //   return subtitleChunks.push(json);
        // }

        if (message.data.includes("Path:turn.end")) {
          console.log("received turn end, sending audio");
          _wsConnect.onclose = null;
          _wsConnect.close();
          return resolve(new Blob(audioChunks));
        }
        // return resolve({
        //   audio: new Blob(audioChunks),
        //   subtitle: parseSubtitle({
        //     metadata: subtitleChunks,
        //     ...subtitle,
        //   }),
        // });
      });

      const requestId = globalThis.crypto.randomUUID();

      const requestString = `
      X-RequestId:${requestId}\r\n
      Content-Type:application/ssml+xml\r\n
      Path:ssml\r\n\r\n
    
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${
        params?.lang || this.lang
      }">
        <voice name="${params?.voice || this.voice}">
          <prosody rate="${params?.rate || this.rate}" pitch="${
        params?.pitch || this.pitch
      }" volume="${params?.volume || this.volume}">
            ${unescapeXml(text)}
          </prosody>
        </voice>
      </speak>
      `;

      _wsConnect.send(requestString);
      console.log("sent text to websocket");
    });
  }
}

export { EdgeTTS };

const tts = new EdgeTTS();

type GenerateAudioParams = {
  speed?: number;
  pitch?: number;
  volume?: number;
  rate?: number;
  voice?: string;
  lang?: string;
};
export const generateAudio = async (
  text: string,
  params?: GenerateAudioParams
) => {
  const audioBlob = await tts.ttsPromise(text, params);
  return audioBlob;
};
