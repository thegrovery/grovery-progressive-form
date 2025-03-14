# Brand Health Indicator (BHI) Tool

A progressive form tool built with Astro that helps brands assess their marketing health and automatically adds submissions to HubSpot.

## Features

- Multi-step progressive form with smooth transitions
- Auto-focus on first field of each step
- Progress bar indicating completion status
- Mobile-responsive design
- Direct HubSpot integration
- Automatic contact creation and list management

## Technologies Used

- [Astro](https://astro.build/) - The web framework for content-driven websites
- [Tailwind CSS](https://tailwindcss.com/) - For styling
- HubSpot API - For CRM integration
- TypeScript - For type-safe API handling

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bhi-tool.git
   cd bhi-tool
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Create a `.env` file in the project root with your HubSpot API key:
   ```
   HUBSPOT_API_KEY=your_hubspot_api_key_here
   ```

## HubSpot Setup

1. Create a private app in HubSpot with the following scopes:
   - `crm.lists.read`
   - `crm.lists.write`
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
   - `forms`

2. Create a static list in HubSpot named "BHI Leadgen Tool Contact List"
   - Note the list ID (visible in the URL or list settings)
   - Update the `listId` value in `src/pages/api/hubspot.ts` if needed

## Development

Start the development server:

```bash
npm run dev
# or
pnpm dev
```

Visit `http://localhost:4321` to view the application.

## Production Build

```bash
npm run build
# or
pnpm build
```

## How It Works

1. The progressive form collects user information across multiple steps
2. Form data is validated on each step before allowing the user to proceed
3. On submission, the form data is sent to the `/api/hubspot` endpoint
4. The API creates or updates a contact in HubSpot with the form data
5. The contact is automatically added to the BHI Leadgen Tool Contact List
6. A success message is displayed to the user

## Project Structure

```
/
├── public/            # Static assets
├── src/
│   ├── components/    # UI components
│   │   ├── ProgressBar.astro
│   │   └── ProgressiveForm.astro
│   ├── layouts/       # Page layouts
│   ├── pages/         # Page components and API endpoints
│   │   ├── index.astro
│   │   └── api/hubspot.ts
│   └── styles/        # Global styles
├── .env               # Environment variables (not committed to git)
└── astro.config.mjs   # Astro configuration
```

## License

MIT License

Copyright (c) 2023 Scott Johnson / The Grovery Creative Solutions

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Credits

Created by Scott B. Johnson for The Grovery Creative Solutions  
