import { Client } from "@hubspot/api-client";

const hubspotClient = new Client({ accessToken: process.env.HUBSPOT_API_KEY });

export interface HubSpotContact {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  website?: string;
  leadSource: string;
  interests: string[];
  formType?: string;
}

// HubSpot Form IDs for Mining Syndicate forms
const HUBSPOT_FORM_IDS = {
  'learn-more': '9597adda-e78b-47bd-99e9-79687b6f40d5',
  'mining-pool-reservation': '1b6cc881-83ac-4977-80d8-dc549df4e4ce',
  'lending-pool': '2ce38611-be28-4354-b55b-695b2958cb47'
};

export async function submitToHubSpotForm(formId: string, contactData: any): Promise<any> {
  try {
    if (!formId) {
      console.error(`No HubSpot form ID provided`);
      return null;
    }

    // Submitting to HubSpot form
    
    // Prepare form submission data using HubSpot's expected format
    const formFields = [
      {
        name: "email",
        value: contactData.email
      },
      {
        name: "firstname",
        value: contactData.firstName || ""
      },
      {
        name: "lastname", 
        value: contactData.lastName || ""
      }
    ];

    // Add optional fields if they exist
    if (contactData.phone) {
      formFields.push({
        name: "phone",
        value: contactData.phone
      });
    }

    if (contactData.message) {
      formFields.push({
        name: "message",
        value: contactData.message
      });
    }

    if (contactData.leadSource) {
      formFields.push({
        name: "hs_lead_source",
        value: contactData.leadSource
      });
    }

    if (contactData.formType) {
      // Map form types to HubSpot values
      const opportunityType = contactData.formType === 'learn-more' ? 'Get Info' :
                             contactData.formType === 'mining-pool' ? 'Hardware Opportunity' :
                             contactData.formType === 'lending-pool' ? 'Lending Opportunity' :
                             'Get Info';
      
      formFields.push({
        name: "mining_syndicate_opportunity",
        value: opportunityType
      });
    }

    if (contactData.miningAmount) {
      formFields.push({
        name: "mining_amount",
        value: contactData.miningAmount.toString()
      });
    }

    if (contactData.lendingAmount) {
      formFields.push({
        name: "lending_amount",
        value: contactData.lendingAmount.toString()
      });
    }

    const formData = {
      fields: formFields,
      context: {
        pageUri: `https://mining-syndicate.replit.app/${contactData.formType || 'contact'}`,
        pageName: `Mining Syndicate - ${contactData.siteName || 'Contact'}`
      }
    };

    console.log('HubSpot form submission data:', JSON.stringify(formData, null, 2));

    // Use HubSpot's Forms API endpoint directly via fetch
    const portalId = '43725955'; // Your HubSpot portal ID from earlier logs
    const url = `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HubSpot form submission failed:', response.status, errorText);
      throw new Error(`HubSpot form submission failed: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log('HubSpot form submission successful:', result);
    return result;
  } catch (error: any) {
    console.error('Error submitting to HubSpot form:');
    console.error('Error details:', error.message);
    console.error('Full error:', error);
    throw error;
  }
}

export async function createHubSpotContact(contactData: HubSpotContact): Promise<any> {
  try {
    console.log('Creating HubSpot contact:', contactData.email);
    
    // Start with basic properties that are guaranteed to exist
    const properties: any = {
      email: contactData.email,
      firstname: contactData.firstName || '',
      lastname: contactData.lastName || ''
    };

    // Add optional properties only if they have values
    if (contactData.phone) {
      properties.phone = contactData.phone;
    }
    if (contactData.company) {
      properties.company = contactData.company;
    }
    if (contactData.website) {
      properties.website = contactData.website;
    }

    // Add mining syndicate opportunity based on form type
    if (contactData.formType) {
      const opportunityMapping: { [key: string]: string } = {
        'learn-more': 'Get Info',
        'mining-pool-reservation': 'Hardware Opportunity', 
        'lending-pool': 'Lending Opportunity'
      };
      
      const opportunityValue = opportunityMapping[contactData.formType] || 'Get Info';
      properties.mining_syndicate_opportunity = opportunityValue;
    }

    // For interests, we'll skip adding them for now since there's no notes field
    // TODO: Create custom properties in HubSpot if detailed tracking is needed

    console.log('HubSpot properties to send:', properties);

    const response = await hubspotClient.crm.contacts.basicApi.create({
      properties,
      associations: []
    });

    console.log('HubSpot contact created successfully:', response.id);
    return response;
  } catch (error: any) {
    console.error('Error creating HubSpot contact:');
    console.error('Error status:', error?.response?.status);
    console.error('Error message:', error?.response?.statusText);
    console.error('Error details:', error?.response?.data);
    console.error('Full error:', error);
    
    // Handle duplicate contact (409 error)
    if (error?.response?.status === 409 || error.code === 409) {
      console.log('Contact already exists, updating instead');
      return await updateHubSpotContact(contactData);
    }
    
    throw error;
  }
}

