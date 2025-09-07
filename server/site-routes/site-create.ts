import type { Express } from "express";
import path from "path";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { siteStorage } from "../site-storage";
import { qrGenerator } from "../qr-generator";
import { ObjectStorageService } from "../objectStorage";
import { insertSiteSchema } from "@shared/site-schema";
import { z } from "zod";
import { createDefaultPitchSiteSetup } from "./pitch-setup";
import { createDefaultCollectiveSetup } from "./collective-setup";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createDefaultSlides(siteId: string) {
  const slidesPath = path.join(__dirname, "..", "seeds", "slides.json");
  const raw = await readFile(slidesPath, "utf-8");
  const defaultSlides: Array<{ title: string; imageUrl: string; slideOrder: string; description: string }> = JSON.parse(raw);
  const [publicPath] = new ObjectStorageService().getPublicObjectSearchPaths();

  for (const slide of defaultSlides) {
    const imageUrl = path.posix.join(publicPath, slide.imageUrl);
    await siteStorage.createSiteSlide({
      siteId,
      title: slide.title,
      imageUrl,
      slideOrder: slide.slideOrder,
      isVisible: true,
      slideType: "image",
      description: slide.description,
    });
  }
}

export function registerSiteCreateRoutes(app: Express) {
  app.post("/api/sites", async (req, res) => {
    try {
      const { presentationMode, ...siteData } = req.body;

      if (!siteData.siteType) {
        return res.status(400).json({ error: "Site type is required to determine how to construct the site" });
      }

      const validatedData = insertSiteSchema.parse(siteData);

      const existingSite = await siteStorage.getSite(validatedData.siteId);
      if (existingSite) {
        return res.status(400).json({ error: "Site ID already exists" });
      }

      const site = await siteStorage.createSite(validatedData);
      const mode = presentationMode || "default";

      if (validatedData.siteType === "pitch-site") {
        if (mode === "coming-soon") {
          console.log(`Pitch site created with coming-soon mode - landing page ready for customization`);
        } else if (mode === "configure-now") {
          await createDefaultPitchSiteSetup(site.siteId);
          console.log(`Pitch site created with configure-now mode - redirecting to admin panel`);
        }
      } else if (validatedData.siteType === "collective") {
        if (mode === "coming-soon") {
          console.log(`Collective site created with coming-soon mode - landing page ready for customization`);
        } else if (mode === "configure-now") {
          await createDefaultCollectiveSetup(site.siteId);
          console.log(`Collective site created with configure-now mode - redirecting to admin panel`);
        }
      } else {
        if (mode === "default") {
          await createDefaultSlides(site.siteId);
        } else if (mode === "load-later" || mode === "load-immediately") {
          console.log(`Site created with ${mode} mode - no content slides added`);
        }
      }

      const siteUrl = `${req.protocol}://${req.get("host")}/site/${site.siteId}`;
      const qrCodeUrl = await qrGenerator.generateQRCode(siteUrl, site.siteId);
      const updatedSite = await siteStorage.updateSite(site.siteId, {
        qrCodeUrl,
      });

      res.json(updatedSite);
    } catch (error) {
      console.error("Error creating site:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create site" });
    }
  });
}

