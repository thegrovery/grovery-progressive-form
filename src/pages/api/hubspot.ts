import type { APIRoute } from 'astro';
import { Client } from '@hubspot/api-client';

const HUBSPOT_API_KEY = import.meta.env.HUBSPOT_API_KEY;
const HUBSPOT_API_URL = 'https://api.hubapi.com/crm/v3/objects/contacts';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.json();
    
    console.log('Received form data:', formData);
    
    // Initialize HubSpot client
    const hubspotClient = new Client({ accessToken: import.meta.env.HUBSPOT_API_KEY });
    
    // Use standard HubSpot properties
    const contactProperties = {
      email: formData.email,
      firstname: formData.name.split(' ')[0],
      lastname: formData.name.split(' ').slice(1).join(' ') || '',
      company: formData.company,
      jobtitle: formData.title,
      website: formData.brandName  // Store brand name in the website field
    };
    
    try {
      // First try to create a new contact
      const contact = await hubspotClient.crm.contacts.basicApi.create({
        properties: contactProperties
      });
      
      await addToList(hubspotClient, contact.id);
      
      return new Response(JSON.stringify({
        success: true,
        message: 'New contact created successfully',
        contactId: contact.id
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error: any) {
      // If contact already exists (409 error), try to update instead
      if (error.code === 409 && error.body) {
        // Extract the existing contact ID from the error message
        const errorBody = error.body;
        const existingIdMatch = errorBody.message.match(/Existing ID: (\d+)/);
        const contactId = existingIdMatch ? existingIdMatch[1] : null;
        
        if (contactId) {
          // Update the existing contact
          await hubspotClient.crm.contacts.basicApi.update(contactId, {
            properties: contactProperties
          });
          
          await addToList(hubspotClient, contactId);
          
          return new Response(JSON.stringify({
            success: true,
            message: 'Existing contact updated successfully',
            contactId: contactId
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }
      }
      
      // Re-throw if it's not a contact-exists error or we couldn't extract the ID
      throw error;
    }
  } catch (error: any) {
    console.error('Error handling HubSpot contact:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to create or update contact',
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

// Helper function to add contact to the BHI list
async function addToList(hubspotClient, contactId) {
  try {
    // Direct API call using axios with the hubspot client
    const response = await hubspotClient.apiRequest({
      method: 'POST',
      path: `/contacts/v1/lists/78/add`,
      body: {
        vids: [parseInt(contactId, 10)]
      }
    });
    
    console.log(`Added contact ${contactId} to BHI Leadgen Tool Contact List`);
    return response;
  } catch (error: any) {
    console.error('Error adding contact to list:', error);
    // Log more details for debugging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    // Don't fail the whole operation if list addition fails
  }
} 