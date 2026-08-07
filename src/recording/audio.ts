import Gio from "gi://Gio";
import GLib from "gi://GLib";

export function recordAudio(outPath: string): () => Promise<void> {
  let proc: Gio.Subprocess | null = new Gio.Subprocess({
    argv: ["pw-record", "--rate=16000", "--channels=1", outPath],
    flags: Gio.SubprocessFlags.NONE,
  });

  proc.init(null);

  return () =>
    new Promise<void>((resolve) => {
      if (!proc) {
        resolve();
        return;
      }

      const finishedProc = proc;
      proc = null;

      finishedProc.send_signal(2);

      finishedProc.wait_check_async(null, (source, result) => {
        try {
          source!.wait_check_finish(result);
        } catch {
          // pw-record exits non-zero when killed by SIGINT, that's expected
        }

        fixWavHeader(outPath);
        resolve();
      });
    });
}

// pw-record writes placeholder RIFF/data chunk sizes upfront and only
// patches them on a clean exit; SIGINT doesn't reliably trigger that,
// leaving whisper.cpp's WAV reader seeing a 0-byte data chunk.
function fixWavHeader(path: string) {
  const file = Gio.File.new_for_path(path);
  const size = file.query_info(
    "standard::size",
    Gio.FileQueryInfoFlags.NONE,
    null,
  ).get_size();

  const stream = file.open_readwrite(null);
  const output = stream.get_output_stream();

  const riffSize = new Uint8Array(4);
  new DataView(riffSize.buffer).setUint32(0, size - 8, true);
  stream.seek(4, GLib.SeekType.SET, null);
  output.write(riffSize, null);

  const dataSize = new Uint8Array(4);
  new DataView(dataSize.buffer).setUint32(0, size - 44, true);
  stream.seek(40, GLib.SeekType.SET, null);
  output.write(dataSize, null);

  stream.close(null);
}
