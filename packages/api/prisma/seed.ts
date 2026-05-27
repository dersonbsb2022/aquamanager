import { PrismaClient, WaterType } from '@prisma/client';

const prisma = new PrismaClient();

type RangeDef = { min: number | null; max: number | null };

const TEST_PARAMETERS = [
  { name: 'pH', unit: '—', description: 'Acidez/alcalinidade da água' },
  { name: 'Amônia (NH3/NH4)', unit: 'ppm', description: 'Altamente tóxico para peixes' },
  { name: 'Nitrito (NO2)', unit: 'ppm', description: 'Produto intermediário do ciclo do N' },
  { name: 'Nitrato (NO3)', unit: 'ppm', description: 'Produto final, tóxico em altas conc.' },
  { name: 'KH', unit: '°dH', description: 'Dureza carbonatada / capacidade tampão' },
  { name: 'GH', unit: '°dH', description: 'Dureza geral' },
  { name: 'Temperatura', unit: '°C', description: 'Faixa de conforto térmico' },
  { name: 'CO2', unit: 'mg/L', description: 'Plantas precisam, peixes toleram' },
  { name: 'Oxigênio (O2)', unit: 'mg/L', description: 'Essencial para fauna' },
  { name: 'Fosfato (PO4)', unit: 'ppm', description: 'Nutriente / causador de algas' },
  { name: 'Ferro (Fe)', unit: 'ppm', description: 'Essencial para plantas' },
  { name: 'Cobre (Cu)', unit: 'ppm', description: 'Tóxico para invertebrados' },
  { name: 'Salinidade', unit: 'ppt', description: 'Concentração de sal dissolvido' },
  { name: 'Cálcio (Ca)', unit: 'ppm', description: 'Crítico para corais e invertebrados' },
  { name: 'Magnésio (Mg)', unit: 'ppm', description: 'Estabiliza cálcio e alcalinidade' },
  { name: 'Alcalinidade (dKH)', unit: 'dKH', description: 'Capacidade tampão (medida marinha)' },
] as const;

/** Parâmetro → tipo de água → faixa (null bound = sem limite nesse lado) */
const RANGES: Record<string, Partial<Record<WaterType, RangeDef>>> = {
  pH: {
    FRESHWATER: { min: 6.5, max: 7.5 },
    SALTWATER: { min: 8.0, max: 8.4 },
    BRACKISH: { min: 7.5, max: 8.3 },
  },
  'Amônia (NH3/NH4)': {
    FRESHWATER: { min: 0, max: 0.25 },
    SALTWATER: { min: 0, max: 0.1 },
    BRACKISH: { min: 0, max: 0.25 },
  },
  'Nitrito (NO2)': {
    FRESHWATER: { min: 0, max: 0.25 },
    SALTWATER: { min: 0, max: 0.1 },
    BRACKISH: { min: 0, max: 0.25 },
  },
  'Nitrato (NO3)': {
    FRESHWATER: { min: 0, max: 40 },
    SALTWATER: { min: 0, max: 20 },
    BRACKISH: { min: 0, max: 30 },
  },
  KH: {
    FRESHWATER: { min: 3, max: 8 },
    SALTWATER: { min: 7, max: 11 },
    BRACKISH: { min: 5, max: 12 },
  },
  GH: {
    FRESHWATER: { min: 4, max: 12 },
    BRACKISH: { min: 8, max: 20 },
  },
  Temperatura: {
    FRESHWATER: { min: 24, max: 28 },
    SALTWATER: { min: 24, max: 27 },
    BRACKISH: { min: 24, max: 28 },
  },
  CO2: {
    FRESHWATER: { min: 15, max: 35 },
  },
  'Oxigênio (O2)': {
    FRESHWATER: { min: 5, max: null },
    SALTWATER: { min: 6, max: null },
  },
  'Fosfato (PO4)': {
    FRESHWATER: { min: 0.5, max: 2 },
    SALTWATER: { min: 0, max: 0.03 },
  },
  'Ferro (Fe)': {
    FRESHWATER: { min: 0.1, max: 0.5 },
  },
  'Cobre (Cu)': {
    FRESHWATER: { min: 0, max: 0.03 },
    SALTWATER: { min: 0, max: 0.01 },
  },
  Salinidade: {
    FRESHWATER: { min: 0, max: 1 },
    SALTWATER: { min: 33, max: 35 },
    BRACKISH: { min: 5, max: 15 },
  },
  'Cálcio (Ca)': {
    SALTWATER: { min: 380, max: 450 },
  },
  'Magnésio (Mg)': {
    SALTWATER: { min: 1250, max: 1400 },
  },
  'Alcalinidade (dKH)': {
    SALTWATER: { min: 7, max: 11 },
  },
};

async function main() {
  for (const p of TEST_PARAMETERS) {
    await prisma.testParameter.upsert({
      where: { name: p.name },
      create: {
        name: p.name,
        unit: p.unit,
        description: p.description,
      },
      update: {
        unit: p.unit,
        description: p.description,
      },
    });
  }

  const allParams = await prisma.testParameter.findMany();
  const byName = new Map(allParams.map((tp) => [tp.name, tp]));

  for (const [paramName, byWater] of Object.entries(RANGES)) {
    const tp = byName.get(paramName);
    if (!tp) {
      throw new Error(`Parâmetro não encontrado após upsert: ${paramName}`);
    }
    for (const wt of Object.keys(byWater) as WaterType[]) {
      const r = byWater[wt];
      if (!r) continue;
      await prisma.parameterRange.upsert({
        where: {
          testParameterId_waterType: {
            testParameterId: tp.id,
            waterType: wt,
          },
        },
        create: {
          testParameterId: tp.id,
          waterType: wt,
          idealMin: r.min,
          idealMax: r.max,
        },
        update: {
          idealMin: r.min,
          idealMax: r.max,
        },
      });
    }
  }

  console.log('Seed: test_parameters e parameter_ranges OK.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
