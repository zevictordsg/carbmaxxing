"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion } from "framer-motion";
import styles from "./carb-calculator.module.css";

/**
 * "Protocolo Carbmaxxing" -- interactive calorie-banking / carb-timing
 * calculator. Ported from a standalone artifact the user built (all the
 * math -- TMB, weekly calorie banking, pre/post-workout carb timing zones,
 * food suggestions -- is preserved 1:1) into a real React component reskinned
 * onto the app's own design tokens (see carb-calculator.module.css). Lives
 * on módulo 1's page (src/lib/modules-content.ts marks it via
 * `customTool: "carb-calculator"`), which is why this module's cover has no
 * video lessons -- the calculator *is* its content.
 */

/* ============ DATA ============ */

type Atividade = { id: string; dbId: string; duracao: number; dias: number[] };
type Refeicao = { id: string; label: string; hora: string };
type Objetivo = "recomposicao" | "definicao" | "manutencao";
export type Neat = "sentado" | "moderado" | "exigente";

// Manutenção has no calorie deficit pushing protein up to protect lean mass
// like Definição/Recomposição do, so its floor can sit lower -- 1.6g/kg
// instead of the usual 1.8g/kg minimum.
function proteinMinFor(objetivo: Objetivo): number {
  return objetivo === "manutencao" ? 1.6 : 1.8;
}

export type CalcState = {
  step: number;
  nomeCliente: string;
  sexo: "M" | "F";
  peso: number;
  altura: number;
  idade: number;
  neat: Neat;
  atividades: Atividade[];
  objetivo: Objetivo;
  definicaoPct: number;
  proteinaGkg: number;
  gorduraGkg: number;
  treinoHorario: string;
  treinoDuracao: number;
  refeicoes: Refeicao[];
  despensa: string[];
  // Which day of the week (index into DIAS) gets a "refeição livre", and
  // how many kcal are set aside for it. That day's available carboidrato
  // (the flexing macro) shrinks by the kcal-equivalent of the reserved
  // amount, so the rest of the day's structured meals split what's left --
  // the free meal itself gets no food suggestion, it's the person's call.
  refeicaoLivreDia: number;
  refeicaoLivreKcal: number;
};

const ACTIVITIES_DB = [
  { id: "musculacao", nome: "Musculação (treino de força)", met: 6.0 },
  { id: "corrida_leve", nome: "Corrida leve (~8km/h)", met: 8.3 },
  { id: "corrida_mod", nome: "Corrida moderada (~10km/h)", met: 9.8 },
  { id: "corrida_forte", nome: "Corrida forte (~12km/h)", met: 11.8 },
  { id: "caminhada_leve", nome: "Caminhada leve", met: 3.5 },
  { id: "caminhada_rapida", nome: "Caminhada rápida", met: 4.5 },
  { id: "ciclismo_leve", nome: "Ciclismo leve", met: 6.0 },
  { id: "ciclismo_forte", nome: "Ciclismo forte", met: 8.5 },
  { id: "natacao", nome: "Natação", met: 7.0 },
  { id: "hiit", nome: "HIIT / funcional", met: 8.5 },
  { id: "crossfit", nome: "Crossfit", met: 8.0 },
  { id: "yoga", nome: "Yoga / pilates", met: 3.0 },
  { id: "esporte", nome: "Esporte de quadra (futebol, basquete...)", met: 7.5 },
  { id: "danca", nome: "Dança", met: 4.8 },
  { id: "custom", nome: "Outra atividade (personalizada)", met: 5.0 },
] as const;

function actById(id: string) {
  return ACTIVITIES_DB.find((a) => a.id === id) ?? ACTIVITIES_DB[0];
}

type FoodCat = "carboidrato" | "proteina" | "gordura" | "misto";
// Which meal(s) this food actually fits at, in a real day -- arroz and
// tilápia don't belong at breakfast just because they're "carboidrato" and
// "proteina". "cafe" = café da manhã, "principal" = almoço/jantar-style
// meal, "lanche" = lanche/pré-treino/pós-treino/qualquer coisa entre
// refeições. Most foods fit more than one.
type MealType = "cafe" | "principal" | "lanche";
type Food = {
  id: string;
  nome: string;
  cat: FoodCat;
  vel: "rapido" | "lento" | null;
  kcal: number;
  p: number;
  g: number;
  c: number;
  mt: MealType[];
};

const FOOD_DB: Food[] = [
  { id: "arroz_branco", nome: "Arroz branco cozido", cat: "carboidrato", vel: "rapido", kcal: 130, p: 2.7, g: 0.3, c: 28, mt: ["principal"] },
  { id: "arroz_integral", nome: "Arroz integral cozido", cat: "carboidrato", vel: "lento", kcal: 123, p: 2.6, g: 1.0, c: 25.8, mt: ["principal"] },
  { id: "batata_doce", nome: "Batata doce cozida", cat: "carboidrato", vel: "lento", kcal: 86, p: 1.6, g: 0.1, c: 20, mt: ["principal", "lanche"] },
  { id: "batata_inglesa", nome: "Batata inglesa cozida", cat: "carboidrato", vel: "rapido", kcal: 87, p: 1.9, g: 0.1, c: 20.1, mt: ["principal"] },
  { id: "aveia", nome: "Aveia em flocos", cat: "carboidrato", vel: "lento", kcal: 389, p: 16.9, g: 6.9, c: 66.3, mt: ["cafe", "lanche"] },
  { id: "pao_frances", nome: "Pão francês", cat: "carboidrato", vel: "rapido", kcal: 300, p: 8, g: 3, c: 58, mt: ["cafe"] },
  { id: "pao_integral", nome: "Pão integral", cat: "carboidrato", vel: "lento", kcal: 253, p: 9.4, g: 3.4, c: 43.3, mt: ["cafe", "lanche"] },
  { id: "banana", nome: "Banana", cat: "carboidrato", vel: "rapido", kcal: 89, p: 1.1, g: 0.3, c: 22.8, mt: ["cafe", "lanche"] },
  { id: "maca", nome: "Maçã", cat: "carboidrato", vel: "lento", kcal: 52, p: 0.3, g: 0.2, c: 13.8, mt: ["cafe", "lanche"] },
  { id: "mamao", nome: "Mamão", cat: "carboidrato", vel: "rapido", kcal: 43, p: 0.5, g: 0.3, c: 11, mt: ["cafe", "lanche"] },
  { id: "mel", nome: "Mel", cat: "carboidrato", vel: "rapido", kcal: 304, p: 0.3, g: 0, c: 82.4, mt: ["cafe", "lanche"] },
  { id: "dextrose", nome: "Dextrose / maltodextrina", cat: "carboidrato", vel: "rapido", kcal: 380, p: 0, g: 0, c: 95, mt: ["lanche"] },
  { id: "feijao", nome: "Feijão carioca cozido", cat: "carboidrato", vel: "lento", kcal: 76, p: 4.8, g: 0.5, c: 13.6, mt: ["principal"] },
  { id: "macarrao", nome: "Macarrão cozido", cat: "carboidrato", vel: "lento", kcal: 131, p: 5, g: 1.1, c: 25, mt: ["principal"] },
  { id: "tapioca", nome: "Tapioca (goma hidratada)", cat: "carboidrato", vel: "rapido", kcal: 140, p: 0, g: 0, c: 34, mt: ["cafe", "lanche"] },
  { id: "quinoa", nome: "Quinoa cozida", cat: "carboidrato", vel: "lento", kcal: 120, p: 4.4, g: 1.9, c: 21.3, mt: ["principal"] },
  { id: "cuscuz", nome: "Cuscuz cozido", cat: "carboidrato", vel: "lento", kcal: 112, p: 2.1, g: 0.2, c: 23.6, mt: ["cafe", "principal"] },
  { id: "frango", nome: "Peito de frango grelhado", cat: "proteina", vel: null, kcal: 165, p: 31, g: 3.6, c: 0, mt: ["principal"] },
  { id: "ovo", nome: "Ovo inteiro cozido", cat: "proteina", vel: null, kcal: 155, p: 13, g: 11, c: 1.1, mt: ["cafe", "principal"] },
  { id: "clara", nome: "Clara de ovo", cat: "proteina", vel: null, kcal: 52, p: 11, g: 0.2, c: 0.7, mt: ["cafe", "principal", "lanche"] },
  { id: "patinho", nome: "Carne bovina magra (patinho)", cat: "proteina", vel: null, kcal: 163, p: 26, g: 6, c: 0, mt: ["principal"] },
  { id: "tilapia", nome: "Tilápia", cat: "proteina", vel: null, kcal: 96, p: 20, g: 1.7, c: 0, mt: ["principal"] },
  { id: "atum", nome: "Atum em água", cat: "proteina", vel: null, kcal: 116, p: 26, g: 1, c: 0, mt: ["principal", "lanche"] },
  { id: "whey", nome: "Whey protein isolado (pó)", cat: "proteina", vel: null, kcal: 375, p: 80, g: 3, c: 6, mt: ["lanche"] },
  { id: "iogurte_grego", nome: "Iogurte grego natural", cat: "proteina", vel: null, kcal: 97, p: 9, g: 5, c: 3.6, mt: ["cafe", "lanche"] },
  { id: "cottage", nome: "Queijo cottage", cat: "proteina", vel: null, kcal: 98, p: 11, g: 4.3, c: 3.4, mt: ["cafe", "lanche"] },
  { id: "azeite", nome: "Azeite de oliva extra virgem", cat: "gordura", vel: null, kcal: 884, p: 0, g: 100, c: 0, mt: ["principal"] },
  { id: "abacate", nome: "Abacate", cat: "gordura", vel: null, kcal: 160, p: 2, g: 14.7, c: 8.5, mt: ["cafe", "lanche", "principal"] },
  { id: "castanha_para", nome: "Castanha do Pará", cat: "gordura", vel: null, kcal: 656, p: 14.3, g: 66.4, c: 12.3, mt: ["lanche"] },
  { id: "amendoas", nome: "Amêndoas", cat: "gordura", vel: null, kcal: 579, p: 21.2, g: 49.9, c: 21.6, mt: ["lanche"] },
  { id: "pasta_amendoim", nome: "Pasta de amendoim integral", cat: "gordura", vel: null, kcal: 588, p: 25, g: 50, c: 20, mt: ["cafe", "lanche"] },
  { id: "manteiga", nome: "Manteiga", cat: "gordura", vel: null, kcal: 717, p: 0.9, g: 81, c: 0.1, mt: ["cafe"] },
  { id: "leite", nome: "Leite integral", cat: "misto", vel: "lento", kcal: 61, p: 3.2, g: 3.3, c: 4.8, mt: ["cafe", "lanche"] },
  { id: "iogurte_integral", nome: "Iogurte natural integral", cat: "misto", vel: "lento", kcal: 61, p: 3.5, g: 3, c: 4.7, mt: ["cafe", "lanche"] },
  // -- ampliação da lista (mais variedade de opções por categoria, pra sugestão
  // de refeição não repetir sempre o mesmo alimento) --
  { id: "mandioca", nome: "Mandioca (aipim) cozida", cat: "carboidrato", vel: "lento", kcal: 125, p: 1.4, g: 0.3, c: 30, mt: ["principal"] },
  { id: "pao_forma", nome: "Pão de forma tradicional", cat: "carboidrato", vel: "rapido", kcal: 265, p: 9, g: 3.3, c: 50, mt: ["cafe", "lanche"] },
  { id: "milho_verde", nome: "Milho verde cozido", cat: "carboidrato", vel: "rapido", kcal: 96, p: 3.2, g: 1.2, c: 19, mt: ["principal", "lanche"] },
  { id: "uva", nome: "Uva", cat: "carboidrato", vel: "rapido", kcal: 69, p: 0.6, g: 0.2, c: 18, mt: ["cafe", "lanche"] },
  { id: "granola", nome: "Granola", cat: "carboidrato", vel: "lento", kcal: 471, p: 10, g: 20, c: 60, mt: ["cafe", "lanche"] },
  { id: "salmao", nome: "Salmão grelhado", cat: "proteina", vel: null, kcal: 208, p: 20, g: 13, c: 0, mt: ["principal"] },
  { id: "carne_moida", nome: "Carne moída magra", cat: "proteina", vel: null, kcal: 172, p: 20, g: 10, c: 0, mt: ["principal"] },
  { id: "camarao", nome: "Camarão cozido", cat: "proteina", vel: null, kcal: 99, p: 24, g: 0.3, c: 0.2, mt: ["principal"] },
  { id: "peito_peru", nome: "Peito de peru fatiado", cat: "proteina", vel: null, kcal: 135, p: 22, g: 4.6, c: 1.9, mt: ["cafe", "lanche"] },
  { id: "castanha_caju", nome: "Castanha de caju", cat: "gordura", vel: null, kcal: 553, p: 18, g: 44, c: 30, mt: ["lanche"] },
  { id: "queijo_parmesao", nome: "Queijo parmesão", cat: "gordura", vel: null, kcal: 392, p: 35, g: 26, c: 3.2, mt: ["principal"] },
  { id: "gergelim", nome: "Pasta de gergelim (tahine)", cat: "gordura", vel: null, kcal: 595, p: 17, g: 54, c: 21, mt: ["principal", "lanche"] },
  { id: "chia", nome: "Chia (semente)", cat: "misto", vel: "lento", kcal: 486, p: 17, g: 31, c: 42, mt: ["cafe", "lanche"] },
  { id: "queijo_minas", nome: "Queijo minas frescal", cat: "misto", vel: null, kcal: 264, p: 17.4, g: 20, c: 3, mt: ["cafe", "lanche"] },
  { id: "leite_desnatado", nome: "Leite desnatado", cat: "misto", vel: "lento", kcal: 35, p: 3.4, g: 0.2, c: 5, mt: ["cafe", "lanche"] },
  // -- segunda ampliação (mais opções por categoria: leguminosas, peixes e
  // proteínas vegetarianas, gorduras de cozinha, frutas, pra dar mais
  // variedade real na montagem da dieta) --
  { id: "inhame", nome: "Inhame cozido", cat: "carboidrato", vel: "lento", kcal: 97, p: 1.5, g: 0.2, c: 23.2, mt: ["principal"] },
  { id: "batata_baroa", nome: "Batata baroa (mandioquinha) cozida", cat: "carboidrato", vel: "lento", kcal: 80, p: 1.5, g: 0.3, c: 18.6, mt: ["principal"] },
  { id: "pipoca", nome: "Pipoca (sem óleo/manteiga)", cat: "carboidrato", vel: "lento", kcal: 375, p: 13, g: 4.5, c: 74, mt: ["lanche"] },
  { id: "lentilha", nome: "Lentilha cozida", cat: "carboidrato", vel: "lento", kcal: 93, p: 6.3, g: 0.5, c: 16.3, mt: ["principal"] },
  { id: "grao_de_bico", nome: "Grão-de-bico cozido", cat: "carboidrato", vel: "lento", kcal: 121, p: 8.4, g: 2.1, c: 20, mt: ["principal"] },
  { id: "ervilha", nome: "Ervilha cozida", cat: "carboidrato", vel: "lento", kcal: 81, p: 5.4, g: 0.4, c: 14.5, mt: ["principal"] },
  { id: "pera", nome: "Pera", cat: "carboidrato", vel: "lento", kcal: 57, p: 0.4, g: 0.1, c: 15, mt: ["cafe", "lanche"] },
  { id: "abacaxi", nome: "Abacaxi", cat: "carboidrato", vel: "rapido", kcal: 50, p: 0.5, g: 0.1, c: 13, mt: ["cafe", "lanche"] },
  { id: "morango", nome: "Morango", cat: "carboidrato", vel: "rapido", kcal: 32, p: 0.7, g: 0.3, c: 7.7, mt: ["cafe", "lanche"] },
  { id: "melancia", nome: "Melancia", cat: "carboidrato", vel: "rapido", kcal: 30, p: 0.6, g: 0.2, c: 7.6, mt: ["lanche"] },
  { id: "wrap_integral", nome: "Wrap / tortilha integral", cat: "carboidrato", vel: "lento", kcal: 280, p: 9, g: 4, c: 50, mt: ["cafe", "principal", "lanche"] },
  { id: "lombo_suino", nome: "Lombo suíno grelhado", cat: "proteina", vel: null, kcal: 195, p: 27, g: 9, c: 0, mt: ["principal"] },
  { id: "peixe_branco", nome: "Peixe branco grelhado (pescada/linguado)", cat: "proteina", vel: null, kcal: 90, p: 18, g: 1.5, c: 0, mt: ["principal"] },
  { id: "tofu", nome: "Tofu grelhado", cat: "proteina", vel: null, kcal: 76, p: 8, g: 4.8, c: 1.9, mt: ["principal", "lanche"] },
  { id: "pts", nome: "Proteína de soja texturizada (hidratada)", cat: "proteina", vel: null, kcal: 89, p: 13, g: 0.5, c: 8, mt: ["principal", "lanche"] },
  { id: "oleo_coco", nome: "Óleo de coco", cat: "gordura", vel: null, kcal: 862, p: 0, g: 100, c: 0, mt: ["principal"] },
  { id: "leite_coco", nome: "Leite de coco", cat: "gordura", vel: null, kcal: 230, p: 2.3, g: 24, c: 6, mt: ["cafe", "lanche", "principal"] },
  { id: "macadamia", nome: "Macadâmia", cat: "gordura", vel: null, kcal: 718, p: 7.9, g: 75.8, c: 13.8, mt: ["lanche"] },
  { id: "nozes", nome: "Nozes", cat: "gordura", vel: null, kcal: 654, p: 15, g: 65, c: 14, mt: ["lanche"] },
  { id: "azeitona", nome: "Azeitona", cat: "gordura", vel: null, kcal: 115, p: 0.8, g: 10.7, c: 6.3, mt: ["principal"] },
  { id: "kefir", nome: "Kefir natural", cat: "misto", vel: "lento", kcal: 55, p: 3.3, g: 2.5, c: 4.5, mt: ["cafe", "lanche"] },
  { id: "ricota", nome: "Ricota", cat: "misto", vel: null, kcal: 140, p: 11, g: 10, c: 3.8, mt: ["cafe", "lanche"] },
];
function foodById(id: string) {
  return FOOD_DB.find((f) => f.id === id) ?? null;
}

