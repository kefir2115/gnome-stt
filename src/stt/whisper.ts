import Gio from "gi://Gio";

// whisper-cpp emits non-speech markers for silence/music/etc, e.g. "[Music]",
// "[BLANK_AUDIO]", "(applause)" - strip those out of the final transcript.
const NON_SPEECH_TAG = /[[(][^\])]*[\])]/g;

export function transcribe(
  audioPath: string,
  binDir: string,
  callback: (text: string) => void,
) {
  const proc = new Gio.Subprocess({
    argv: [
      `${binDir}/bin/whisper-cpp`,
      "-m",
      `${binDir}/bin/ggml-base.bin`,
      "-f",
      audioPath,
      "-np",
      "-nt",
    ],
    flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_SILENCE,
  });

  proc.init(null);

  proc.communicate_utf8_async(null, null, (source, result) => {
    const [, stdout] = source!.communicate_utf8_finish(result);
    callback(cleanTranscript(stdout));
  });
}

function cleanTranscript(text: string): string {
  return text
    .replace(NON_SPEECH_TAG, "")
    .replace(/\s+/g, " ")
    .trim();
}
