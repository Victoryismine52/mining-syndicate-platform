import { storage } from "../storage";
import { logger } from '../logger';

export async function createDefaultPitchSiteSetup(siteId: string) {
  try {
    const formTemplates = await storage.getFormTemplates();
    const builtInTemplates = formTemplates.filter(template => template.isBuiltIn);

    const defaultTemplates = [
      builtInTemplates.find(t => t.name === 'Learn More'),
      builtInTemplates.find(t => t.name === 'Contact Sales'),
      builtInTemplates.find(t => t.name === 'Product Demo')
    ].filter(Boolean);

    for (let i = 0; i < defaultTemplates.length; i++) {
      const template = defaultTemplates[i];
      if (template) {
        await storage.assignFormToSite({
          siteId,
          formTemplateId: template.id,
          displayOrder: String(i + 1),
          cardPosition: i < 2 ? 'main' : 'sidebar',
          isActive: true,
          overrideConfig: null
        });
      }
    }

    logger.info(`Created default form assignments for pitch site: ${siteId}`);
  } catch (error) {
    logger.error('Error setting up default pitch site forms:', error);
  }
}

