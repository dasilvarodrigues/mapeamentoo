import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/client";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const regioesSP = [
  { nome: "Zona Norte", latitude: -23.480, longitude: -46.630 },
  { nome: "Zona Sul", latitude: -23.650, longitude: -46.640 },
  { nome: "Zona Leste", latitude: -23.550, longitude: -46.450 },
  { nome: "Zona Oeste", latitude: -23.550, longitude: -46.750 },
  { nome: "Centro", latitude: -23.550, longitude: -46.635 },
  { nome: "Rural", latitude: -23.800, longitude: -46.700 },
];

const nomesBairros: Record<string, string[]> = {
  "Zona Norte": ["Santana", "Tucuruvi", "Vila Maria"],
  "Zona Sul": ["Jabaquara", "Saúde", "Cidade Ademar"],
  "Zona Leste": ["Penha", "Itaquera", "São Miguel"],
  "Zona Oeste": ["Pinheiros", "Butantã", "Rio Pequeno"],
  Centro: ["República", "Sé", "Consolação"],
  Rural: ["Parelheiros", "Marsilac", "Engenheiro Marsilac"],
};

const coordenadasBairros: Record<string, { lat: number; lng: number }[]> = {
  "Zona Norte": [
    { lat: -23.500, lng: -46.620 },
    { lat: -23.480, lng: -46.640 },
    { lat: -23.460, lng: -46.610 },
  ],
  "Zona Sul": [
    { lat: -23.640, lng: -46.640 },
    { lat: -23.630, lng: -46.655 },
    { lat: -23.670, lng: -46.660 },
  ],
  "Zona Leste": [
    { lat: -23.540, lng: -46.460 },
    { lat: -23.560, lng: -46.470 },
    { lat: -23.530, lng: -46.440 },
  ],
  "Zona Oeste": [
    { lat: -23.560, lng: -46.700 },
    { lat: -23.570, lng: -46.720 },
    { lat: -23.540, lng: -46.740 },
  ],
  Centro: [
    { lat: -23.545, lng: -46.640 },
    { lat: -23.550, lng: -46.630 },
    { lat: -23.555, lng: -46.650 },
  ],
  Rural: [
    { lat: -23.780, lng: -46.700 },
    { lat: -23.790, lng: -46.720 },
    { lat: -23.810, lng: -46.680 },
  ],
};

const categorias = [
  "iluminação",
  "pavimentação",
  "saúde",
  "educação",
  "segurança",
  "saneamento",
];

async function main() {
  // Clear existing data
  await prisma.visita.deleteMany();
  await prisma.demanda.deleteMany();
  await prisma.comunidade.deleteMany();
  await prisma.bairro.deleteMany();
  await prisma.regiao.deleteMany();

  const regioes = [];
  for (const r of regioesSP) {
    const regiao = await prisma.regiao.create({
      data: {
        nome: r.nome,
        municipio: "São Paulo",
        uf: "SP",
        latitude: r.latitude,
        longitude: r.longitude,
      },
    });
    regioes.push(regiao);
  }

  const allBairros: { id: string; regiaoNome: string }[] = [];

  for (const regiao of regioes) {
    const bairrosNomes = nomesBairros[regiao.nome] || [];
    const coords = coordenadasBairros[regiao.nome] || [];
    for (let i = 0; i < bairrosNomes.length; i++) {
      const bairro = await prisma.bairro.create({
        data: {
          nome: bairrosNomes[i],
          regiaoId: regiao.id,
          latitude: coords[i]?.lat ?? null,
          longitude: coords[i]?.lng ?? null,
        },
      });
      allBairros.push({ id: bairro.id, regiaoNome: regiao.nome });

      // Create 2 comunidades per bairro
      const offsetLat = (Math.random() - 0.5) * 0.01;
      const offsetLng = (Math.random() - 0.5) * 0.01;
      await prisma.comunidade.createMany({
        data: [
          {
            nome: `${bairrosNomes[i]} - Comunidade A`,
            bairroId: bairro.id,
            latitude: (coords[i]?.lat ?? 0) + offsetLat,
            longitude: (coords[i]?.lng ?? 0) + offsetLng,
          },
          {
            nome: `${bairrosNomes[i]} - Comunidade B`,
            bairroId: bairro.id,
            latitude: (coords[i]?.lat ?? 0) - offsetLat,
            longitude: (coords[i]?.lng ?? 0) - offsetLng,
          },
        ],
      });
    }
  }

  // Create 200 demands distributed across regions
  const demandasData: {
    categoria: string;
    descricao: string;
    status: string;
    prioridade: number;
    regiaoId: string;
    latitude: number;
    longitude: number;
    createdAt: Date;
    resolvedAt: Date | null;
  }[] = [];

  for (const regiao of regioes) {
    const coordsRegiao = regioesSP.find((r) => r.nome === regiao.nome)!;
    for (let i = 0; i < 34; i++) {
      const categoria = categorias[i % categorias.length];
      const statuses = ["aberta", "em_andamento", "resolvida"];
      const status = statuses[i % statuses.length];
      const diasAtras = Math.floor(Math.random() * 180);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - diasAtras);
      const resolvedAt =
        status === "resolvida"
          ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
          : null;

      demandasData.push({
        categoria,
        descricao: `Demanda de ${categoria} na ${regiao.nome} - registro ${i + 1}`,
        status,
        prioridade: Math.floor(Math.random() * 5) + 1,
        regiaoId: regiao.id,
        latitude: coordsRegiao.latitude + (Math.random() - 0.5) * 0.05,
        longitude: coordsRegiao.longitude + (Math.random() - 0.5) * 0.05,
        createdAt,
        resolvedAt,
      });
    }
  }

  await prisma.demanda.createMany({ data: demandasData });

  // Create visits
  const visitasData: {
    titulo: string;
    regiaoId: string;
    data: Date;
  }[] = [];

  for (const regiao of regioes) {
    for (let i = 0; i < 20; i++) {
      const diasAtras = Math.floor(Math.random() * 180);
      const data = new Date();
      data.setDate(data.getDate() - diasAtras);
      visitasData.push({
        titulo: `Visita técnica - ${regiao.nome} (${i + 1})`,
        regiaoId: regiao.id,
        data,
      });
    }
  }

  await prisma.visita.createMany({ data: visitasData });

  const totalDemandas = await prisma.demanda.count();
  const totalVisitas = await prisma.visita.count();
  console.log(`Seed concluído! ${totalDemandas} demandas, ${totalVisitas} visitas`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
