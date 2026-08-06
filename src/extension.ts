import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import { Overlay } from "./overlay/overlay.js";
import { RecordingController } from "./recording/recording-controller.js";

export default class MyOverlayExtension extends Extension {
  private overlay: Overlay | null = null;
  private recordingController: RecordingController | null = null;

  enable() {
    this.overlay = new Overlay();
    this.recordingController = new RecordingController(this, this.overlay);
    this.recordingController.enable();
  }

  disable() {
    this.recordingController?.disable();
    this.recordingController = null;

    this.overlay?.destroy();
    this.overlay = null;
  }
}
