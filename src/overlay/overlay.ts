import St from "gi://St";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { easeOut } from "../utils/easing.js";
import { interpolate, hex, toRgba, Color } from "../utils/color.js";

const START_COLOR = hex("#00000061");
const END_COLOR = hex("#ffffff61");
const RED_COLOR = hex("#be1e1e61");

export class Overlay {
  private actor: St.BoxLayout;
  private eventList: number[] = [];
  private styles: Record<string, string> = {};
  private eventNow: () => void = () => {};
  private resizeNow: () => void = () => {};
  private recording: boolean = false;

  constructor() {
    this.actor = new St.BoxLayout({
      styleClass: "speak-bar",
      width: 30,
      height: 10,
      reactive: true,
      hover: true,
      track_hover: true,
    });

    this.updatePos();

    this.eventList.push(
      this.actor.connect("enter-event", () => {
        this.resize(30, 20);

        if (this.recording) return;

        this.animateColor(START_COLOR, END_COLOR);
      }),
    );

    this.eventList.push(
      this.actor.connect("leave-event", () => {
        this.resize(30, 10);

        if (this.recording) return;

        this.animateColor(END_COLOR, START_COLOR);
      }),
    );

    Main.layoutManager.addChrome(this.actor);
    this.actor.show();
  }

  setRecording(recording: boolean) {
    if (this.recording === recording) return;
    this.recording = recording;

    this.animateColor(
      recording ? END_COLOR : RED_COLOR,
      recording ? RED_COLOR : END_COLOR,
    );
  }

  destroy() {
    this.eventList.forEach((id) => this.actor.disconnect(id));

    Main.layoutManager.removeChrome(this.actor);
    this.actor.destroy();
  }

  private animateColor(from: Color, to: Color) {
    this.eventNow();
    this.eventNow = easeOut(
      (value) => {
        this.styles["background-color"] = toRgba(interpolate(from, to, value));
        this.updateStyles();
      },
      250,
      0,
      1,
    );
  }

  private updateStyles() {
    this.actor.set_style(
      Object.entries(this.styles)
        .map((ent) => `${ent[0]}: ${ent[1]};`)
        .join(""),
    );
  }

  private updatePos() {
    const { width: winW, height: winH } = Main.layoutManager.uiGroup.size;

    this.actor.set_position(
      Math.round((winW - this.actor.width) / 2),
      Math.round(winH - 100 - this.actor.height / 2),
    );
  }

  private resize(width: number, height: number) {
    const [heightFrom, heightTo] = [this.actor.height, height];
    const [widthFrom, widthTo] = [this.actor.width, width];

    this.resizeNow();
    this.resizeNow = easeOut(
      (value) => {
        const [newWidth, newHeight] = [
          widthFrom + (widthTo - widthFrom) * value,
          heightFrom + (heightTo - heightFrom) * value,
        ];

        this.actor.set_height(newHeight);
        this.actor.set_width(newWidth);

        this.styles["border-radius"] = `${Math.min(newWidth, newHeight) / 2}px`;
        this.updateStyles();

        this.updatePos();
      },
      250,
      0,
      1,
    );
  }
}
