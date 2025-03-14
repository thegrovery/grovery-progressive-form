import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';

export default defineConfig({
  integrations: [tailwind({
    applyBaseStyles: false
  })],
  output: 'server',
  adapter: netlify(),
  vite: {
    envPrefix: 'HUBSPOT_'
  }
});