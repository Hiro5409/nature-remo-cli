import { invalidArgument } from "../errors.ts";
import type { ButtonDbButton } from "../types/nature/types.gen.ts";

export function requireControlButton(buttons: ButtonDbButton[] | null, button: string): string {
  const normalized = button.toLowerCase();
  const match = buttons?.find((candidate) => candidate.name.toLowerCase() === normalized);
  if (match) return match.name;

  const supported = buttons?.map((candidate) => candidate.name) ?? [];
  const suffix = supported.length > 0 ? ` Supported buttons: ${supported.join(", ")}` : "";
  throw invalidArgument(`Unsupported control button: ${button}.${suffix}`);
}
