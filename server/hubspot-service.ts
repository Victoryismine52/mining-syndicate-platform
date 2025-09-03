import { Client } from '@hubspot/api-client';

export interface ContactData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
}

export interface HubSpotConfig {
  apiKey: string;
  portalId?: string;
}

export class HubSpotService {
  private client: Client;
  
  constructor(config: HubSpotConfig) {
    this.client = new Client({
      accessToken: config.apiKey,
    });
  }

  /**
   * Create a contact in HubSpot
   */
  async createContact(contactData: ContactData): Promise<{ id: string } | null> {
    try {
      const properties: Record<string, string> = {};
      
      // Map contact data to HubSpot properties
      if (contactData.firstName) properties.firstname = contactData.firstName;
      if (contactData.lastName) properties.lastname = contactData.lastName;
      if (contactData.email) properties.email = contactData.email;
      if (contactData.phone) properties.phone = contactData.phone;
      if (contactData.company) properties.company = contactData.company;

      // Check if contact already exists by email
      if (contactData.email) {
        try {
          const existingContact = await this.client.crm.contacts.basicApi.getById(
            contactData.email,
            undefined,
            undefined,
            undefined,
            undefined,
            'email'
          );
          
          if (existingContact) {
            // Update existing contact
            await this.client.crm.contacts.basicApi.update(
              existingContact.id,
              { properties }
            );
            
            return { id: existingContact.id };
          }
        } catch (error) {
          // Contact doesn't exist, proceed with creation
        }
      }

      // Create new contact
      const result = await this.client.crm.contacts.basicApi.create({
        properties
      });

      return { id: result.id };
    } catch (error) {
      console.error('HubSpot contact creation failed:', error);
      return null;
    }
  }

  /**
   * Test the HubSpot connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to get account info to test the connection
      await this.client.crm.contacts.basicApi.getPage(1);
      return true;
    } catch (error) {
      console.error('HubSpot connection test failed:', error);
      return false;
    }
  }
}

/**
 * Create a HubSpot service instance for a site
 */
export function createHubSpotService(site: any): HubSpotService | null {
  if (!site.hubspotEnabled || !site.hubspotApiKey) {
    return null;
  }

  return new HubSpotService({
    apiKey: site.hubspotApiKey,
    portalId: site.hubspotPortalId,
  });
}