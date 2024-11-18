export const CHROMIUM_FULL_VERSION = "130.0.2849.68";
export const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const WINDOWS_FILE_TIME_EPOCH = 11644473600n;

async function generateSecMsGecToken() {
  const ticks =
    BigInt(Math.floor(Date.now() / 1000 + Number(WINDOWS_FILE_TIME_EPOCH))) *
    10000000n;
  const roundedTicks = ticks - (ticks % 3000000000n);

  const strToHash = `${roundedTicks}${TRUSTED_CLIENT_TOKEN}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(strToHash);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function mergeArrayBuffers(
  chunks: ArrayBuffer[],
  totalLength: number
): ArrayBuffer {
  const mergedBuffer = new Uint8Array(totalLength); // Create a typed array
  let offset = 0;

  for (const chunk of chunks) {
    mergedBuffer.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }

  return mergedBuffer.buffer; // Return as ArrayBuffer
}

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
    voice = "zh-CN-XiaoyiNeural",
    lang = "zh-CN",
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
      `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${generateSecMsGecToken()}&Sec-MS-GEC-Version=1-${CHROMIUM_FULL_VERSION}`
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

  async ttsPromise(text: string) {
    const _wsConnect = await this._connectWebSocket();
    return new Promise<ArrayBuffer>((resolve, reject) => {
      let audioChunks: ArrayBuffer[] = [];
      let totalLength = 0;

      let subFile: subLine[] = [];
      let timeout = setTimeout(() => reject("Timed out"), this.timeout);

      _wsConnect.onmessage = async (event) => {
        const data = event.data;
        if (typeof data === "string") {
          if (data.includes("Path:turn.end")) {
            _wsConnect.close();
            clearTimeout(timeout);
            resolve(mergeArrayBuffers(audioChunks, totalLength));
          } else if (data.includes("Path:audio.metadata")) {
            let splitTexts = data.split("\r\n");
            try {
              let metadata = JSON.parse(splitTexts[splitTexts.length - 1]);
              metadata["Metadata"].forEach((element: any) => {
                subFile.push({
                  part: element["Data"]["text"]["Text"],
                  start: Math.floor(element["Data"]["Offset"] / 10000),
                  end: Math.floor(
                    (element["Data"]["Offset"] + element["Data"]["Duration"]) /
                      10000
                  ),
                });
              });
            } catch {}
          }
        } else if (data instanceof Blob) {
          let reader = new FileReader();
          reader.onload = () => {
            let audioData = new Uint8Array(reader.result as ArrayBuffer);
            audioChunks.push(audioData);
            totalLength += audioData.length;
          };
          reader.readAsArrayBuffer(data);
        }
      };

      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      let requestId = Array.from(array, (byte) =>
        byte.toString(16).padStart(2, "0")
      ).join("");
      _wsConnect.send(
        `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n
      ` +
          `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${this.lang}">
        <voice name="${this.voice}">
          <prosody rate="${this.rate}" pitch="${this.pitch}" volume="${this.volume}">
            ${text}
          </prosody>
        </voice>
      </speak>`
      );
    });
  }
}

export { EdgeTTS };
