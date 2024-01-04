/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { nanoid } from 'nanoid';
import { PrismaClient } from '../../node_modules/.prisma/client';

const prisma = new PrismaClient();

export default prisma;
export const genId = () => nanoid(16);

/*
 * Execute a raw query
 *
 * @param command string
 *
 * @returns Promise<number>
 * Executes a prepared raw query and returns the number of affected rows.
 */
export const executeQuery = async (command: string): Promise<number> => {
  try {
    // Execute the SQL command
    const result = await prisma.$executeRawUnsafe(command);

    return result;
  } catch (error) {
    throw new Error(`Execute Query Error: ${(error as Error).message}`);
  }
};