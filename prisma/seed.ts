import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@kenyoncore.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@kenyoncore.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  const pm = await prisma.user.upsert({
    where: { email: "pm@kenyoncore.com" },
    update: {},
    create: {
      name: "Project Manager",
      email: "pm@kenyoncore.com",
      passwordHash,
      role: "PROJECT_MANAGER",
    },
  });

  // Seed catalog - Plumbing
  const plumbingCat = await prisma.catalogCategory.upsert({
    where: { name_trade: { name: "Pipes & Fittings", trade: "PLUMBING" } },
    update: {},
    create: { name: "Pipes & Fittings", trade: "PLUMBING", sortOrder: 1 },
  });

  const copperSub = await prisma.catalogSubcategory.upsert({
    where: { name_categoryId: { name: "Copper", categoryId: plumbingCat.id } },
    update: {},
    create: { name: "Copper", categoryId: plumbingCat.id, sortOrder: 1 },
  });

  await prisma.catalogItem.createMany({
    skipDuplicates: true,
    data: [
      { name: '1/2" Copper Pipe (10ft)', defaultUnit: "piece", estimatedPrice: 18.50, subcategoryId: copperSub.id },
      { name: '3/4" Copper Pipe (10ft)', defaultUnit: "piece", estimatedPrice: 28.00, subcategoryId: copperSub.id },
      { name: '1/2" Copper Elbow 90°', defaultUnit: "each", estimatedPrice: 2.50, subcategoryId: copperSub.id },
      { name: '1/2" Copper Tee', defaultUnit: "each", estimatedPrice: 3.25, subcategoryId: copperSub.id },
    ],
  });

  // Seed catalog - Electrical
  const electricalCat = await prisma.catalogCategory.upsert({
    where: { name_trade: { name: "Wire & Cable", trade: "ELECTRICAL" } },
    update: {},
    create: { name: "Wire & Cable", trade: "ELECTRICAL", sortOrder: 1 },
  });

  const romexSub = await prisma.catalogSubcategory.upsert({
    where: { name_categoryId: { name: "Romex / NM-B", categoryId: electricalCat.id } },
    update: {},
    create: { name: "Romex / NM-B", categoryId: electricalCat.id, sortOrder: 1 },
  });

  await prisma.catalogItem.createMany({
    skipDuplicates: true,
    data: [
      { name: "14/2 NM-B (250ft)", defaultUnit: "roll", estimatedPrice: 85.00, subcategoryId: romexSub.id },
      { name: "12/2 NM-B (250ft)", defaultUnit: "roll", estimatedPrice: 115.00, subcategoryId: romexSub.id },
      { name: "10/3 NM-B (100ft)", defaultUnit: "roll", estimatedPrice: 125.00, subcategoryId: romexSub.id },
    ],
  });

  // Seed a sample job
  const job = await prisma.job.upsert({
    where: { jobNumber: "KC-25-0001" },
    update: {},
    create: {
      name: "Smith Residence Renovation",
      jobNumber: "KC-25-0001",
      address: "123 Oak Street, Springfield, IL",
      clientName: "John Smith",
      description: "Full kitchen and bathroom renovation",
      status: "IN_PROGRESS",
      budgetTotal: 45000,
      projectManagerId: pm.id,
    },
  });

  console.log("Seed complete:", { admin: admin.email, pm: pm.email, job: job.jobNumber });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
