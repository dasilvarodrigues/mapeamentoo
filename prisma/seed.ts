import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/client";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@cassol.com" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@cassol.com",
      senhaHash: await bcrypt.hash("admin123", 10),
      role: "admin",
    },
  });
  console.log("Admin criado:", admin.email);

  const agente = await prisma.user.upsert({
    where: { email: "agente@cassol.com" },
    update: {},
    create: {
      nome: "Agente Teste",
      email: "agente@cassol.com",
      senhaHash: await bcrypt.hash("agente123", 10),
      role: "agente",
    },
  });
  console.log("Agente criado:", agente.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