export async function updateHubSpotContact(contactData: HubSpotContact): Promise<any> {
  try {
    console.log('Updating HubSpot contact:', contactData.email);
    
    // First, search for the contact by email
    const searchRequest = {
      filterGroups: [{
        filters: [{
          propertyName: 'email',
          operator: 'EQ' as any,
          value: contactData.email
        }]
      }],
      properties: ['email', 'firstname', 'lastname']
    };

    const searchResponse = await hubspotClient.crm.contacts.searchApi.doSearch(searchRequest);
    
    if (searchResponse.results && searchResponse.results.length > 0) {
      const contactId = searchResponse.results[0].id;
      const existingContact = searchResponse.results[0];
      
      // Build properties object with only valid HubSpot properties
      const properties: any = {
        firstname: contactData.firstName || '',
        lastname: contactData.lastName || ''
      };

      // Add optional properties only if they have values
      if (contactData.phone) {
        properties.phone = contactData.phone;
      }
      if (contactData.company) {
        properties.company = contactData.company;
      }
      if (contactData.website) {
        properties.website = contactData.website;
      }

      // Add mining syndicate opportunity based on form type
      if (contactData.formType) {
        const opportunityMapping: { [key: string]: string } = {
          'learn-more': 'Get Info',
          'mining-pool-reservation': 'Hardware Opportunity',
          'lending-pool': 'Lending Opportunity'
        };
        
        const opportunityValue = opportunityMapping[contactData.formType] || 'Get Info';
        properties.mining_syndicate_opportunity = opportunityValue;
      }

      console.log('HubSpot update properties:', properties);

      const response = await hubspotClient.crm.contacts.basicApi.update(contactId, { properties });
      console.log('HubSpot contact updated successfully:', contactId);
      return response;
    } else {
      throw new Error('Contact not found for update');
    }
  } catch (error: any) {
    console.error('Error updating HubSpot contact:');
    console.error('Error status:', error?.response?.status);
    console.error('Error message:', error?.response?.statusText);
    console.error('Error details:', error?.response?.data);
    console.error('Full error:', error);
    throw error;
  }
}

export async function listContactProperties(): Promise<void> {
  try {
    console.log('Fetching available HubSpot contact properties...');
    const response = await hubspotClient.crm.properties.coreApi.getAll('contacts');
    
    console.log('Available properties:');
    response.results.forEach((property: any) => {
      console.log(`- ${property.name}: ${property.label} (${property.type})`);
    });
  } catch (error: any) {
    console.error('Failed to fetch contact properties:', error?.response?.data || error.message);
  }
}

export async function testHubSpotConnection(): Promise<boolean> {
  try {
    console.log('Testing HubSpot API connection...');
    console.log('API Key format:', process.env.HUBSPOT_API_KEY ? `${process.env.HUBSPOT_API_KEY.substring(0, 10)}...` : 'Not found');
    
    const response = await hubspotClient.crm.contacts.basicApi.getPage(1, undefined, undefined, undefined, undefined, false);
    console.log('HubSpot connection test successful');
    
    // Also list available properties for debugging
    await listContactProperties();
    
    return true;
  } catch (error: any) {
    console.error('HubSpot connection test failed:');
    console.error('Status:', error?.response?.status);
    console.error('Message:', error?.response?.statusText);
    console.error('Headers:', error?.response?.headers);
    
    if (error?.response?.status === 401) {
      console.error('Authentication failed - please check your HubSpot API key');
      console.error('Make sure you have a valid private app access token from HubSpot');
    }
    
    return false;
  }
}