import southIndian from "@/assets/r-southindian.jpg";
import pizza from "@/assets/r-pizza.jpg";
import burger from "@/assets/r-burger.jpg";

const covers: Record<string, string> = {
  southindian: southIndian,
  pizza: pizza,
  burger: burger,
  // Fallback for keys without a dedicated image
  biryani: southIndian,
  chaat: southIndian,
  desserts: pizza,
};

export function coverFor(imageKey: string): string {
  return covers[imageKey] ?? covers.southindian;
}