export const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
export const NEAT_MULT: Record<Neat, number> = { sentado: 1.1, moderado: 1.2, exigente: 1.35 };

export const defaultState: CalcState = {
  step: 0,
  nomeCliente: "",
  sexo: "M",
  peso: 78,
  altura: 178,
  idade: 29,
  neat: "moderado",
  atividades: [
    { id: "a1", dbId: "musculacao", duracao: 60, dias: [0, 1, 3, 4] },
    { id: "a2", dbId: "corrida_mod", duracao: 35, dias: [2] },
  ],
  objetivo: "definicao",
  definicaoPct: 17,
  proteinaGkg: 2.0,
  gorduraGkg: 0.9,
  treinoHorario: "18:00",
  treinoDuracao: 70,
  refeicoes: [
    { id: "m1", label: "Café da manhã", hora: "07:00" },
    { id: "m2", label: "Almoço", hora: "12:30" },
    { id: "m3", label: "Lanche pré-treino", hora: "17:45" },
    { id: "m4", label: "Pós-treino", hora: "19:30" },
    { id: "m5", label: "Jantar", hora: "21:30" },
  ],
  despensa: [
    "arroz_branco",
    "arroz_integral",
    "batata_doce",
    "aveia",
    "mandioca",
    "tapioca",
    "banana",
    "feijao",
    "frango",
    "ovo",
    "whey",
    "patinho",
    "tilapia",
    "salmao",
    "iogurte_grego",
    "azeite",
    "pasta_amendoim",
    "abacate",
    "amendoas",
    "leite",
    "queijo_minas",
    "grao_de_bico",
    "peixe_branco",
    "castanha_caju",
    "morango",
    "pera",
  ],
  refeicaoLivreDia: 5,
  refeicaoLivreKcal: 500,
};

const STORAGE_KEY = "carbmaxxing_calc_v1";
const STEPS = ["Dados", "Rotina", "Objetivo", "Refeição livre", "Treino", "Alimentos", "Resultado"];

/* ============ CALC ENGINE (pure) ============ */

export function calcTMB(s: CalcState) {
  const base = 10 * s.peso + 6.25 * s.altura - 5 * s.idade;
  return s.sexo === "M" ? base + 5 : base - 161;
}

// Tabelas de MET (usadas pra estimar o gasto de cada sessão de treino)
// consistentemente superestimam o gasto real medido por calorimetria,
// principalmente em treino de força -- aplicamos uma redução conservadora
// em vez de usar o valor bruto da tabela.
export const SESSION_EFFICIENCY = 0.9;

// Margem de segurança sobre a meta calórica semanal final: não deriva de
// nenhum fator de atividade, é um buffer fixo por cima de tudo (baseline +
// treinos + objetivo) pra compensar erro de estimativa acumulado --
// variação individual de NEAT, adaptação metabólica, imprecisão dos MET.
// Como carboidrato é o macro que "flexiona" (proteína/gordura ficam fixas),
// essa margem cai desproporcionalmente sobre o carboidrato, não sobre elas.
export const SAFETY_MARGIN = 0.08;

function sessionKcal(s: CalcState, act: Atividade) {
  const met = actById(act.dbId).met;
  const dur = Number(act.duracao) || 0;
  return ((met * 3.5 * Number(s.peso)) / 200) * dur * SESSION_EFFICIENCY;
}

function dailyActivityKcal(s: CalcState, dayIndex: number) {
  return s.atividades.reduce((total, a) => (a.dias.includes(dayIndex) ? total + sessionKcal(s, a) : total), 0);
}

// Kcal burned specifically by musculação (resistance training) on this day
// -- used to steer extra carbs at training days that actually deplete
// glycogen and drive hypertrophy, instead of just whichever day burns the
// most calories overall (a hard cardio session can out-burn a lifting
// session on paper without needing the same carb refeed).
function muscKcal(s: CalcState, dayIndex: number) {
  return s.atividades.reduce((total, a) => (a.dbId === "musculacao" && a.dias.includes(dayIndex) ? total + sessionKcal(s, a) : total), 0);
}

function goalPct(s: CalcState) {
  if (s.objetivo === "recomposicao") return 0.1;
  if (s.objetivo === "definicao") return Number(s.definicaoPct) / 100;
  return 0;
}

type BankingDay = {
  label: string;
  i: number;
  act: number;
  tdee: number;
  isTraining: boolean;
  carbG: number;
  lowCarb: boolean;
  target: number;
  refeicaoLivreKcal: number;
  isFreeDay: boolean;
};

export function computeBanking(s: CalcState) {
  const tmb = calcTMB(s);
  const baseline = tmb * NEAT_MULT[s.neat];
  const days: BankingDay[] = DIAS.map((label, i) => {
    const act = dailyActivityKcal(s, i);
    return { label, i, act, tdee: baseline + act, isTraining: act > 1, carbG: 0, lowCarb: false, target: 0, refeicaoLivreKcal: 0, isFreeDay: false };
  });
  const weeklyTDEE = days.reduce((sum, d) => sum + d.tdee, 0);

  const pct = goalPct(s);
  const weeklyTarget = weeklyTDEE * (1 - pct) * (1 - SAFETY_MARGIN);

  const proteinG = s.proteinaGkg * s.peso;
  const fatG = s.gorduraGkg * s.peso;
  const proteinKcal = proteinG * 4;
  const fatKcal = fatG * 9;
  const floorKcalPerDay = proteinKcal + fatKcal;

  // Refeição livre: o valor escolhido sai de dentro do total semanal, não
  // é somado por cima dele -- ex. semana de 21.000kcal com 5.000kcal de
  // refeição livre vira 16.000kcal pra distribuir nos outros 6 dias. O dia
  // escolhido vira um "dia livre": fica de fora de toda a lógica de
  // proteína/gordura/carboidrato fixos, sem prescrição nenhuma -- só a
  // própria fatia reservada como meta do dia.
  const hasFreeDay = s.refeicaoLivreKcal > 0;
  const freeDayIndex = hasFreeDay ? s.refeicaoLivreDia : -1;
  const reservedKcal = hasFreeDay ? Math.round(s.refeicaoLivreKcal) : 0;
  const structuredDays = days.filter((d) => d.i !== freeDayIndex);
  const structuredCount = structuredDays.length || 1;

  const structuredWeeklyTarget = weeklyTarget - reservedKcal;
  const totalMuscKcal = structuredDays.reduce((sum, d) => sum + muscKcal(s, d.i), 0);

  // Carboidrato é o macro que "flexiona" no calorie banking: proteína e
  // gordura ficam fixas todo dia (vêm do g/kg), o carboidrato absorve o
  // resto. 55% do carboidrato disponível é dividido igual entre os dias
  // estruturados (piso de segurança pros dias sem treino), 45% é
  // redistribuído proporcional ao gasto de MUSCULAÇÃO de cada dia -- só
  // dias com musculação disputam essa fatia extra, pra garantir que sejam
  // sempre os dias com mais carboidrato (é o treino que mais depende de
  // glicogênio e mais se beneficia do carb refeed -- uma corrida forte
  // pode gastar mais kcal no papel que uma sessão de musculação sem
  // precisar do mesmo refeed de carboidrato).
  let carbPoolKcal = structuredWeeklyTarget - structuredCount * floorKcalPerDay;
  const bankingWarning = carbPoolKcal < structuredCount * 50 * 4; // menos de ~50g/dia de piso
  if (carbPoolKcal < 0) carbPoolKcal = 0;

  const evenPortion = carbPoolKcal * 0.55;
  const weightedPortion = carbPoolKcal * 0.45;
  const evenShareKcal = evenPortion / structuredCount;

  days.forEach((d) => {
    if (hasFreeDay && d.i === freeDayIndex) {
      d.isFreeDay = true;
      d.refeicaoLivreKcal = reservedKcal;
      d.carbG = 0;
      d.lowCarb = false;
      d.target = reservedKcal;
      return;
    }
    const dMusc = muscKcal(s, d.i);
    const weightedShareKcal = totalMuscKcal > 0 ? weightedPortion * (dMusc / totalMuscKcal) : weightedPortion / structuredCount;
    const dayCarbKcal = evenShareKcal + weightedShareKcal;
    d.carbG = Math.round(dayCarbKcal / 4);
    d.lowCarb = dayCarbKcal / 4 < 50;
    d.target = Math.round(floorKcalPerDay + dayCarbKcal);
  });

  const weeklyTargetRounded = days.reduce((sum, d) => sum + d.target, 0);

  return {
    tmb: Math.round(tmb),
    baseline: Math.round(baseline),
    days,
    weeklyTDEE: Math.round(weeklyTDEE),
    weeklyTarget: Math.round(weeklyTargetRounded),
    pct,
    proteinG: Math.round(proteinG),
    fatG: Math.round(fatG),
    proteinKcal: Math.round(proteinKcal),
    fatKcal: Math.round(fatKcal),
    bankingWarning,
    safetyMargin: SAFETY_MARGIN,
  };
}

