import disclaimers from "../data/disclaimers.json";

export function getDisclaimerText(id: string, fallback: string): string {
  return disclaimers.find((item) => item.id === id)?.text ?? fallback;
}
