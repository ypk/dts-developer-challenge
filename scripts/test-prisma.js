import pkg from '@prisma/client';
const { PrismaClient, Case, CaseStatus } = pkg;

try {
  console.log('✓ PrismaClient imported successfully');
  console.log('✓ Case type imported successfully');  
  console.log('✓ CaseStatus imported successfully');
  console.log('CaseStatus values:', CaseStatus);
  
  const client = new PrismaClient();
  console.log('✓ PrismaClient instantiated');
  
} catch (error) {
  console.error('Import error:', error.message);
}
