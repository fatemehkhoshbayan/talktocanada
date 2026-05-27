/**
 * MediaRecorder helper. Tap once to start, tap again to stop, get a Blob.
 * Browsers vary on supported MIME types; we probe in priority order.
 */

export type RecorderHandle = {
  stop: () => Promise<Blob>;
  cancel: () => void;
};

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

function pickMime(): string | undefined {
  if (typeof window === "undefined") return undefined;
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const m of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return undefined;
}

export function isRecorderSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof MediaRecorder === "undefined") return false;
  return Boolean(navigator.mediaDevices);
}

export async function startRecording(): Promise<RecorderHandle> {
  if (!isRecorderSupported()) {
    throw new Error("MediaRecorder is not supported in this browser.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  const mimeType = pickMime();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: BlobPart[] = [];

  recorder.addEventListener("dataavailable", (e: BlobEvent) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  });

  recorder.start(250); // emit data chunks every 250ms so stop() resolves quickly

  let stopped = false;
  function shutdownStream() {
    for (const t of stream.getTracks()) t.stop();
  }

  return {
    stop: () =>
      new Promise<Blob>((resolve, reject) => {
        if (stopped) return reject(new Error("Recorder already stopped"));
        stopped = true;
        recorder.addEventListener(
          "stop",
          () => {
            shutdownStream();
            const blob = new Blob(chunks, {
              type: recorder.mimeType || mimeType || "audio/webm",
            });
            resolve(blob);
          },
          { once: true }
        );
        recorder.addEventListener(
          "error",
          (e: Event) => {
            shutdownStream();
            reject(e instanceof Error ? e : new Error("Recorder error"));
          },
          { once: true }
        );
        try {
          recorder.stop();
        } catch (err) {
          shutdownStream();
          reject(err instanceof Error ? err : new Error("stop() failed"));
        }
      }),
    cancel: () => {
      stopped = true;
      try {
        recorder.stop();
      } catch {
        /* ignore */
      }
      shutdownStream();
    },
  };
}
