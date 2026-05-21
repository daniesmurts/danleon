import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './sanity/schemaTypes';
import { projectId, dataset, apiVersion } from './sanity/env';

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  apiVersion,
  plugins: [structureTool()],
  schema: { types: schemaTypes },
});
