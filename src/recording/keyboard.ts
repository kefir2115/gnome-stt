import Clutter from "gi://Clutter";

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
