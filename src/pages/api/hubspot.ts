import type { APIRoute } from 'astro';
import { Client } from '@hubspot/api-client';
import { Resend } from 'resend';

const HUBSPOT_API_KEY = import.meta.env.HUBSPOT_API_KEY;
const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;
const ADMIN_EMAIL = import.meta.env.ADMIN_EMAIL;
const FROM_EMAIL = import.meta.env.FROM_EMAIL || 'no-reply@yourdomain.com';

// Initialize Resend
const resend = new Resend(RESEND_API_KEY);

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
    
    let contactId;
    let actionMessage;
    
    try {
      // First try to create a new contact
      const contact = await hubspotClient.crm.contacts.basicApi.create({
        properties: contactProperties
      });
      
      contactId = contact.id;
      actionMessage = 'New contact created successfully';
      
      await addToList(hubspotClient, contact.id);
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
          
          actionMessage = 'Existing contact updated successfully';
        }
      } else {
        // Re-throw if it's not a contact-exists error or we couldn't extract the ID
        throw error;
      }
    }
    
    // Send email notifications
    try {
      // Send notification to the admin
      await resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: 'New Form Submission: Brand Health Indicator Tool',
        html: `
          <h1>New BHI Form Submission</h1>
          <p>A new submission has been received from the Brand Health Indicator tool.</p>
          <h2>Submission Details:</h2>
          <ul>
            <li><strong>Brand Name:</strong> ${formData.brandName}</li>
            <li><strong>Name:</strong> ${formData.name}</li>
            <li><strong>Email:</strong> ${formData.email}</li>
            <li><strong>Company:</strong> ${formData.company}</li>
            <li><strong>Title:</strong> ${formData.title}</li>
          </ul>
          <p>This contact has been ${(actionMessage ?? 'processed').includes('New') ? 'added to' : 'updated in'} HubSpot.</p>
        `
      });
      
      // Send confirmation to the user
      await resend.emails.send({
        from: FROM_EMAIL,
        to: formData.email,
        subject: 'Thank You for Your Brand Health Indicator Submission',
        html: `
          <h1>Thank You for Your Submission</h1>
          <p>Dear ${contactProperties.firstname},</p>
          <p>Thank you for completing the Brand Health Indicator assessment for ${formData.brandName}.</p>
          <p>Our team will review your submission and may reach out with additional insights about your brand's marketing health.</p>
          <p>If you have any questions in the meantime, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The Grovery Team</p>
        `
      });
      
      console.log('Email notifications sent successfully');
    } catch (emailError) {
      // Log email errors but don't fail the entire request
      console.error('Error sending email notifications:', emailError);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: actionMessage || 'Contact processed successfully',
      contactId: contactId
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
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
async function addToList(hubspotClient: Client, contactId: string | number) {
  try {
    // Direct API call using axios with the hubspot client
    const response = await hubspotClient.apiRequest({
      method: 'POST',
      path: `/contacts/v1/lists/78/add`,
      body: {
        vids: [typeof contactId === 'string' ? parseInt(contactId, 10) : contactId]
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