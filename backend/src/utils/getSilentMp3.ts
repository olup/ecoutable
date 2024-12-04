const generateSilence = (durationMs: number, sampleRate = 24000): Buffer => {
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  return Buffer.alloc(numSamples * 2); // 16-bit PCM (2 bytes per sample)
};
