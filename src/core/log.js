import { DEBUG } from "./config.js";

export function LogInfo(...values) {
  if (!DEBUG) return;
  const now = new Date();
  console.log(": [//* NFH *\\\\] " + now.toISOString(), ...values);
}
