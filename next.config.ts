import type { NextConfig } from 'next';
const config: NextConfig = { outputFileTracingIncludes:{'/api/payment-lab/*':['./src/payment-lab/assets/**/*']}, outputFileTracingExcludes: {'/*':['./data/**/*','./reference-data/sources/**/*']}, serverExternalPackages: ['better-sqlite3', 'exceljs'] };
export default config;
