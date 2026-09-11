import { stripVTControlCharacters } from "node:util";

import stringWidth from "string-width";

export function terminalSafe(value: unknown): string {
  let safe = "";
  for (const character of stripVTControlCharacters(String(value ?? ""))) {
    const code = character.charCodeAt(0);
    safe += code >= 0x20 && (code < 0x7f || code > 0x9f) ? character : " ";
  }
  return safe;
}

export function terminalWidth(value: string): number {
  return stringWidth(value);
}

export function padTerminalEnd(value: string, width: number): string {
  return value + " ".repeat(Math.max(0, width - terminalWidth(value)));
}
