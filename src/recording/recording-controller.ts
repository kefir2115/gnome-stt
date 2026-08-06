import Meta from "gi://Meta";
import Shell from "gi://Shell";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import { Overlay } from "../overlay/overlay.js";
import { recordAudio } from "./audio.js";
import { typeText } from "./keyboard.js";

const TOGGLE_RECORDING_KEYBINDING = "toggle-recording";
const HOLD_RELEASE_TIMEOUT = 500;

export class RecordingController {
  private holdTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private extension: Extension,
    private overlay: Overlay,
  ) {}

  enable() {
    Main.wm.addKeybinding(
      TOGGLE_RECORDING_KEYBINDING,
      this.extension.getSettings(),
      Meta.KeyBindingFlags.NONE,
      Shell.ActionMode.ALL,
      () => this.onHoldKeybinding(),
    );
  }

  disable() {
    Main.wm.removeKeybinding(TOGGLE_RECORDING_KEYBINDING);

    if (this.holdTimeoutId) {
      clearTimeout(this.holdTimeoutId);
      this.holdTimeoutId = null;
    }
  }

  private onHoldKeybinding() {
    const audioPath = `${this.extension.path}/audio.wav`;
    let stopRecording: (() => void) | null = null;

    if (this.holdTimeoutId) {
      clearTimeout(this.holdTimeoutId);
    } else {
      this.overlay.setRecording(true);
      stopRecording = recordAudio(audioPath);
    }

    this.holdTimeoutId = setTimeout(() => {
      this.holdTimeoutId = null;
      this.overlay.setRecording(false);

      if (stopRecording) {
        stopRecording();
        typeText(audioPath);
      }
    }, HOLD_RELEASE_TIMEOUT);
  }
}
