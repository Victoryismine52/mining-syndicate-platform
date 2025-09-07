import { siteStorage } from "../site-storage";
import { storage } from "../storage";
import { logger } from '../logger';

export async function createDefaultCollectiveSetup(siteId: string) {
  try {
    const site = await siteStorage.getSite(siteId);
    const siteName = site?.name || 'Collective';

    await siteStorage.updateSite(siteId, {
      collectiveSettings: JSON.stringify({
        joinType: 'public',
        visibility: 'visible',
        maxMembers: null,
        autoApprove: false,
        description: 'Welcome to our collective community',
        welcomeMessage: 'Thanks for joining our collective! We\'re excited to have you as part of our community.'
      }) as any,
      isLaunched: false,
      landingConfig: {
        heroTitle: `Welcome to ${siteName}`,
        heroSubtitle: 'Join our community and collaborate together',
        companyName: siteName,
        formsTitle: 'Join Our Community',
        formsDescription: 'Become a member of our collective and help shape our shared goals.',
      }
    });

    const joinCardTemplate = await storage.getJoinCardTemplate();
    if (joinCardTemplate) {
      await storage.assignFormToSite({
        siteId,
        formTemplateId: joinCardTemplate.id,
        displayOrder: '1',
        cardPosition: 'main',
        isActive: true,
        overrideConfig: {
          title: `Join ${siteName}`,
          subtitle: 'Become a member of our community',
          description: 'Click to join this collective and gain access to member-only content and features.'
        }
      });
      logger.info(`Added Join Card template to collective site: ${siteId}`);
    } else {
      console.warn('Join Card template not found - collective site created without automatic join card');
    }

    logger.info(`Created default collective setup for site: ${siteId}`);
  } catch (error) {
    logger.error('Error setting up default collective setup:', error);
  }
}

