import St from "gi://St";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { easeOut } from "../utils/easing.js";
import { interpolate, hex, toRgba, Color } from "../utils/color.js";

interface Size {
  width: number;
  height: number;
}

const START_COLOR = hex("#00000061");
const END_COLOR = hex("#ffffff61");
const RED_COLOR = hex("#be1e1e61");

const startSize: Size = { width: 30, height: 7 };
const hoverSize: Size = { width: 15, height: 15 };

// hover detection area: fixed regardless of the bar's animated size, so the
// hitbox never shifts mid-animation and enter/leave events never flicker.
const hitArea: Size = {
  width: Math.max(startSize.width, hoverSize.width),
  height: Math.max(startSize.height, hoverSize.height),
};

export class Overlay {
  private hitbox: St.Widget;
  private actor: St.BoxLayout;
  private eventList: number[] = [];
  private styles: Record<string, string> = {};
  private eventNow: () => void = () => {};
  private resizeNow: () => void = () => {};
  private recording: boolean = false;
  private preRecordColor: Color = START_COLOR;

  constructor() {
    this.actor = new St.BoxLayout({
      styleClass: "speak-bar",
      width: startSize.width,
      height: startSize.height,
    });

    this.hitbox = new St.Widget({
      width: hitArea.width,
      height: hitArea.height,
      reactive: true,
      trackHover: true,
    });
    this.hitbox.add_child(this.actor);
    this.centerActor();

    this.updatePos();

    this.eventList.push(
      this.hitbox.connect("enter-event", () => {
        if (this.recording) {
          this.preRecordColor = END_COLOR;
          return;
        }

        this.resize(hoverSize.width, hoverSize.height);
        this.animateColor(START_COLOR, END_COLOR);
      }),
    );

    this.eventList.push(
      this.hitbox.connect("leave-event", () => {
        if (this.recording) {
          this.preRecordColor = START_COLOR;
          return;
        }

        this.resize(startSize.width, startSize.height);
        this.animateColor(END_COLOR, START_COLOR);
      }),
    );

    Main.layoutManager.addChrome(this.hitbox);
    this.hitbox.show();
  }

  setRecording(recording: boolean) {
    if (this.recording === recording) return;
    this.recording = recording;

    const targetSize = recording || this.hitbox.hover ? hoverSize : startSize;
    this.resize(targetSize.width, targetSize.height);
    this.animateColor(
      recording ? this.preRecordColor : RED_COLOR,
      recording ? RED_COLOR : this.preRecordColor,
    );
  }

  destroy() {
    this.eventList.forEach((id) => this.hitbox.disconnect(id));

    Main.layoutManager.removeChrome(this.hitbox);
    this.hitbox.destroy();
  }

  private animateColor(from: Color, to: Color) {
    this.eventNow();
    this.eventNow = easeOut(
      (value) => {
        const color = interpolate(from, to, value);
        this.styles["background-color"] = toRgba(color);
        this.updateStyles();

        if(!this.recording) this.preRecordColor = color;
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

    this.hitbox.set_position(
      Math.round((winW - this.hitbox.width) / 2),
      Math.round(winH - 50 - this.hitbox.height / 2),
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
        this.centerActor();
      },
      250,
      0,
      1,
    );
  }

  private centerActor() {
    this.actor.set_position(
      Math.round((hitArea.width - this.actor.width) / 2),
      Math.round((hitArea.height - this.actor.height) / 2),
    );
  }
}
