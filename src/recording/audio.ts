import Gio from "gi://Gio";

export function recordAudio(outPath: string): () => void {
  let proc: Gio.Subprocess | null = new Gio.Subprocess({
    argv: ["pw-record", "--rate=16000", "--channels=1", outPath],
    flags: Gio.SubprocessFlags.NONE,
  });

  proc.init(null);
  proc.wait_check_async(null, null);

  return () => {
    if (!proc) return;
    proc.send_signal(2);
    proc = null;
  };
}
