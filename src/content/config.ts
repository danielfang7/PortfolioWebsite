import { defineCollection, z } from "astro:content";

const works = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    longDescription: z.string().optional(),
    role: z.string(),
    year: z.string(),
    stack: z.array(z.string()),
    thumbnail: z.string(),
    images: z.array(z.string()).optional().default([]),
    /** Ordered gallery items (images and/or videos). If set, overrides `images`/`videos`. */
    media: z
      .array(
        z.object({
          type: z.enum(["image", "video"]),
          src: z.string(),
          label: z.string().optional(),
        })
      )
      .optional(),
    /** Video URLs for gallery (used when `media` is not set). Shown after `images`. */
    videos: z.array(z.string()).optional().default([]),
    liveUrl: z.string().url().optional(),
    sourceUrl: z.string().url().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(99),
  }),
});

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string(),
    tags: z.array(z.string()).default([]),
    readingTime: z.string().optional(),
  }),
});

const investments = defineCollection({
  type: "data",
  schema: z.object({
    company: z.string(),
    logo: z.string().optional(),
    description: z.string(),
    sector: z.string(),
    stage: z.string(),
    year: z.number(),
    url: z.string().url().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { works, blog, investments };
