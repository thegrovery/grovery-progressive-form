import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind({
    applyBaseStyles: false
  })],
  output: 'server',
  vite: {
    envPrefix: 'HUBSPOT_'
  }
});