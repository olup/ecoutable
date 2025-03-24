import { describe, it, expect, beforeEach } from "vitest";
import { EdgeTTS } from "./tts"; // Adjust the import path as necessary

describe("EdgeTTS", () => {
  let edgeTTS: EdgeTTS;

  beforeEach(() => {
    edgeTTS = new EdgeTTS({
      voice: "en-US-JessaNeural",
      lang: "en-US",
      outputFormat: "audio-24khz-48kbitrate-mono-mp3",
      saveSubtitles: false,
      rate: "default",
      pitch: "default",
      volume: "default",
      timeout: 10000,
    });
  });

  it("should resolve ttsPromise with valid text and audioPath", async () => {
    const text = `Initially, I thought this was quite a specific problem, but it happens to have industrial impacts too. How many ads can I fit on this newspaper page? How many shapes can I cut in this piece of wood? How many packages can I fit in the back of a delivery van? Thus, the 2D packing problem has been studied academically too.

The most valuable source I have found is this excellent survey from Jukka Jylänki. It presents 4 kinds of algorithms, and evaluates them in practice. Two of them stands out:

MAXRECTS if you know before-hand the rectangles to pack ("offline packings")
SKYLINE if you don't know ("online packings")
Offline packing is more optimal, because sorting the rectangles before packing helps considerably. It is however impossible for some scenarios. In my scenario, I want to cache the glyphs rasterized from a font, but I don't know before-hand all the glyphs which will be used with each font and each format (bold/italic/size...).

That's why I have settled on the skyline algorithm. That is also what uses stb_rect_pack.h, fontstash and thus nanovg.

This article explains the skyline algorithm and provides an implementation. The implementation is available online, in the public domain (UNLICENSE).`;

    const audio = await edgeTTS.ttsPromise(text);
    expect(audio).toBeDefined();
  });
}, 10000);
