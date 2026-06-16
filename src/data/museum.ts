import { getCollection, type CollectionEntry } from "astro:content";
import { experiments, type Experiment } from "./experiments";
import type { WorkRef, InvestmentRef } from "@/components/museum/data";

/**
 * Shared loader for the museum's exhibit data so the full Lab page and the
 * home-page preview stay perfectly in sync. Maps Astro content collections into
 * the lightweight refs the canvas engine consumes, and assigns each investment
 * a stable accent color (for its pedestal plaque + summary modal).
 */

const INVESTMENT_COLORS = [
  "#A78BFA",
  "#00D8FF",
  "#F59E0B",
  "#34D399",
  "#EC4899",
  "#38BDF8",
];

export type MuseumData = {
  experiments: Experiment[];
  works: WorkRef[];
  investments: InvestmentRef[];
  /** Full collection entries, for the accessible list view. */
  workEntries: CollectionEntry<"works">[];
  investmentEntries: CollectionEntry<"investments">[];
};

export async function getMuseumData(): Promise<MuseumData> {
  const workEntries = (await getCollection("works")).sort(
    (a, b) => a.data.order - b.data.order,
  );
  const works: WorkRef[] = workEntries.map((w) => ({
    slug: w.id.replace(/\.(md|mdx)$/, ""),
    title: w.data.title,
    description: w.data.description,
    role: w.data.role,
    year: w.data.year,
    stack: w.data.stack,
    thumbnail: w.data.thumbnail,
    liveUrl: w.data.liveUrl,
    sourceUrl: w.data.sourceUrl,
  }));

  const investmentEntries = (await getCollection("investments")).sort(
    (a, b) => b.data.year - a.data.year,
  );
  const investments: InvestmentRef[] = investmentEntries.map((inv, i) => ({
    slug: inv.id,
    company: inv.data.company,
    description: inv.data.description,
    sector: inv.data.sector,
    stage: inv.data.stage,
    year: String(inv.data.year),
    url: inv.data.url,
    logo: inv.data.logo,
    color: INVESTMENT_COLORS[i % INVESTMENT_COLORS.length],
  }));

  return { experiments, works, investments, workEntries, investmentEntries };
}
