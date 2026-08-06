import St from "gi://St";
import Meta from "gi://Meta";
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import Shell from "gi://Shell";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import { easeOut } from "./utils/easing.js";
import { interpolate, hex, toRgba, Color } from "./utils/color.js";

const TOGGLE_RECORDING_KEYBINDING = "toggle-recording";
const HOLD_RELEASE_TIMEOUT = 500;

export default class MyOverlayExtension extends Extension {
  private _overlay: St.BoxLayout | null = null;
  private eventList: number[] = [];
  private styles: Record<string, string> = {};
  private recording: boolean = false;
  private eventNow: () => void = () => {};
  private resizeNow: () => void = () => {};
  private startColor!: Color;
  private endColor!: Color;
  private redColor!: Color;
  private holdTimeoutId: ReturnType<typeof setTimeout> | null = null;

  enable() {
    this._overlay = new St.BoxLayout({
      styleClass: "speak-bar",
      width: 30,
      height: 10,
      reactive: true,
      hover: true,
      track_hover: true,
    });
    this.updatePos();

    [this.startColor, this.endColor, this.redColor] = [
      "#00000061",
      "#ffffff61",
      "#be1e1e61",
    ].map(hex);

    Main.wm.addKeybinding(
      TOGGLE_RECORDING_KEYBINDING,
      this.getSettings(),
      Meta.KeyBindingFlags.NONE,
      Shell.ActionMode.ALL,
      () => this.onHoldKeybinding(),
    );

    this.eventList.push(
      this._overlay.connect("enter-event", () => {
        this.resize(30, 20);

        if (this.recording) return;

        this.eventNow();
        this.eventNow = easeOut(
          (value) => {
            this.styles["background-color"] = toRgba(
              interpolate(this.startColor, this.endColor, value),
            );
            this.updateStyles();
          },
          250,
          0,
          1,
        );
      }),
    );

    this.eventList.push(
      this._overlay.connect("leave-event", () => {
        this.resize(30, 10);

        if (this.recording) return;

        this.eventNow();
        this.eventNow = easeOut(
          (value) => {
            this.styles["background-color"] = toRgba(
              interpolate(this.endColor, this.startColor, value),
            );
            this.updateStyles();
          },
          250,
          0,
          1,
        );
      }),
    );

    Main.layoutManager.addChrome(this._overlay);
    this._overlay.show();
  }

  onHoldKeybinding() {
    const AUDIO_PATH = `${this.path}/audio.mp3`;
    let stopRecording: (() => void) | null = null;

    if (this.holdTimeoutId) {
      clearTimeout(this.holdTimeoutId);
    } else {
      this.setRecording(true);
      stopRecording = recordAudio(AUDIO_PATH);
    }

    this.holdTimeoutId = setTimeout(() => {
      this.holdTimeoutId = null;
      this.setRecording(false);

      if(stopRecording) {
        stopRecording();
        typeText(`${this.path}/audio.mp3`);
      }
    }, HOLD_RELEASE_TIMEOUT);
  }

  setRecording(recording: boolean) {
    if (this.recording === recording) return;
    this.recording = recording;

    this.eventNow();
    this.eventNow = easeOut(
      (value) => {
        this.styles["background-color"] = toRgba(
          this.recording
            ? interpolate(this.endColor, this.redColor, value)
            : interpolate(this.redColor, this.endColor, value),
        );
        this.updateStyles();
      },
      250,
      0,
      1,
    );
  }

  updateStyles() {
    this._overlay?.set_style(
      Object.entries(this.styles)
        .map((ent) => `${ent[0]}: ${ent[1]};`)
        .join(""),
    );
  }

  updatePos() {
    if (!this._overlay) return;
    const { width: winW, height: winH } = Main.layoutManager.uiGroup.size;

    this._overlay.set_position(
      Math.round((winW - this._overlay.width) / 2),
      Math.round(winH - 100 - this._overlay.height / 2),
    );
  }

  resize(width: number, height: number) {
    if (!this._overlay) return;

    const [heightFrom, heightTo] = [this._overlay.height, height];
    const [widthFrom, widthTo] = [this._overlay.width, width];

    this.resizeNow();
    this.resizeNow = easeOut(
      (value) => {
        if (!this._overlay) return;

        const [newWidth, newHeight] = [
          widthFrom + (widthTo - widthFrom) * value,
          heightFrom + (heightTo - heightFrom) * value,
        ];

        this._overlay.set_height(newHeight);
        this._overlay.set_width(newWidth);

        this.styles["border-radius"] = `${Math.min(newWidth, newHeight) / 2}px`;
        this.updateStyles();

        this.updatePos();
      },
      250,
      0,
      1,
    );
  }

  disable() {
    Main.wm.removeKeybinding(TOGGLE_RECORDING_KEYBINDING);

    if (this.holdTimeoutId) {
      clearTimeout(this.holdTimeoutId);
      this.holdTimeoutId = null;
    }

    if (this._overlay) {
      this.eventList.forEach((event) => {
        this._overlay!.disconnect(event);
      });

      Main.layoutManager.removeChrome(this._overlay);

      this._overlay.destroy();
      this._overlay = null;
    }
  }
}

export function typeText(text: string) {
    const backend = Clutter.get_default_backend();
    if (!backend) return;

    const seat = backend.get_default_seat();
    if (!seat) return;

    const virtualKeyboard = seat.create_virtual_device(Clutter.InputDeviceType.KEYBOARD_DEVICE);

    for (const char of text) {
        const keysym = Clutter.unicode_to_keysym(char.charCodeAt(0));
        const time = Clutter.get_current_event_time();

        virtualKeyboard.notify_keyval(time, keysym, Clutter.KeyState.PRESSED);
        virtualKeyboard.notify_keyval(time, keysym, Clutter.KeyState.RELEASED);
    }
}

export function recordAudio(outPath: string): () => void {
  let proc: Gio.Subprocess | null = new Gio.Subprocess({
    argv: ["pw-record", outPath],
    flags: Gio.SubprocessFlags.NONE
  });

  proc.init(null);
  proc.wait_check_async(null, null);

  return () => {
    if(!proc) return;
    proc.send_signal(2);
    proc = null;
  }
}