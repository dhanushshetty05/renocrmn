import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Allowed origins for CORS control
const ALLOWED_ORIGINS = [
  'https://renolet.com',
  'https://renoletdesign.netlify.app'
];

// Helper to generate a unique lead ID (L-xxxx)
const generateLeadId = () => `L-${Math.floor(1000 + Math.random() * 9000)}`;

// Simple input sanitization to prevent XSS injection into the database fields
const sanitizeInput = (val) => {
  if (typeof val !== 'string') return '';
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const handler = async (event, context) => {
  const origin = event.headers.origin || event.headers.Origin || '';
  const isOriginAllowed = ALLOWED_ORIGINS.includes(origin);

  // Set up common CORS headers if origin is allowed
  const corsHeaders = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
  };

  if (isOriginAllowed) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  }

  // 1. Handle CORS Preflight OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    if (!isOriginAllowed) {
      console.warn(`[CORS Reject] Blocked preflight request from unauthorized origin: ${origin}`);
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'CORS policy: Origin not allowed' })
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  // 2. Handle POST request
  if (event.httpMethod === 'POST') {
    if (!isOriginAllowed) {
      console.warn(`[CORS Reject] Blocked POST request from unauthorized origin: ${origin}`);
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'CORS policy: Origin not allowed' })
      };
    }

    try {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Bad Request: Missing request body' })
        };
      }

      let payload;
      try {
        payload = JSON.parse(event.body);
      } catch (err) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Bad Request: Invalid JSON format' })
        };
      }

      const { name, phone, email, requirements, source_page } = payload;

      // Validate required inputs
      if (!name || typeof name !== 'string' || !name.trim() ||
          !phone || typeof phone !== 'string' || !phone.trim()) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Bad Request: name and phone are required fields' })
        };
      }

      // Sanitize inputs to prevent XSS
      const cleanName = sanitizeInput(name);
      const cleanPhone = sanitizeInput(phone);
      const cleanEmail = email ? sanitizeInput(email) : 'N/A';
      const cleanRequirements = requirements ? sanitizeInput(requirements) : 'N/A';
      const cleanSourcePage = source_page ? sanitizeInput(source_page) : 'N/A';
      
      const leadId = generateLeadId();
      const createdAt = new Date().toISOString();

      // Retrieve Supabase environment variables securely (never hardcoded)
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_KEY;

      if (supabaseUrl && supabaseKey) {
        // Production Mode: Ingest into Supabase database Lead table
        console.log(`[Database] Ingesting lead ${leadId} to Supabase: ${cleanName}`);
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { error } = await supabase
          .from('Lead')
          .insert([
            {
              id: leadId,
              name: cleanName,
              phone: cleanPhone,
              email: cleanEmail,
              requirements: cleanRequirements,
              sourcePage: cleanSourcePage,
              status: 'NEW',
              createdAt: createdAt
            }
          ]);

        if (error) {
          console.error(`[Database Error] Supabase insertion failed: ${error.message}`);
          throw new Error('Database transaction failed');
        }
      } else {
        // Local Development Mode: Append to project root leads.csv database
        console.log(`[Database Fallback] Appending lead ${leadId} to leads.csv: ${cleanName}`);
        const csvPath = path.resolve(process.cwd(), 'leads.csv');

        // Check file status to format CSV
        const fileExists = fs.existsSync(csvPath);
        if (!fileExists) {
          fs.writeFileSync(csvPath, 'Business Name,Phone,Address,Website,Email\n', 'utf8');
        }

        // Format CSV record, escaping quotation marks
        const escapedName = cleanName.replace(/"/g, '""');
        const escapedPhone = cleanPhone.replace(/"/g, '""');
        const escapedAddress = `Website Ingest: ${cleanSourcePage}`.replace(/"/g, '""');
        const escapedWebsite = cleanRequirements.replace(/"/g, '""');
        const escapedEmail = cleanEmail.replace(/"/g, '""');

        const csvLine = `"${escapedName}","${escapedPhone}","${escapedAddress}","${escapedWebsite}","${escapedEmail}"\n`;
        fs.appendFileSync(csvPath, csvLine, 'utf8');
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, message: 'Lead ingested successfully' })
      };

    } catch (error) {
      console.error('[Error] Exception occurred in lead ingestion:', error.message);
      // Return generic error message to protect internal architecture leaks
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Internal Server Error' })
      };
    }
  }

  // Reject all other methods
  return {
    statusCode: 405,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Method Not Allowed' })
  };
};