export function minsOfDay(hhmm: string) {
  const parts = (hhmm || "00:00").split(":");
  return (Number(parts[0]) || 0) * 60 + (Number(parts[1]) || 0);
}
export function fmtMin(mins: number) {
  const m = ((Math.round(mins) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm;
}

export type ZoneKey = "risco" | "completa" | "imediato" | "durante" | "pos" | "livre";

export function computeZones(treinoHorario: string, treinoDuracao: number) {
  const t0 = minsOfDay(treinoHorario);
  const dur = Number(treinoDuracao) || 60;
  const t1 = t0 + dur;
  return {
    t0,
    t1,
    risco: [t0 - 90, t0 - 45] as [number, number],
    completa: [t0 - 240, t0 - 180] as [number, number],
    imediato: [t0 - 15, t0] as [number, number],
    durante: [t0, t1] as [number, number],
    pos: [t1, t1 + 180] as [number, number],
  };
}

export function normalizeToTraining(mealMin: number, t0: number) {
  const cands = [mealMin - 1440, mealMin, mealMin + 1440];
  let best = cands[0];
  cands.forEach((c) => {
    if (Math.abs(c - t0) < Math.abs(best - t0)) best = c;
  });
  return best;
}

export const ZONE_META: Record<ZoneKey, { label: string; color: string; soft: string; weight: number; rec: string }> = {
  risco: {
    label: "Zona de risco",
    color: "#b5583f",
    soft: "rgba(181,88,63,0.14)",
    weight: 1,
    rec: "Evite carboidrato rápido isolado aqui. A insulina sobe, puxa glicose pra célula, e o treino começa em queda de açúcar — sensação de fraqueza no meio do treino. Se der, mova essa refeição pra fora da janela.",
  },
  completa: {
    label: "Refeição completa",
    color: "#b7b3a8",
    soft: "rgba(183,179,168,0.12)",
    weight: 2.5,
    rec: "3 a 4h antes do treino. Carboidrato lento ou misto, sempre com proteína e gordura — dá tempo de insulina e glicemia normalizarem antes do esforço.",
  },
  imediato: {
    label: "Pré-treino imediato",
    color: "#f0eee7",
    soft: "rgba(240,238,231,0.12)",
    weight: 1.5,
    rec: "5 a 15 min antes do treino. O esforço começa antes do pico de insulina — carboidrato rápido isolado é seguro e ideal aqui.",
  },
  durante: {
    label: "Durante o treino",
    color: "#f0eee7",
    soft: "rgba(240,238,231,0.12)",
    weight: 1.5,
    rec: "A captação de glicose passa a ser dominada pela contração muscular (via GLUT4), independente de insulina. Carboidrato rápido é seguro.",
  },
  pos: {
    label: "Pós-treino",
    color: "#f0eee7",
    soft: "rgba(240,238,231,0.12)",
    weight: 3,
    rec: "Até 3h depois do treino. Sensibilidade à insulina fica elevada por 24-48h — o músculo funciona como esponja de glicose. Qualquer tipo de carboidrato serve aqui, mesmo com pico atrasado por gordura/fibra.",
  },
  livre: {
    label: "Fora das janelas prioritárias",
    color: "#4d4a44",
    soft: "rgba(77,74,68,0.2)",
    weight: 1,
    rec: "Sem exigência específica de timing. Só evite concentrar carboidrato rápido isolado colado na zona de risco.",
  },
};
export const ZONE_ORDER = ["completa", "risco", "imediato", "durante", "pos"] as const satisfies readonly Exclude<ZoneKey, "livre">[];

export function classify(mealMin: number, z: ReturnType<typeof computeZones>): ZoneKey {
  const m = normalizeToTraining(mealMin, z.t0);
  if (m >= z.risco[0] && m < z.risco[1]) return "risco";
  if (m >= z.completa[0] && m < z.completa[1]) return "completa";
  if (m >= z.imediato[0] && m < z.imediato[1]) return "imediato";
  if (m >= z.durante[0] && m <= z.durante[1]) return "durante";
  if (m > z.pos[0] && m <= z.pos[1]) return "pos";
  return "livre";
}

/* ============ SMALL UI HELPERS ============ */

function StepHead({ num, eyebrow, title, hint }: { num: string; eyebrow: string; title: string; hint: string }) {
  return (
    <div className={styles.stepHead}>
      <div className={`${styles.stepBignum} heading-tight`}>{num}</div>
      <div>
        <div className={`${styles.stepEyebrow} label-loose`}>{eyebrow}</div>
        <h2 className={`${styles.stepTitle} heading-tight-2`}>{title}</h2>
        <p className={styles.stepHint}>{hint}</p>
      </div>
    </div>
  );
}

function SectionLabel({ children, first = false }: { children: React.ReactNode; first?: boolean }) {
  return <div className={`${styles.sectionLabel} ${first ? styles.sectionLabelFirst : ""}`}>{children}</div>;
}

/**
 * Animates a number counting up to its target whenever `to` changes --
 * every result on the Resultado step uses this instead of a static number,
 * so recalculating (editing a field, coming back to this step) reads as
 * the tool actually crunching your numbers rather than a static swap.
 */
function CountUp({ to, decimals = 0, format }: { to: number; decimals?: number; format?: (n: number) => string }) {
  const [value, setValue] = useState(to);
  const prev = useRef(to);

  useEffect(() => {
    const controls = animate(prev.current, to, {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setValue(latest),
    });
    prev.current = to;
    return () => controls.stop();
  }, [to]);

  const text = format ? format(value) : Math.round(value).toLocaleString("pt-BR");
  return <>{decimals ? value.toFixed(decimals) : text}</>;
}

/* ============ COMPONENT ============ */

export function CarbCalculator() {
  const uidCounter = useRef(100);
  function nextId() {
    uidCounter.current += 1;
    return "x" + uidCounter.current;
  }

  const [state, setState] = useState<CalcState>(defaultState);
  const [usingExample, setUsingExample] = useState(true);
  // 1 = advancing (slide in from the right), -1 = going back (slide in
  // from the left) -- drives the step transition direction below.
  const [direction, setDirection] = useState(1);
  const loaded = useRef(false);

  // Load any saved run once on mount (client-only -- localStorage doesn't
  // exist during SSR).
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        // One-time hydration from localStorage, deliberately deferred to an
        // effect (not a useState lazy initializer) so the first client
        // render matches the server-rendered default-example state -- doing
        // it in the initializer would read localStorage during render and
        // risk a hydration mismatch.
        // Merged onto defaultState (not a bare replace) so a save from
        // before a field existed (e.g. refeicaoLivreDia/refeicaoLivreKcal)
        // still fills in a valid default instead of coming back undefined
        // and crashing something like RangeField's value.toFixed(decimals).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState({ ...defaultState, ...JSON.parse(saved) });
        setUsingExample(false);
      }
    } catch {
      // ignore -- keep default example state
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable (private mode, quota) -- non-fatal, just won't persist
    }
  }, [state]);

  function update(patch: Partial<CalcState>) {
    setUsingExample(false);
    setState((s) => ({ ...s, ...patch }));
  }
  function goStep(n: number) {
    setDirection(n >= state.step ? 1 : -1);
    setState((s) => ({ ...s, step: n }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addActivity() {
    update({ atividades: [...state.atividades, { id: nextId(), dbId: "musculacao", duracao: 60, dias: [] }] });
  }
  function removeActivity(id: string) {
    update({ atividades: state.atividades.filter((a) => a.id !== id) });
  }
  function updateActivity(id: string, patch: Partial<Atividade>) {
    update({ atividades: state.atividades.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
  }
  function toggleActivityDay(id: string, day: number) {
    update({
      atividades: state.atividades.map((a) => {
        if (a.id !== id) return a;
        const on = a.dias.includes(day);
        return { ...a, dias: on ? a.dias.filter((d) => d !== day) : [...a.dias, day] };
      }),
    });
  }

  function addMeal() {
    update({ refeicoes: [...state.refeicoes, { id: nextId(), label: "Nova refeição", hora: "15:00" }] });
  }
  function removeMeal(id: string) {
    update({ refeicoes: state.refeicoes.filter((r) => r.id !== id) });
  }
  function updateMeal(id: string, patch: Partial<Refeicao>) {
    update({ refeicoes: state.refeicoes.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  }

  function toggleFood(id: string) {
    const on = state.despensa.includes(id);
    update({ despensa: on ? state.despensa.filter((f) => f !== id) : [...state.despensa, id] });
  }

  const b = computeBanking(state);

  return (
    <div className={styles.toolwrap}>
      <div className={`${styles.blob} ${styles.blob1}`} aria-hidden />
      <div className={`${styles.blob} ${styles.blob2}`} aria-hidden />

      <div className={styles.toolhead}>
        <p className={`label-loose ${styles.stepEyebrow}`} style={{ marginBottom: 8 }}>
          [Ferramenta interativa]
        </p>
        <h2 className="heading-tight-2 text-2xl text-white sm:text-3xl">Protocolo Carbmaxxing</h2>
        <p>
          Calorie banking da sua semana e o horário certo pra comer carboidrato em volta do treino —
          calculado a partir dos seus próprios números, não de uma tabela genérica.
        </p>
      </div>

      <div className={styles.frame}>
        <nav className={styles.stepsnav}>
          {STEPS.map((label, i) => (
            <motion.button
              key={label}
              type="button"
              whileTap={{ scale: 0.94 }}
              className={`${styles.steppill} ${i === state.step ? styles.isActive : ""} ${i < state.step ? styles.isDone : ""}`}
              onClick={() => goStep(i)}
            >
              <span className={styles.num}>{i < state.step ? "✓" : i + 1}</span>
              {label}
            </motion.button>
          ))}
        </nav>

        <main style={{ overflow: "hidden" }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={state.step}
              initial={{ opacity: 0, x: direction * 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -28 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              {state.step === 0 && <Step0 state={state} update={update} />}
              {state.step === 1 && (
                <Step1 state={state} addActivity={addActivity} removeActivity={removeActivity} updateActivity={updateActivity} toggleActivityDay={toggleActivityDay} update={update} />
              )}
              {state.step === 2 && <Step2 state={state} update={update} />}
              {state.step === 3 && <StepFree state={state} update={update} />}
              {state.step === 4 && (
                <Step3 state={state} addMeal={addMeal} removeMeal={removeMeal} updateMeal={updateMeal} update={update} />
              )}
              {state.step === 5 && <Step4 state={state} toggleFood={toggleFood} />}
              {state.step === 6 && <Step5 state={state} banking={b} usingExample={usingExample} update={update} goStep={goStep} />}
            </motion.div>
          </AnimatePresence>
        </main>

        <div className={`${styles.stepactions} ${styles.noPrint}`}>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            className={`${styles.btn} ${styles.btnGhost}`}
            style={{ visibility: state.step === 0 ? "hidden" : "visible" }}
            onClick={() => goStep(Math.max(0, state.step - 1))}
          >
            Voltar
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.015 }}
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => goStep(Math.min(STEPS.length - 1, state.step + 1))}
          >
            {state.step === STEPS.length - 1 ? "Recalcular" : "Continuar"}
          </motion.button>
        </div>
      </div>

      <div className={`${styles.toolfoot} ${styles.noPrint}`}>
        <p>
          Conteúdo educativo — não substitui acompanhamento nutricional ou médico individualizado. As
          janelas de tempo usadas aqui vêm de estudos com protocolos controlados; existe variação
          individual. Ajuste conforme sua resposta.
        </p>
      </div>
    </div>
  );
}

/* ============ STEP 0 -- Dados pessoais ============ */

function FieldNumber({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className={styles.field}>
      <label>{label}</label>
      <input type="number" value={value} min={min} max={max} step={step || 1} onChange={(e) => onChange(Number(e.target.value))} />
      {unit && <span className={styles.unit}>{unit}</span>}
    </div>
  );
}

function Step0({ state, update }: { state: CalcState; update: (p: Partial<CalcState>) => void }) {
  return (
    <>
      <StepHead num="01" eyebrow="[Passo 01 · Dados pessoais]" title="Quem é você, fisicamente." hint="Só o essencial pra calcular sua taxa metabólica basal (fórmula de Mifflin-St Jeor)." />
      <div className={`${styles.grid} ${styles.grid2}`} style={{ marginBottom: 20 }}>
        <div className={styles.field}>
          <label>Sexo</label>
          <div className={styles.toggleGroup}>
            <button type="button" className={`${styles.toggleBtn} ${state.sexo === "M" ? styles.toggleBtnOn : ""}`} onClick={() => update({ sexo: "M" })}>
              Masculino
            </button>
            <button type="button" className={`${styles.toggleBtn} ${state.sexo === "F" ? styles.toggleBtnOn : ""}`} onClick={() => update({ sexo: "F" })}>
              Feminino
            </button>
          </div>
        </div>
      </div>
      <div className={`${styles.grid} ${styles.grid3}`}>
        <FieldNumber label="Peso" value={state.peso} unit="kg" min={30} max={250} step={0.5} onChange={(v) => update({ peso: v })} />
        <FieldNumber label="Altura" value={state.altura} unit="cm" min={120} max={230} onChange={(v) => update({ altura: v })} />
        <FieldNumber label="Idade" value={state.idade} unit="anos" min={14} max={90} onChange={(v) => update({ idade: v })} />
      </div>
    </>
  );
}

/* ============ STEP 1 -- Rotina e atividades ============ */

function Step1({
  state,
  addActivity,
  removeActivity,
  updateActivity,
  toggleActivityDay,
  update,
}: {
  state: CalcState;
  addActivity: () => void;
  removeActivity: (id: string) => void;
  updateActivity: (id: string, patch: Partial<Atividade>) => void;
  toggleActivityDay: (id: string, day: number) => void;
  update: (p: Partial<CalcState>) => void;
}) {
  const b = computeBanking(state);
  const weeklyAct = b.days.reduce((s, d) => s + d.act, 0);

  return (
    <>
      <StepHead
        num="02"
        eyebrow="[Passo 02 · Rotina e atividades]"
        title="O que você faz na semana, de verdade."
        hint="Em vez de aplicar um fator de atividade genérico (que costuma inflar o gasto), somamos direto o gasto de cada atividade que você marcar, no dia da semana em que ela acontece."
      />
      <div className={styles.field} style={{ marginBottom: 22 }}>
        <label>Sua rotina fora do treino</label>
        <div className={styles.toggleGroup}>
          {([
            ["sentado", "Majoritariamente sentado"],
            ["moderado", "Em pé / andando moderado"],
            ["exigente", "Fisicamente exigente"],
          ] as [Neat, string][]).map(([value, label]) => (
            <button key={value} type="button" className={`${styles.toggleBtn} ${state.neat === value ? styles.toggleBtnOn : ""}`} onClick={() => update({ neat: value })}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.list}>
        {state.atividades.map((a) => (
          <div key={a.id} className={styles.listRow}>
            <div className={`${styles.grow} ${styles.field}`} style={{ gap: 4 }}>
              <select value={a.dbId} onChange={(e) => updateActivity(a.id, { dbId: e.target.value })}>
                {ACTIVITIES_DB.map((db) => (
                  <option key={db.id} value={db.id}>
                    {db.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field} style={{ gap: 4, width: 120 }}>
              <input type="number" min={5} max={240} value={a.duracao} onChange={(e) => updateActivity(a.id, { duracao: Number(e.target.value) })} />
              <span className={styles.unit}>min/sessão</span>
            </div>
            <div className={styles.days}>
              {DIAS.map((d, i) => (
                <button key={i} type="button" className={`${styles.toggleBtn} ${styles.day} ${a.dias.includes(i) ? styles.toggleBtnOn : ""}`} onClick={() => toggleActivityDay(a.id, i)}>
                  {d[0]}
                </button>
              ))}
            </div>
            <button type="button" className={styles.iconBtn} title="Remover" onClick={() => removeActivity(a.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>
      <button type="button" className={styles.addRowBtn} style={{ marginTop: 12 }} onClick={addActivity}>
        + adicionar atividade
      </button>
      <div className={styles.methodNote}>
        Gasto ativo médio: <strong style={{ color: "var(--foreground)" }}>{Math.round(weeklyAct / 7)} kcal/dia</strong> ({Math.round(weeklyAct)} kcal/semana, somando as sessões marcadas).
      </div>
    </>
  );
}

/* ============ STEP 2 -- Objetivo ============ */

function ObjCard({ id, title, desc, active, onSelect }: { id: Objetivo; title: string; desc: string; active: boolean; onSelect: (id: Objetivo) => void }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      className={`${styles.card} ${styles.cardSelect} ${active ? styles.cardSelectOn : ""}`}
      onClick={() => onSelect(id)}
    >
      <div className="heading-tight-2" style={{ fontSize: 17, marginBottom: 6, color: "var(--foreground)" }}>
        {title}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55 }}>{desc}</div>
    </motion.button>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  unit,
  decimals = 2,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  decimals?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className={styles.field}>
      <label>{label}</label>
      <div className={styles.rangeWrap}>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
        <span className={styles.rangeValue}>
          {value.toFixed(decimals)} {unit}
        </span>
      </div>
    </div>
  );
}

function Step2({ state, update }: { state: CalcState; update: (p: Partial<CalcState>) => void }) {
  return (
    <>
      <StepHead num="03" eyebrow="[Passo 03 · Objetivo]" title="Onde você quer chegar com essa dieta." hint="O objetivo define o ajuste calórico sobre o seu gasto total — e, na Camada 2, como o carboidrato deve ser distribuído nos dias de treino." />
      <div className={`${styles.grid} ${styles.grid3}`} style={{ marginBottom: 24 }}>
        <ObjCard id="recomposicao" title="Recomposição" desc="−10% sobre o gasto total. Pra quem já está com bf mais baixo e quer trocar gordura por músculo devagar." active={state.objetivo === "recomposicao"} onSelect={(v) => update({ objetivo: v, proteinaGkg: Math.max(state.proteinaGkg, proteinMinFor(v)) })} />
        <ObjCard id="definicao" title="Definição" desc="−15% a −20%. Pra bf mais alto — a proteína deve subir dentro da faixa quanto maior o déficit." active={state.objetivo === "definicao"} onSelect={(v) => update({ objetivo: v, proteinaGkg: Math.max(state.proteinaGkg, proteinMinFor(v)) })} />
        <ObjCard id="manutencao" title="Manutenção" desc="0%. Pra quem já está entre 10–12% de gordura corporal e só quer manter e redistribuir." active={state.objetivo === "manutencao"} onSelect={(v) => update({ objetivo: v, proteinaGkg: Math.max(state.proteinaGkg, proteinMinFor(v)) })} />
      </div>

      {state.objetivo === "definicao" && (
        <div className={styles.field} style={{ maxWidth: 420, marginBottom: 24 }}>
          <label>Intensidade do déficit</label>
          <div className={styles.rangeWrap}>
            <input type="range" min={15} max={20} step={1} value={state.definicaoPct} onChange={(e) => update({ definicaoPct: Number(e.target.value) })} />
            <span className={styles.rangeValue}>−{state.definicaoPct}%</span>
          </div>
        </div>
      )}

      <div className={`${styles.grid} ${styles.grid2}`}>
        <RangeField label="Proteína" value={state.proteinaGkg} min={proteinMinFor(state.objetivo)} max={2.2} step={0.1} unit="g/kg" onChange={(v) => update({ proteinaGkg: v })} />
        <RangeField label="Gordura" value={state.gorduraGkg} min={0.8} max={1.0} step={0.05} unit="g/kg" onChange={(v) => update({ gorduraGkg: v })} />
      </div>

      <div className={styles.methodNote}>Carboidrato não tem faixa fixa em g/kg — ele absorve o resto das calorias disponíveis depois de proteína e gordura, e é o macro que varia dia a dia no calorie banking.</div>

      <div className={styles.card} style={{ marginTop: 20 }}>
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Bulking / superávit calórico ainda não entra aqui — os percentuais de superávit não foram fechados na base de conhecimento usada pra essa calculadora. Melhor não inventar número.</div>
      </div>
    </>
  );
}

/* ============ STEP FREE -- Refeição livre ============ */

function StepFree({ state, update }: { state: CalcState; update: (p: Partial<CalcState>) => void }) {
  return (
    <>
      <StepHead
        num="04"
        eyebrow="[Passo 04 · Refeição livre]"
        title="Reserve um espaço pra comer o que quiser."
        hint="Escolha um dia da semana e quantas calorias você quer guardar pra uma refeição livre nesse dia. Esse valor sai de dentro do seu total da semana (não é somado por cima) e o dia escolhido vira um dia inteiro livre — sem meta de proteína, gordura ou carboidrato. O restante da semana é dividido entre os outros 6 dias."
      />
      <div className={styles.field} style={{ marginBottom: 24 }}>
        <label>Dia da refeição livre</label>
        <div className={styles.toggleGroup}>
          {DIAS.map((d, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.toggleBtn} ${state.refeicaoLivreDia === i ? styles.toggleBtnOn : ""}`}
              onClick={() => update({ refeicaoLivreDia: i })}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 420 }}>
        <RangeField
          label="Calorias reservadas pra refeição livre"
          value={state.refeicaoLivreKcal}
          min={0}
          max={10000}
          step={50}
          unit="kcal"
          decimals={0}
          onChange={(v) => update({ refeicaoLivreKcal: v })}
        />
      </div>

      <div className={styles.methodNote} style={{ marginTop: 16 }}>
        {state.refeicaoLivreKcal > 0
          ? `~${state.refeicaoLivreKcal}kcal saem do total da sua semana e viram o orçamento do ${DIAS[state.refeicaoLivreDia]} — um dia inteiro livre, sem meta de proteína, gordura ou carboidrato. O restante da semana (total − ${state.refeicaoLivreKcal}kcal) é dividido normalmente entre os outros 6 dias.`
          : "Deixe em 0 se não quiser reservar nada essa semana — o calorie banking segue normal, sem refeição livre."}
      </div>
    </>
  );
}

/* ============ STEP 3 -- Treino e refeições ============ */

function Step3({
  state,
  addMeal,
  removeMeal,
  updateMeal,
  update,
}: {
  state: CalcState;
  addMeal: () => void;
  removeMeal: (id: string) => void;
  updateMeal: (id: string, patch: Partial<Refeicao>) => void;
  update: (p: Partial<CalcState>) => void;
}) {
  return (
    <>
      <StepHead num="05" eyebrow="[Passo 05 · Treino e refeições]" title="Seu treino é o centro do relógio." hint="Todas as janelas de carboidrato da Camada 2 são calculadas em cima do horário do seu treino principal." />
      <div className={`${styles.grid} ${styles.grid2}`} style={{ marginBottom: 28 }}>
        <div className={styles.field}>
          <label>Horário do treino</label>
          <input type="time" value={state.treinoHorario} onChange={(e) => update({ treinoHorario: e.target.value })} />
        </div>
        <div className={styles.field}>
          <label>Duração aproximada</label>
          <input type="number" min={10} max={240} value={state.treinoDuracao} onChange={(e) => update({ treinoDuracao: Number(e.target.value) })} />
          <span className={styles.unit}>minutos</span>
        </div>
      </div>

      <label className="label-loose" style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 10 }}>
        Suas refeições no dia
      </label>
      <div className={styles.list}>
        {state.refeicoes.map((r) => (
          <div key={r.id} className={styles.listRow}>
            <div className={`${styles.grow} ${styles.field}`} style={{ gap: 4 }}>
              <input type="text" value={r.label} placeholder="Nome da refeição" onChange={(e) => updateMeal(r.id, { label: e.target.value })} />
            </div>
            <div className={styles.field} style={{ gap: 4, width: 120 }}>
              <input type="time" value={r.hora} onChange={(e) => updateMeal(r.id, { hora: e.target.value })} />
            </div>
            <button type="button" className={styles.iconBtn} title="Remover" onClick={() => removeMeal(r.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>
      <button type="button" className={styles.addRowBtn} style={{ marginTop: 12 }} onClick={addMeal}>
        + adicionar refeição
      </button>
    </>
  );
}

/* ============ STEP 4 -- Alimentos habituais ============ */

function Step4({ state, toggleFood }: { state: CalcState; toggleFood: (id: string) => void }) {
  return (
    <>
      <StepHead num="06" eyebrow="[Passo 06 · Alimentos habituais]" title="O que você realmente come." hint="Marque os alimentos que fazem parte da sua rotina. As sugestões de refeição por janela de horário (passo seguinte) só usam o que estiver marcado aqui." />
      <div className={styles.foodgrid}>
        {FOOD_DB.map((f) => {
          const on = state.despensa.includes(f.id);
          const tagLabel = f.cat === "carboidrato" ? (f.vel === "rapido" ? "carbo rápido" : "carbo lento") : f.cat;
          const tagClass = f.cat === "carboidrato" ? styles.tagCarboidrato : f.cat === "proteina" ? styles.tagProteina : f.cat === "gordura" ? styles.tagGordura : styles.tagMisto;
          return (
            <motion.button key={f.id} type="button" whileTap={{ scale: 0.96 }} className={`${styles.foodChip} ${on ? styles.foodChipOn : ""}`} onClick={() => toggleFood(f.id)}>
              <span className={styles.fname}>{f.nome}</span>
              <span className={`${styles.ftag} ${tagClass}`}>{tagLabel}</span>
            </motion.button>
          );
        })}
      </div>
      <div className={styles.methodNote}>Valores por 100g são aproximados (tabela de referência nutricional padrão) — editáveis conforme sua marca/produto real.</div>
    </>
  );
}

/* ============ STEP 5 -- Resultado ============ */

// Realistic single-food portion ceiling per meal, in grams -- prevents the
// suggestion engine from ever proposing something like "585g de arroz" or
// "240g de mel" just because the math for a macro budget worked out that
// way. When a macro's remaining budget would need more than this from one
// food, the rest is split onto a second (distinct) food from the same
// pool instead of stretching a single item past what anyone would
// actually plate. Values are common realistic single-meal portions, not
// daily maximums.
const PORTION_CAP: Record<string, number> = {
  arroz_branco: 300,
  arroz_integral: 300,
  batata_doce: 300,
  batata_inglesa: 300,
  aveia: 100,
  pao_frances: 100,
  pao_integral: 100,
  pao_forma: 100,
  banana: 120,
  maca: 150,
  mamao: 200,
  mel: 30,
  dextrose: 60,
  feijao: 200,
  macarrao: 250,
  tapioca: 100,
  quinoa: 200,
  cuscuz: 200,
  mandioca: 250,
  milho_verde: 150,
  uva: 150,
  granola: 80,
  frango: 250,
  ovo: 150,
  clara: 180,
  patinho: 250,
  tilapia: 250,
  atum: 150,
  whey: 40,
  iogurte_grego: 200,
  cottage: 150,
  salmao: 250,
  carne_moida: 250,
  camarao: 200,
  peito_peru: 100,
  azeite: 20,
  abacate: 150,
  castanha_para: 30,
  amendoas: 30,
  pasta_amendoim: 30,
  manteiga: 20,
  castanha_caju: 30,
  queijo_parmesao: 40,
  gergelim: 30,
  leite: 300,
  iogurte_integral: 200,
  chia: 25,
  queijo_minas: 100,
  leite_desnatado: 300,
  inhame: 300,
  batata_baroa: 300,
  pipoca: 50,
  lentilha: 200,
  grao_de_bico: 200,
  ervilha: 200,
  pera: 150,
  abacaxi: 150,
  morango: 150,
  melancia: 200,
  wrap_integral: 80,
  oleo_coco: 15,
  leite_coco: 40,
  macadamia: 20,
  nozes: 25,
  azeitona: 30,
  ricota: 100,
};

function capFor(food: Food): number {
  if (PORTION_CAP[food.id] != null) return PORTION_CAP[food.id];
  if (food.cat === "gordura") return 30;
  if (food.cat === "proteina") return 200;
  return 250;
}

function roundTo5(n: number) {
  return Math.max(0, Math.round(n / 5) * 5);
}

type FoodPortion = { food: Food; grams: number };

// Picks the least-recently-used food in the pool (ties broken by pool
// order) instead of always the first match -- so a 5-meal plan cycles
// through different carbs/proteins/fats instead of repeating the same
// three foods at every meal.
function pickVaried(pool: Food[], used: Map<string, number>): Food | null {
  if (pool.length === 0) return null;
  let best = pool[0];
  let bestCount = used.get(best.id) ?? 0;
  for (const f of pool) {
    const c = used.get(f.id) ?? 0;
    if (c < bestCount) {
      best = f;
      bestCount = c;
    }
  }
  used.set(best.id, bestCount + 1);
  return best;
}

// Infers what kind of meal this is from its label first (handles the
// default/edited Portuguese names directly), falling back to time of day
// when the label doesn't say -- this is what keeps arroz/tilápia out of
// "Café da manhã" and pão/mel out of "Almoço".
function inferMealType(refeicao: Refeicao): MealType {
  const label = refeicao.label.toLowerCase();
  if (/caf[eé]/.test(label)) return "cafe";
  if (/almo[cç]o|jantar/.test(label)) return "principal";
  if (/lanche|pr[eé][- ]?treino|p[oó]s[- ]?treino|durante/.test(label)) return "lanche";
  const h = minsOfDay(refeicao.hora) / 60;
  if (h >= 5 && h < 10) return "cafe";
  if ((h >= 11 && h < 14.5) || (h >= 18.5 && h < 22)) return "principal";
  return "lanche";
}

function byMealType(pool: Food[], mealType: MealType) {
  const picks = pool.filter((f) => f.mt.includes(mealType));
  return picks.length > 0 ? picks : pool;
}

// Builds a realistic plate for one macro: only ever draws from the pool
// passed in (which, per the rules in passo 06, must already be restricted
// to the user's checked despensa -- never a wider fallback database), caps
// each individual food at a realistic single-meal portion (capFor), and
// -- when a single food's cap can't cover the target -- splits the
// remainder onto up to `maxItems` distinct foods from the same pool
// instead of ever overshooting one item's cap. Returns the *actual*
// grams chosen for each food; callers must always read delivered macro
// content back from these grams, never from the budget that was passed
// in, since a capped/split result can under- or slightly over-shoot it.
function suggestMacroPortions(pool: Food[], used: Map<string, number>, macroBudget: number, macroOf: (f: Food) => number, maxItems = 2): FoodPortion[] {
  if (pool.length === 0 || macroBudget <= 1) return [];
  const portions: FoodPortion[] = [];
  const pickedIds = new Set<string>();
  let remaining = macroBudget;
  for (let i = 0; i < maxItems && remaining > 1; i++) {
    const candidates = pool.filter((f) => !pickedIds.has(f.id));
    if (candidates.length === 0) break;
    const f = pickVaried(candidates, used);
    if (!f) break;
    const macroPer100 = macroOf(f);
    if (macroPer100 <= 0) break;
    const neededGrams = remaining / (macroPer100 / 100);
    const grams = roundTo5(Math.min(neededGrams, capFor(f)));
    if (grams <= 0) break;
    portions.push({ food: f, grams });
    pickedIds.add(f.id);
    remaining -= (grams * macroPer100) / 100;
  }
  return portions;
}

function suggestCarbPortions(despensaFoods: Food[], used: Map<string, number>, zoneKey: ZoneKey, mealType: MealType, carbBudget: number): FoodPortion[] {
  const catPool = despensaFoods.filter((f) => f.cat === "carboidrato" || f.cat === "misto");
  const pool = byMealType(catPool, mealType);
  const preferRapido = zoneKey === "imediato" || zoneKey === "durante" || zoneKey === "pos";
  const preferLento = zoneKey === "completa";
  let picks = pool.filter((f) => (preferRapido ? f.vel === "rapido" : preferLento ? f.vel === "lento" : true));
  if (picks.length === 0) picks = pool;
  return suggestMacroPortions(picks, used, carbBudget, (f) => f.c);
}

function suggestProteinPortions(despensaFoods: Food[], used: Map<string, number>, mealType: MealType, proteinBudget: number): FoodPortion[] {
  const catPool = despensaFoods.filter((f) => f.cat === "proteina" || f.cat === "misto");
  const pool = byMealType(catPool, mealType);
  return suggestMacroPortions(pool, used, proteinBudget, (f) => f.p);
}

function suggestFatPortions(despensaFoods: Food[], used: Map<string, number>, mealType: MealType, fatBudget: number): FoodPortion[] {
  const catPool = despensaFoods.filter((f) => f.cat === "gordura" || f.cat === "misto");
  const pool = byMealType(catPool, mealType);
  return suggestMacroPortions(pool, used, fatBudget, (f) => f.g);
}

// Always the source of truth for "how much of this macro/how many kcal
// does this suggestion actually deliver" -- computed from the real
// grams+food chosen, never from the budget that was targeted. This is
// what the on-screen cards and the print table both read from.
function kcalOfPortions(portions: FoodPortion[]): number {
  return Math.round(portions.reduce((sum, p) => sum + (p.grams * p.food.kcal) / 100, 0));
}
function macroOfPortions(portions: FoodPortion[], macroOf: (f: Food) => number): number {
  return Math.round(portions.reduce((sum, p) => sum + (p.grams * macroOf(p.food)) / 100, 0));
}

type MealPlanRow = {
  refeicao: Refeicao;
  zoneKey: ZoneKey;
  carbPortions: FoodPortion[];
  proteinPortions: FoodPortion[];
  fatPortions: FoodPortion[];
  mealKcal: number;
};

/**
 * One suggestion per *refeição the person actually typed in* (passo 05),
 * not per timing zone -- a zone with 2 meals used to show a single lumped
 * suggestion for the whole zone, which doesn't tell you what to eat at
 * each of those two meals. Splits each zone's carb budget, and the day's
 * protein/fat targets, evenly across the meals that land in it/the day --
 * so every meal comes back with all three macros (a full mini-diet), not
 * just a carb pointer.
 */
// A netted budget can legitimately hit zero when an earlier pick's
// incidental content already covers the target -- but if the category
// still has real food available in the despensa, showing nothing there
// reads exactly like the forbidden "adicione uma fonte de X..." gap. This
// keeps a modest floor (at least 10g of budget, or 25% of the raw
// per-meal share) so a category with real options on the table always
// gets *something* plated, even when netting would otherwise zero it out.
function withFloor(budget: number, netCandidate: number) {
  const floor = Math.max(10, Math.round(budget * 0.25));
  return Math.max(floor, netCandidate);
}

function buildMealPlan(state: CalcState, z: ReturnType<typeof computeZones>, trainDayCarbG: number, dailyProteinG: number, dailyFatG: number, despensaFoods: Food[]): MealPlanRow[] {
  const sorted = [...state.refeicoes].sort((a, b) => minsOfDay(a.hora) - minsOfDay(b.hora));
  const zoneCounts: Partial<Record<ZoneKey, number>> = {};
  const zoneKeys = sorted.map((r) => {
    const k = classify(minsOfDay(r.hora), z);
    zoneCounts[k] = (zoneCounts[k] || 0) + 1;
    return k;
  });
  const weights: Partial<Record<ZoneKey, number>> = {};
  zoneKeys.forEach((k) => {
    weights[k] = (weights[k] || 0) + ZONE_META[k].weight;
  });
  const totalWeight = Object.values(weights).reduce((s, w) => s + (w || 0), 0) || 1;
  const mealCount = sorted.length || 1;
  const proteinPerMeal = dailyProteinG / mealCount;
  const fatPerMeal = dailyFatG / mealCount;
  // Shared across every meal in this build -- each pickVaried() call below
  // reads/updates it, which is what makes the food choice rotate meal to
  // meal instead of the whole day repeating the pantry's first match.
  const used = new Map<string, number>();

  return sorted.map((refeicao, i) => {
    const zoneKey = zoneKeys[i];
    const mealType = inferMealType(refeicao);
    const zoneWeight = weights[zoneKey] || 0;
    const zoneCarbBudget = Math.round(trainDayCarbG * (zoneWeight / totalWeight));
    const mealsInZone = zoneCounts[zoneKey] || 1;
    const carbBudget = Math.round(zoneCarbBudget / mealsInZone);
    const carbPortions = carbBudget > 0 ? suggestCarbPortions(despensaFoods, used, zoneKey, mealType, carbBudget) : [];

    // Whole foods aren't macro-pure -- a carb pick already carries some
    // incidental protein/fat, a protein pick already carries some
    // incidental fat. Sizing the next pick against the FULL per-meal
    // budget (ignoring what's already coming along for the ride) double
    // counts that overlap and inflates the meal's real total -- so each
    // later pick is sized against its budget net of what's already
    // covered by the picks before it (with a floor so real options never
    // get netted all the way down to an empty plate).
    const carbIncidentalP = macroOfPortions(carbPortions, (f) => f.p);
    const carbIncidentalG = macroOfPortions(carbPortions, (f) => f.g);
    const proteinBudget = Math.round(proteinPerMeal);
    const proteinBudgetNet = withFloor(proteinBudget, proteinBudget - carbIncidentalP);
    const proteinPortions = suggestProteinPortions(despensaFoods, used, mealType, proteinBudgetNet);

    const proteinIncidentalG = macroOfPortions(proteinPortions, (f) => f.g);
    const fatBudget = Math.round(fatPerMeal);
    const fatBudgetNet = withFloor(fatBudget, fatBudget - carbIncidentalG - proteinIncidentalG);
    const fatPortions = suggestFatPortions(despensaFoods, used, mealType, fatBudgetNet);

    const mealKcal = kcalOfPortions(carbPortions) + kcalOfPortions(proteinPortions) + kcalOfPortions(fatPortions);
    return { refeicao, zoneKey, carbPortions, proteinPortions, fatPortions, mealKcal };
  });
}

// Which despensa (passo 06) categories a full meal plan needs to draw
// from. "misto" foods count toward any of the three -- they're the whole
// reason that category exists.
function despensaCoverage(despensaFoods: Food[]) {
  return {
    carboidrato: despensaFoods.some((f) => f.cat === "carboidrato" || f.cat === "misto"),
    proteina: despensaFoods.some((f) => f.cat === "proteina" || f.cat === "misto"),
    gordura: despensaFoods.some((f) => f.cat === "gordura" || f.cat === "misto"),
  };
}

function Step5({
  state,
  banking: b,
  usingExample,
  update,
  goStep,
}: {
  state: CalcState;
  banking: ReturnType<typeof computeBanking>;
  usingExample: boolean;
  update: (p: Partial<CalcState>) => void;
  goStep: (n: number) => void;
}) {
  const z = computeZones(state.treinoHorario, state.treinoDuracao);

  // The detailed meal plan below is always built for a structured day --
  // the free day has no macros to plan around, so it's never eligible here
  // even if it happens to land on what would otherwise be a training day.
  const structuredBankingDays = b.days.filter((d) => !d.isFreeDay);
  const trainDay = structuredBankingDays.find((d) => d.isTraining) || structuredBankingDays[0] || b.days[0];
  const totalMacroKcal = b.proteinKcal + b.fatKcal + trainDay.carbG * 4;
  const pPct = Math.round((b.proteinKcal / totalMacroKcal) * 100);
  const gPct = Math.round((b.fatKcal / totalMacroKcal) * 100);
  const cPct = 100 - pPct - gPct;

  // A fixed ±6h window around the treino covers the default example fine,
  // but a meal typed further out (e.g. a lanche well before any timing
  // zone) would get clamped to the track's edge and stack on top of
  // whichever other meal also clamps there. Widen the window to guarantee
  // every zone and every actual meal the person entered has room on the
  // track, instead of silently overlapping at 0%/100%.
  const mealMinsNormalized = state.refeicoes.map((r) => normalizeToTraining(minsOfDay(r.hora), z.t0));
  const trackBounds = [z.t0 - 360, z.t0 + 360, z.completa[0], z.pos[1], ...mealMinsNormalized];
  const trackStart = Math.min(...trackBounds) - 30;
  const trackEnd = Math.max(...trackBounds) + 30;
  const span = trackEnd - trackStart;
  const pctPos = (min: number) => Math.max(0, Math.min(100, ((min - trackStart) / span) * 100));

  const ticks: number[] = [];
  for (let tmin = Math.ceil(trackStart / 60) * 60; tmin <= trackEnd; tmin += 60) ticks.push(tmin);

  const mealZoneCount: Partial<Record<ZoneKey, number>> = {};
  state.refeicoes.forEach((r) => {
    const zoneKey = classify(minsOfDay(r.hora), z);
    mealZoneCount[zoneKey] = (mealZoneCount[zoneKey] || 0) + 1;
  });

  const despensaFoods = state.despensa.map(foodById).filter((f): f is Food => Boolean(f));
  const coverage = despensaCoverage(despensaFoods);
  const missingCats: string[] = [];
  if (!coverage.carboidrato) missingCats.push("carboidrato");
  if (!coverage.proteina) missingCats.push("proteína");
  if (!coverage.gordura) missingCats.push("gordura");
  const despensaComplete = missingCats.length === 0;

  // The meal plan (and the PDF that reads from it) must never be built out
  // of a despensa that's missing a whole macro category -- that's exactly
  // what produces the "adicione uma fonte de X..." gap the calculator must
  // never hand the user as a finished result. When incomplete, skip
  // building it at all and show a blocking message instead (below)
  // directing back to passo 06.
  const mealPlan = despensaComplete ? buildMealPlan(state, z, trainDay.carbG, b.proteinG, b.fatG, despensaFoods) : [];
  const mealPlanTotalKcal = mealPlan.reduce((sum, row) => sum + row.mealKcal, 0);

  const riskCount = mealZoneCount.risco || 0;
  const resultHint =
    "Camada 1 (quanto comer) e Camada 2 (quando comer o carboidrato), calculadas em cima dos seus dados." +
    (usingExample ? " Os campos vieram preenchidos com um exemplo — edite qualquer passo acima para usar os seus números." : "");

  return (
    <>
      <StepHead num="07" eyebrow="[Resultado]" title="Sua distribuição, pronta." hint={resultHint} />

      <div className={`${styles.grid} ${styles.grid2} ${styles.noPrint}`} style={{ marginBottom: 28, alignItems: "end" }}>
        <div className={styles.field}>
          <label>Nome (aparece no PDF)</label>
          <input type="text" value={state.nomeCliente || ""} placeholder="Opcional" onChange={(e) => update({ nomeCliente: e.target.value })} />
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: despensaComplete ? 0.96 : 1 }}
          whileHover={{ scale: despensaComplete ? 1.015 : 1 }}
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={!despensaComplete}
          style={!despensaComplete ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
          onClick={() => despensaComplete && window.print()}
        >
          Baixar PDF
        </motion.button>
      </div>

      {!despensaComplete && (
        <div className={`${styles.card} ${styles.noPrint}`} style={{ borderColor: "#b5583f", background: "rgba(181,88,63,0.14)", marginBottom: 28 }}>
          <strong style={{ color: "#e0876f" }}>Sua lista de alimentos está incompleta: </strong>
          <span style={{ color: "var(--muted)", fontSize: 13.5 }}>
            falta marcar pelo menos uma fonte de {missingCats.join(" e de ")} no passo 06 (Alimentos). Sem isso, a
            calculadora não tem como montar um plano de refeições real — ela nunca inventa um alimento fora da sua
            lista nem sugere uma categoria vazia. Volte lá e marque pelo menos uma opção de cada macro pra liberar o
            plano de refeições e o PDF.
          </span>
          <div style={{ marginTop: 12 }}>
            <motion.button type="button" whileTap={{ scale: 0.96 }} className={`${styles.btn} ${styles.btnGhost}`} onClick={() => goStep(5)}>
              Voltar para Alimentos (passo 06)
            </motion.button>
          </div>
        </div>
      )}

      {riskCount > 0 && (
        <div className={`${styles.card} ${styles.noPrint}`} style={{ borderColor: "#b5583f", background: "rgba(181,88,63,0.14)", marginBottom: 24 }}>
          <strong style={{ color: "#e0876f" }}>Atenção: </strong>
          <span style={{ color: "var(--muted)", fontSize: 13.5 }}>
            {riskCount} refeição(ões) sua(s) caem na zona de risco (45–90min antes do treino). Veja o card &quot;Zona de risco&quot; abaixo pra realocar o horário.
          </span>
        </div>
      )}

      <div className={styles.noPrint}>
        <div className={`${styles.grid} ${styles.grid3}`}>
          <div className={styles.statTile}>
            <div className={styles.statLabel}>TMB</div>
            <div className={`${styles.statValue} heading-tight-2`}>
              <CountUp to={b.tmb} />
              <small>kcal</small>
            </div>
            <div className={styles.statFoot}>Mifflin-St Jeor</div>
          </div>
          <div className={styles.statTile}>
            <div className={styles.statLabel}>Gasto semanal (TDEE)</div>
            <div className={`${styles.statValue} heading-tight-2`}>
              <CountUp to={b.weeklyTDEE} />
              <small>kcal</small>
            </div>
            <div className={styles.statFoot}>basal + rotina + treinos, dia a dia</div>
          </div>
          <div className={styles.statTile}>
            <div className={styles.statLabel}>Meta semanal</div>
            <div className={`${styles.statValue} heading-tight-2`}>
              <CountUp to={b.weeklyTarget} />
              <small>kcal</small>
            </div>
            <div className={styles.statFoot}>
              ajuste de {b.pct > 0 ? `−${Math.round(b.pct * 100)}%` : "0% (manutenção)"} + margem de segurança de −{Math.round(b.safetyMargin * 100)}%
            </div>
          </div>
        </div>
      </div>

      <div className={styles.noPrint}>
        <SectionLabel>Calorie banking da semana</SectionLabel>
        <div className={styles.weekStrip}>
          {b.days.map((d) => (
            <div key={d.i} className={`${styles.dayTile} ${d.isTraining ? styles.dayTileTraining : ""}`}>
              <div className={styles.dayName}>{d.label}</div>
              <div className={`${styles.dayDot} ${d.isTraining ? "" : styles.dayDotRest}`} />
              <div className={styles.dayKcal}>{d.target}</div>
              {d.isFreeDay ? <div className={styles.dayCarb}>dia livre</div> : <div className={styles.dayCarb}>{d.carbG}g carbo</div>}
              {d.isFreeDay && <div className={styles.dayFreeTag}>🍽 sem meta de macro</div>}
            </div>
          ))}
        </div>
        <div className={styles.methodNote}>
          Bolinha clara = dia de treino. Proteína e gordura ficam fixas todo dia (vêm do seu peso); o carboidrato é o macro que flexiona — 55% do total disponível é dividido igual entre os dias, e 45% é redistribuído proporcional ao gasto de musculação de cada dia, então os dias de musculação sobram com mais carboidrato que os demais — inclusive que um dia só de cardio, mesmo que esse dia gaste mais caloria no papel. O gasto de treino já entra com uma redução de {Math.round((1 - SESSION_EFFICIENCY) * 100)}% sobre a tabela de MET (que costuma superestimar) e a meta semanal já tem a margem de segurança de −{Math.round(b.safetyMargin * 100)}% descontada — então o carboidrato calculado aqui já vem conservador, não é o teto máximo.
          {state.refeicaoLivreKcal > 0 && ` ~${state.refeicaoLivreKcal}kcal ficam reservados pro ${DIAS[state.refeicaoLivreDia]} como refeição livre (passo 04) — tirados do total da semana antes de dividir, não somados por cima. Esse dia vira um dia livre inteiro (sem meta de macro) e os outros 6 dias dividem o restante entre si.`}
        </div>
        {b.bankingWarning && (
          <div className={styles.card} style={{ borderColor: "#b5583f", background: "rgba(181,88,63,0.14)", marginTop: 14 }}>
            <strong style={{ color: "#e0876f" }}>Meta muito apertada: </strong>
            <span style={{ color: "var(--muted)", fontSize: 13 }}>
              proteína e gordura sozinhas já tomam quase toda (ou mais que) a sua meta calórica ajustada, sobrando pouco ou nenhum espaço saudável pra carboidrato. Considere reduzir a intensidade do déficit ou revisar as faixas de g/kg no passo 03.
            </span>
          </div>
        )}
      </div>

      <div className={styles.noPrint}>
        <SectionLabel>Macros do dia de treino ({trainDay.label})</SectionLabel>
        <div className={`${styles.grid} ${styles.grid3}`}>
          <div className={styles.statTile}>
            <div className={styles.statLabel}>Proteína</div>
            <div className={`${styles.statValue} heading-tight-2`}>
              <CountUp to={b.proteinG} />
              <small>g</small>
            </div>
            <div className={styles.statFoot}>{state.proteinaGkg.toFixed(1)} g/kg · fixo todo dia</div>
          </div>
          <div className={styles.statTile}>
            <div className={styles.statLabel}>Gordura</div>
            <div className={`${styles.statValue} heading-tight-2`}>
              <CountUp to={b.fatG} />
              <small>g</small>
            </div>
            <div className={styles.statFoot}>{state.gorduraGkg.toFixed(2)} g/kg · fixo todo dia</div>
          </div>
          <div className={styles.statTile}>
            <div className={styles.statLabel}>Carboidrato</div>
            <div className={`${styles.statValue} heading-tight-2`} style={{ color: "var(--foreground)" }}>
              <CountUp to={trainDay.carbG} />
              <small>g</small>
            </div>
            <div className={styles.statFoot}>varia por dia — é o macro do banking</div>
          </div>
        </div>
        <div className={styles.macroBar}>
          <span style={{ width: `${pPct}%`, background: "#b7b3a8" }} />
          <span style={{ width: `${gPct}%`, background: "#4d4a44" }} />
          <span style={{ width: `${cPct}%`, background: "var(--foreground)" }} />
        </div>
      </div>

      <div className={styles.noPrint}>
        <SectionLabel>
          Janela do treino — {state.treinoHorario} ({state.treinoDuracao}min)
        </SectionLabel>
        <div className={styles.timelineWrap}>
          <div className={styles.timelineTrack}>
          {ZONE_ORDER.map((key, idx) => {
            const zr = z[key];
            const meta = ZONE_META[key];
            const left = pctPos(zr[0]);
            const width = Math.max(0.5, pctPos(zr[1]) - left);
            // Some zones (imediato, durante) are narrow slivers on the
            // timeline -- their labels would otherwise collide with a
            // neighboring zone's label at the same height, so stagger
            // across three rows (two isn't enough: with 5 sequential zones,
            // a 2-cycle repeats onto adjacent zones too).
            const rowOffsets = [-20, -36, -52];
            const labelTop = rowOffsets[idx % rowOffsets.length];
            return (
              <div key={key} className={styles.tlZone} style={{ left: `${left}%`, width: `${width}%`, background: meta.soft, border: `1px solid ${meta.color}22` }}>
                <span className={styles.tlZoneLabel} style={{ left: 0, top: labelTop, color: meta.color }}>
                  {meta.label}
                </span>
              </div>
            );
          })}
          {state.refeicoes.map((r) => {
            const mm = normalizeToTraining(minsOfDay(r.hora), z.t0);
            const zoneKey = classify(minsOfDay(r.hora), z);
            const meta = ZONE_META[zoneKey];
            return (
              <div key={r.id} className={`${styles.tlMeal} ${zoneKey === "risco" ? styles.tlMealRisco : ""}`} style={{ left: `${pctPos(mm)}%` }}>
                <span className={styles.tlMealLabel}>
                  {r.label} · {r.hora}
                </span>
                <span className={styles.tlMealPin} style={{ background: meta.color }} />
              </div>
            );
          })}
        </div>
        <div className={styles.tlAxis}>
          {ticks.map((tmin) => (
            <span key={tmin} className={styles.tlTick} style={{ left: `${pctPos(tmin)}%` }}>
              {fmtMin(tmin)}
            </span>
          ))}
        </div>
        <div className={styles.legendGrid}>
          {[...ZONE_ORDER, "livre" as ZoneKey].map((key) => (
            <div key={key} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: ZONE_META[key].color }} />
              {ZONE_META[key].label}
            </div>
          ))}
        </div>
        </div>
      </div>

      <div className={styles.noPrint}>
      <SectionLabel>Sugestão de refeições</SectionLabel>
      <div className={styles.card} style={{ marginBottom: 14, borderColor: "rgba(255,255,255,0.16)" }}>
        <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--foreground)" }}>Isto é um ponto de partida, não uma prescrição.</strong> As
          quantidades abaixo são estimativas simples (carboidrato, proteína e gordura dimensionados por refeição, com
          o alimento variando ao longo do dia pra fugir do &quot;sempre a mesma coisa&quot;) e não substituem um plano
          montado por nutricionista, que considera exames, histórico de saúde, preferências e rotina real — algo que
          essa calculadora não tem como avaliar. As sugestões usam exclusivamente os alimentos que você marcou no
          passo 06 — nunca um alimento fora dessa lista — com porções limitadas a uma faixa realista por refeição.
        </div>
      </div>
      {state.refeicaoLivreKcal > 0 && (
        <div className={styles.card} style={{ marginBottom: 14, borderColor: "rgba(255,255,255,0.16)" }}>
          <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--foreground)" }}>🍽 Refeição livre — {DIAS[state.refeicaoLivreDia]}.</strong>{" "}
            {`~${state.refeicaoLivreKcal} kcal reservados pra esse dia, tirados do total da semana (não somados por cima). É um dia inteiro livre — sem meta de proteína, gordura ou carboidrato, sem sugestão de alimento — por isso não aparece nas refeições listadas abaixo (que detalham o dia de treino de ${trainDay.label}). Veja a coluna "Refeição livre" no calorie banking da semana, acima.`}
          </div>
        </div>
      )}
      {!despensaComplete ? (
        <div className={styles.card} style={{ borderColor: "#b5583f", background: "rgba(181,88,63,0.14)" }}>
          <span style={{ color: "var(--muted)", fontSize: 13.5 }}>
            Complete sua lista de alimentos no passo 06 pra ver o plano de refeições aqui — veja o aviso acima.
          </span>
        </div>
      ) : (
        <>
      {mealPlan.map(({ refeicao, zoneKey, carbPortions, proteinPortions, fatPortions, mealKcal }) => {
        const meta = ZONE_META[zoneKey];
        const carbG = macroOfPortions(carbPortions, (f) => f.c);
        const proteinG = macroOfPortions(proteinPortions, (f) => f.p);
        const fatG = macroOfPortions(fatPortions, (f) => f.g);
        return (
          <div key={refeicao.id} className={styles.zoneCard}>
            <div className={styles.zoneCardHead}>
              <span style={{ fontSize: 14, color: "var(--foreground)" }} className="heading-tight-2">
                {refeicao.label} <span style={{ color: "var(--muted-dim)", fontWeight: 400 }}>· {refeicao.hora}</span>
              </span>
              <span className={styles.zoneBadge} style={{ background: meta.soft, color: meta.color }}>
                {meta.label}
              </span>
            </div>
            <div className={styles.zoneRec}>{meta.rec}</div>
            <div className={styles.list} style={{ gap: 0 }}>
              {carbPortions.length > 0 ? (
                carbPortions.map((p, idx) => (
                  <div key={`c-${p.food.id}`} className={`${styles.suggestionRow} ${idx === 0 ? styles.suggestionRowFirst : ""}`}>
                    <span className={styles.suggestionFood}>🌾 {p.food.nome}</span>
                    <span className={styles.suggestionQty}>
                      ~{p.grams}g · {macroOfPortions([p], (f) => f.c)}g carbo
                    </span>
                  </div>
                ))
              ) : (
                <div className={`${styles.emptyNote} ${styles.suggestionRowFirst}`} style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 9 }}>
                  Sem carboidrato alocado nesta refeição.
                </div>
              )}
              {proteinPortions.length > 0 ? (
                proteinPortions.map((p) => (
                  <div key={`p-${p.food.id}`} className={styles.suggestionRow}>
                    <span className={styles.suggestionFood}>🍗 {p.food.nome}</span>
                    <span className={styles.suggestionQty}>
                      ~{p.grams}g · {macroOfPortions([p], (f) => f.p)}g proteína
                    </span>
                  </div>
                ))
              ) : (
                <div className={styles.emptyNote}>Sem proteína alocada nesta refeição.</div>
              )}
              {fatPortions.length > 0 ? (
                fatPortions.map((p) => (
                  <div key={`g-${p.food.id}`} className={styles.suggestionRow}>
                    <span className={styles.suggestionFood}>🥑 {p.food.nome}</span>
                    <span className={styles.suggestionQty}>
                      ~{p.grams}g · {macroOfPortions([p], (f) => f.g)}g gordura
                    </span>
                  </div>
                ))
              ) : (
                <div className={styles.emptyNote}>Sem gordura alocada nesta refeição.</div>
              )}
              <div className={styles.suggestionRow}>
                <span className={styles.suggestionFood}>🥦 Vegetais / salada</span>
                <span className={styles.suggestionQty}>à vontade</span>
              </div>
            </div>
            <div className={styles.zoneTime} style={{ marginTop: 8 }}>
              {mealKcal > 0
                ? `~${mealKcal} kcal nessa refeição (${carbG}g carbo · ${proteinG}g proteína · ${fatG}g gordura, sem contar tempero/preparo)`
                : "Marque alimentos no passo 06 pra ver o total dessa refeição."}{" "}
              · vegetais e fibras não entram no cálculo calórico.
            </div>
          </div>
        );
      })}
      <div className={styles.methodNote}>
        Proteína e gordura divididas em partes iguais entre as refeições do dia; carboidrato segue a distribuição por
        janela de timing (Camada 2, acima). Quando uma porção ultrapassaria uma faixa realista pra um único alimento,
        o restante do macro é dividido com um segundo alimento da mesma categoria. Somando as {mealPlan.length}{" "}
        refeições sugeridas: ~{mealPlanTotalKcal} kcal
        {trainDay.target > 0 ? ` (meta do dia de treino: ${trainDay.target} kcal).` : "."} Vegetais e o tempero/óleo de
        preparo entram por cima disso e variam demais pra estimar — é aqui que sobra espaço de ajuste fino.
      </div>
        </>
      )}
      </div>

      <div className={styles.noPrint}>
        <SectionLabel>Guardrails</SectionLabel>
        <div className={styles.disclaimerCard}>
          <p>
            Os números de janela (45–90min de risco, pico por volta dos 75min, 3–4h antes, 24–48h de sensibilidade pós-treino) vêm de estudos com atletas e protocolos controlados — existe variação individual conforme sensibilidade à insulina, tipo de treino e composição da refeição anterior. Trate como estimativa baseada em evidência e ajuste conforme sua resposta.
          </p>
          <p>
            <strong style={{ color: "var(--foreground)" }}>Conteúdo educativo — não substitui acompanhamento nutricional ou médico individualizado.</strong> As calorias, macros e sugestões de refeição aqui são estimativas calculadas a partir de fórmulas gerais (Mifflin-St Jeor, tabelas de MET), com uma margem de segurança embutida — não um diagnóstico. Elas não conhecem seus exames, condições de saúde, histórico ou resposta individual. Para um plano ajustado a você, o acompanhamento de um nutricionista é o que faz essa diferença. Esta calculadora não promete um resultado numérico fechado de perda ou ganho de peso.
          </p>
          <p className={styles.sources}>Fontes: curva glicêmica pós-refeição (GlucoSense) · zona de risco pré-treino (TrainingPeaks) · sensibilidade à insulina pós-treino (Nutrisense) · papel da gordura no esvaziamento gástrico (T1TI) · fórmula TMB (Mifflin-St Jeor).</p>
        </div>
      </div>

      {/* ==== PRINT-ONLY REPORT =================================================
       * The real PDF content -- a paginated, branded document (capa / resumo /
       * linha do tempo / refeições / disclaimer), not a screenshot of the
       * screen above. Every .printPage forces its own page via CSS
       * break-before, so pagination is deliberate rather than organic
       * overflow.
       */}
      <div className={styles.printOnly}>
        {/* -- 1. capa -- */}
        <div className={`${styles.printPage} ${styles.printCover}`}>
          <div className={styles.printCoverTop}>
            <span className={styles.printCoverMark}>Carbmaxxing</span>
            <span className={styles.printCoverDate}>Gerado em {new Date().toLocaleDateString("pt-BR")}</span>
          </div>
          <div className={styles.printCoverMid}>
            <div className={styles.printCoverEyebrow}>Plano alimentar</div>
            <div className={styles.printCoverTitle}>Protocolo Carbmaxxing</div>
            {state.nomeCliente && <div className={styles.printCoverClient}>{state.nomeCliente}</div>}
          </div>
          <div className={styles.printCoverFoot}>
            <div className={styles.printCoverFootItem}>
              <strong>{state.objetivo === "definicao" ? `Definição −${state.definicaoPct}%` : state.objetivo === "recomposicao" ? "Recomposição" : "Manutenção"}</strong>
              objetivo
            </div>
            <div className={styles.printCoverFootItem}>
              <strong>
                {state.peso}kg · {state.altura}cm
              </strong>
              {state.idade} anos
            </div>
            <div className={styles.printCoverFootItem}>
              <strong>{state.treinoHorario}</strong>
              horário do treino ({state.treinoDuracao}min)
            </div>
            <div className={styles.printCoverFootItem}>
              <strong>{trainDay.target} kcal</strong>
              meta do dia de treino
            </div>
          </div>
        </div>

        {/* -- 2. resumo do dia -- */}
        <div className={styles.printPage}>
          <div className={styles.printEyebrow}>Resumo</div>
          <div className={styles.printPageTitle}>Seus números</div>
          <div className={styles.printPageHint}>
            Camada 1 (quanto comer): taxa metabólica basal, gasto semanal e a meta calórica ajustada ao seu objetivo, já com margem de segurança.
          </div>
          <div className={styles.printStatGrid}>
            <div className={styles.printStatCard}>
              <div className={styles.printStatLabel}>TMB</div>
              <div className={styles.printStatValue}>
                {b.tmb}
                <small>kcal</small>
              </div>
              <div className={styles.printStatFoot}>Mifflin-St Jeor</div>
            </div>
            <div className={styles.printStatCard}>
              <div className={styles.printStatLabel}>Gasto semanal</div>
              <div className={styles.printStatValue}>
                {b.weeklyTDEE}
                <small>kcal</small>
              </div>
              <div className={styles.printStatFoot}>basal + rotina + treinos</div>
            </div>
            <div className={styles.printStatCard}>
              <div className={styles.printStatLabel}>Meta semanal</div>
              <div className={styles.printStatValue}>
                {b.weeklyTarget}
                <small>kcal</small>
              </div>
              <div className={styles.printStatFoot}>
                {b.pct > 0 ? `−${Math.round(b.pct * 100)}%` : "manutenção"} + margem de −{Math.round(b.safetyMargin * 100)}%
              </div>
            </div>
            <div className={styles.printStatCard}>
              <div className={styles.printStatLabel}>Proteína ({trainDay.label})</div>
              <div className={styles.printStatValue}>
                {b.proteinG}
                <small>g</small>
              </div>
              <div className={styles.printStatFoot}>{state.proteinaGkg.toFixed(1)} g/kg · fixo todo dia</div>
            </div>
            <div className={styles.printStatCard}>
              <div className={styles.printStatLabel}>Gordura ({trainDay.label})</div>
              <div className={styles.printStatValue}>
                {b.fatG}
                <small>g</small>
              </div>
              <div className={styles.printStatFoot}>{state.gorduraGkg.toFixed(2)} g/kg · fixo todo dia</div>
            </div>
            <div className={styles.printStatCard}>
              <div className={styles.printStatLabel}>Carboidrato ({trainDay.label})</div>
              <div className={styles.printStatValue}>
                {trainDay.carbG}
                <small>g</small>
              </div>
              <div className={styles.printStatFoot}>varia por dia — macro do banking</div>
            </div>
          </div>
          <table className={styles.printMiniTable}>
            <caption className={styles.printEyebrow} style={{ marginBottom: "3mm" }}>
              Calorie banking da semana
            </caption>
            <thead>
              <tr>
                <th>Dia</th>
                <th>Meta</th>
                <th>Carboidrato</th>
                <th>Refeição livre</th>
              </tr>
            </thead>
            <tbody>
              {b.days.map((d) => (
                <tr key={d.i} className={d.isTraining ? styles.printTrTraining : undefined}>
                  <td>
                    {d.label}
                    {d.isTraining ? " · treino" : ""}
                  </td>
                  <td>{d.target} kcal</td>
                  <td>{d.isFreeDay ? "—" : `${d.carbG}g`}</td>
                  <td>{d.refeicaoLivreKcal > 0 ? `~${d.refeicaoLivreKcal} kcal` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* -- 3. linha do tempo -- */}
        <div className={styles.printPage}>
          <div className={styles.printEyebrow}>Camada 2</div>
          <div className={styles.printPageTitle}>
            Linha do tempo — treino às {state.treinoHorario} ({state.treinoDuracao}min)
          </div>
          <div className={styles.printPageHint}>Onde cada refeição sua cai em relação ao horário real do treino informado no passo 05 — é este cálculo, não o nome da refeição, que decide a classificação de cada uma.</div>
          <div className={styles.printTlTrack}>
            {ZONE_ORDER.map((key, idx) => {
              const zr = z[key];
              const meta = ZONE_META[key];
              const left = pctPos(zr[0]);
              const width = Math.max(0.5, pctPos(zr[1]) - left);
              // Narrow zones (imediato, durante) sit right next to each
              // other -- stagger the label rows so adjacent zone names
              // never collide into unreadable overlapping text.
              const rowOffsets = ["2mm", "6.5mm", "11mm"];
              return (
                <div key={key} className={styles.printTlZone} style={{ left: `${left}%`, width: `${width}%`, background: meta.soft }}>
                  <span className={styles.printTlZoneLabel} style={{ color: meta.color, top: rowOffsets[idx % rowOffsets.length] }}>
                    {meta.label}
                  </span>
                </div>
              );
            })}
            {[...state.refeicoes]
              .sort((a, b) => normalizeToTraining(minsOfDay(a.hora), z.t0) - normalizeToTraining(minsOfDay(b.hora), z.t0))
              .map((r, idx) => {
                const mm = normalizeToTraining(minsOfDay(r.hora), z.t0);
                const zoneKey = classify(minsOfDay(r.hora), z);
                const meta = ZONE_META[zoneKey];
                // Stagger meal pin labels across two rows (alternating) so
                // meals close together in time don't print their labels
                // on top of each other.
                const rowBottoms = ["9mm", "16.5mm"];
                return (
                  <div key={r.id} className={styles.printTlMeal} style={{ left: `${pctPos(mm)}%` }}>
                    <span className={styles.printTlMealLabel} style={{ bottom: rowBottoms[idx % rowBottoms.length] }}>
                      {r.label} · {r.hora}
                    </span>
                    <span className={styles.printTlMealDot} style={{ background: meta.color }} />
                  </div>
                );
              })}
          </div>
          <div className={styles.printTlAxis}>
            {ticks.map((tmin) => (
              <span key={tmin} className={styles.printTlTick} style={{ left: `${pctPos(tmin)}%` }}>
                {fmtMin(tmin)}
              </span>
            ))}
          </div>
          <div className={styles.printLegend}>
            {[...ZONE_ORDER, "livre" as ZoneKey].map((key) => (
              <div key={key} className={styles.printLegendItem}>
                <span className={styles.printLegendDot} style={{ background: ZONE_META[key].color }} />
                {ZONE_META[key].label}
              </div>
            ))}
          </div>
        </div>

        {/* -- 4. refeições -- */}
        <div className={styles.printPage}>
          <div className={styles.printEyebrow}>Plano alimentar</div>
          <div className={styles.printPageTitle}>
            Refeições — dia de treino ({trainDay.label})
          </div>
          {despensaComplete ? (
            <>
              <div className={styles.printPageHint} style={{ marginBottom: "6mm" }}>
                Montado só com os alimentos marcados no passo 06. Quando uma porção ultrapassaria uma faixa realista
                pra um único alimento, o restante do macro é dividido com um segundo alimento da mesma categoria.
              </div>
              {mealPlan.map((row) => {
                const meta = ZONE_META[row.zoneKey];
                const carbG = macroOfPortions(row.carbPortions, (f) => f.c);
                const proteinG = macroOfPortions(row.proteinPortions, (f) => f.p);
                const fatG = macroOfPortions(row.fatPortions, (f) => f.g);
                return (
                  <div key={row.refeicao.id} className={styles.printMealCard}>
                    <div className={styles.printMealHead}>
                      <span>
                        <span className={styles.printMealName}>{row.refeicao.label}</span>
                        <span className={styles.printMealTime}>{row.refeicao.hora}</span>
                      </span>
                      <span className={styles.printMealTag} style={{ background: meta.soft, color: meta.color }}>
                        {meta.label}
                      </span>
                    </div>
                    <div className={styles.printMealRec}>{meta.rec}</div>
                    <div className={styles.printMealItems}>
                      {[...row.carbPortions, ...row.proteinPortions, ...row.fatPortions].map((p, idx) => (
                        <div key={`${p.food.id}-${idx}`} className={styles.printMealItem}>
                          <span>{p.food.nome}</span>
                          <span className={styles.printMealItemQty}>
                            ~{p.grams}g · {kcalOfPortions([p])} kcal
                          </span>
                        </div>
                      ))}
                      <div className={styles.printMealItem}>
                        <span>Vegetais / salada</span>
                        <span className={styles.printMealItemQty}>à vontade</span>
                      </div>
                    </div>
                    <div className={styles.printMealFoot}>
                      ~{row.mealKcal} kcal · {carbG}g carbo · {proteinG}g proteína · {fatG}g gordura
                    </div>
                  </div>
                );
              })}
              {state.refeicaoLivreKcal > 0 && (
                <p className={styles.printTableNote} style={{ marginTop: "4mm" }}>
                  Sua refeição livre (~{state.refeicaoLivreKcal} kcal, tirados do total da semana) está reservada pro{" "}
                  {DIAS[state.refeicaoLivreDia]} — um dia inteiro livre, sem meta de macro nenhuma — veja o calorie
                  banking da semana na página anterior.
                </p>
              )}
              <p className={styles.printTableNote} style={{ marginTop: "6mm" }}>
                Total do dia (refeições sugeridas): ~{mealPlanTotalKcal} kcal
                {trainDay.target > 0 ? ` (meta: ${trainDay.target} kcal).` : "."} Vegetais/salada à vontade em toda
                refeição, fora do cálculo calórico. Quantidades arredondadas a cada 5g.
              </p>
            </>
          ) : (
            <p className={styles.printTableNote}>
              Lista de alimentos incompleta no passo 06 (faltando {missingCats.join(" e de ")}) — plano de refeições
              não gerado.
            </p>
          )}
        </div>

        {/* -- 5. disclaimer -- */}
        <div className={`${styles.printPage} ${styles.printDisclaimerPage}`}>
          <div className={styles.printEyebrow}>Antes de seguir</div>
          <div className={styles.printPageTitle}>Aviso importante</div>
          <div className={styles.disclaimerCard}>
            <p>
              Os números de janela (45–90min de risco, pico por volta dos 75min, 3–4h antes, 24–48h de sensibilidade
              pós-treino) vêm de estudos com atletas e protocolos controlados — existe variação individual conforme
              sensibilidade à insulina, tipo de treino e composição da refeição anterior. Trate como estimativa
              baseada em evidência e ajuste conforme sua resposta.
            </p>
            <p>
              <strong style={{ color: "var(--foreground)" }}>Conteúdo educativo — não substitui acompanhamento nutricional ou médico individualizado.</strong>{" "}
              As calorias, macros e sugestões de refeição aqui são estimativas calculadas a partir de fórmulas gerais
              (Mifflin-St Jeor, tabelas de MET), com uma margem de segurança embutida — não um diagnóstico. Elas não
              conhecem seus exames, condições de saúde, histórico ou resposta individual. Esta calculadora não
              promete um resultado numérico fechado de perda ou ganho de peso.
            </p>
            <p>
              <strong style={{ color: "var(--foreground)" }}>Procure acompanhamento de um nutricionista ou médico o quanto antes.</strong>{" "}
              Antes de seguir este plano, o ideal é validar essas quantidades e ajustá-las com um profissional que
              conheça seu histórico de saúde, seus exames e sua resposta individual — é isso que transforma uma
              estimativa em um plano seguro pra você.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
