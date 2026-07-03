// Brand icons from @lobehub/icons. Rendered WITHOUT background (no Avatar).
import Flux from "@lobehub/icons/es/Flux";
import Bfl from "@lobehub/icons/es/Bfl";
import OpenAI from "@lobehub/icons/es/OpenAI";
import Gemini from "@lobehub/icons/es/Gemini";
import NanoBanana from "@lobehub/icons/es/NanoBanana";
import Ideogram from "@lobehub/icons/es/Ideogram";
import Recraft from "@lobehub/icons/es/Recraft";
import ByteDance from "@lobehub/icons/es/ByteDance";
import Doubao from "@lobehub/icons/es/Doubao";
import Alibaba from "@lobehub/icons/es/Alibaba";
import Kling from "@lobehub/icons/es/Kling";
import Minimax from "@lobehub/icons/es/Minimax";
import Runway from "@lobehub/icons/es/Runway";
import Stability from "@lobehub/icons/es/Stability";
import Grok from "@lobehub/icons/es/Grok";
import XAI from "@lobehub/icons/es/XAI";
import Fal from "@lobehub/icons/es/Fal";
import Sora from "@lobehub/icons/es/Sora";
import Luma from "@lobehub/icons/es/Luma";
import Pika from "@lobehub/icons/es/Pika";
import PixVerse from "@lobehub/icons/es/PixVerse";
import Hailuo from "@lobehub/icons/es/Hailuo";
import Hedra from "@lobehub/icons/es/Hedra";
import Hunyuan from "@lobehub/icons/es/Hunyuan";
import CogVideo from "@lobehub/icons/es/CogVideo";
import Kolors from "@lobehub/icons/es/Kolors";
import Krea from "@lobehub/icons/es/Krea";
import Midjourney from "@lobehub/icons/es/Midjourney";
import Dalle from "@lobehub/icons/es/Dalle";
import TopazLabs from "@lobehub/icons/es/TopazLabs";

type LobeIcon = any;

function pickBrand(name = "", provider = ""): LobeIcon | null {
  const n = `${name} ${provider}`.toLowerCase();
  if (n.includes("nano banana") || n.includes("nano-banana") || n.includes("nanobanana")) return NanoBanana;
  if (n.includes("kontext") || n.includes("flux")) return Flux;
  if (n.includes("bfl") || n.includes("black forest")) return Bfl;
  if (n.includes("sora")) return Sora;
  if (n.includes("dall")) return Dalle;
  if (n.includes("midjourney") || /\bmj\b/.test(n)) return Midjourney;
  if (n.includes("imagen") || n.includes("veo") || n.includes("gemini")) return Gemini;
  if (n.includes("gpt") || n.includes("openai")) return OpenAI;
  if (n.includes("seedream") || n.includes("seedance") || n.includes("doubao")) return Doubao;
  if (n.includes("hunyuan")) return Hunyuan;
  if (n.includes("cogvideo") || n.includes("cogview")) return CogVideo;
  if (n.includes("kolors")) return Kolors;
  if (n.includes("krea")) return Krea;
  if (n.includes("wanx") || n.includes("wan ") || n.includes("wan2") || n.includes("qwen") || n.includes("tongyi") || n.includes("alibaba")) return Alibaba;
  if (n.includes("ideogram")) return Ideogram;
  if (n.includes("recraft")) return Recraft;
  if (n.includes("kling")) return Kling;
  if (n.includes("hailuo")) return Hailuo;
  if (n.includes("minimax")) return Minimax;
  if (n.includes("runway") || n.includes("gen-3") || n.includes("gen3") || n.includes("gen-4")) return Runway;
  if (n.includes("luma") || n.includes("dream machine")) return Luma;
  if (n.includes("pika")) return Pika;
  if (n.includes("pixverse")) return PixVerse;
  if (n.includes("hedra")) return Hedra;
  if (n.includes("topaz")) return TopazLabs;
  if (n.includes("stab")) return Stability;
  if (n.includes("grok")) return Grok;
  if (n.includes("xai")) return XAI;
  if (n.includes("bytedance")) return ByteDance;
  if (n.includes("fal")) return Fal;
  return null;
}

interface Props {
  name?: string;
  provider?: string;
  size?: number;
  /** Kept for API compatibility. Backgrounds are never rendered. */
  variant?: "avatar" | "mono" | "color";
  className?: string;
}

export function BrandIcon({ name, provider, size = 28, variant = "color", className }: Props) {
  const Cmp = pickBrand(name, provider);
  if (!Cmp) return null;
  if (variant === "mono") {
    return <Cmp size={size} className={className} />;
  }
  // Prefer the brand's Color mark (colored logo, no background).
  if (Cmp.Color) {
    return <Cmp.Color size={size} className={className} />;
  }
  // Fallback for brands without a Color mark (Flux, Runway, OpenAI, Midjourney,
  // Ideogram, Bfl…): render the Mono glyph using the current text color so it's
  // always visible on both light and dark themes — no background tile.
  return <Cmp size={size} className={className} color="currentColor" />;
}



export function hasBrandIcon(name = "", provider = "") {
  return !!pickBrand(name, provider);
}
