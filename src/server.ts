/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import express from 'express';
import dotenv from 'dotenv';

import prisma from './lib/prisma.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const count: number = await prisma.case.count();
    res.json({
      success: true,
      count,
      message: `Found ${count} cases in the database`,
    });
  } catch (error) {
    console.error('Error counting cases:', error);
    res.status(500).json({
      success: false,
      message: 'Error counting cases in the database',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
