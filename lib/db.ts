let PrismaClientConstructor: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const prismaPkg = require("@prisma/client");
  PrismaClientConstructor = prismaPkg.PrismaClient;
} catch {
  PrismaClientConstructor = null;
}

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: any | undefined;
}

let clientInstance: any = null;

export function getPrismaClient(): any {
  if (!process.env.DATABASE_URL || !PrismaClientConstructor) {
    return null;
  }
  try {
    if (!global.prismaGlobal) {
      global.prismaGlobal = new PrismaClientConstructor({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
      });
    }
    clientInstance = global.prismaGlobal;
    return clientInstance;
  } catch (err) {
    console.warn(
      "[JalNetra DB] Database connection offline or client unavailable. Operating with resilient in-memory twin store.",
      err
    );
    return null;
  }
}

export const isDatabaseConnected = (): boolean => {
  return Boolean(process.env.DATABASE_URL && getPrismaClient() !== null);
};
