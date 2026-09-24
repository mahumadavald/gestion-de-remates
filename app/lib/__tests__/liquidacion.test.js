import { describe, it, expect } from "vitest";
import { calcLiquidacion } from "../liquidacion.js";

// ── helpers ──────────────────────────────────────────────────────────────────
const lote = (overrides = {}) => ({
  lote: "Mesa de madera",
  exp: "E-001",
  monto: 100_000,
  comPct: 10,
  motorizado: false,
  afectoIva: false,
  ...overrides,
});

const IVA = 0.19;
const round = (n) => Math.round(n);

// ── calcLiquidacion ───────────────────────────────────────────────────────────

describe("calcLiquidacion — caso base (un lote exento, comisión 10%)", () => {
  const monto = 200_000;
  const com = round(monto * 0.10);           // 20_000
  const ivaBase = com;                        // solo AF
  const iva = round(ivaBase * IVA);           // 3_800
  const total = monto + com + iva;            // 223_800

  const result = calcLiquidacion([lote({ monto })], null);

  it("totalEx == monto del lote", () => expect(result.totalEx).toBe(monto));
  it("totalCom == 10% del monto", () => expect(result.totalCom).toBe(com));
  it("totalAf == 0 (sin motorizado, sin afectoIva)", () => expect(result.totalAf).toBe(0));
  it("iva == 19% de comisión", () => expect(result.iva).toBe(iva));
  it("total == monto + com + iva", () => expect(result.total).toBe(total));
  it("garantia == 0 (sin postor)", () => expect(result.garantia).toBe(0));
  it("totalAPagar == total cuando no hay garantía", () => expect(result.totalAPagar).toBe(total));
  it("lineas tiene 1 entrada", () => expect(result.lineas).toHaveLength(1));
  it("linea.motorizado == false", () => expect(result.lineas[0].motorizado).toBe(false));
});

describe("calcLiquidacion — comisión personalizada 5%", () => {
  const monto = 500_000;
  const comPct = 5;
  const com = round(monto * comPct / 100);   // 25_000
  const iva = round(com * IVA);              // 4_750
  const total = monto + com + iva;

  const result = calcLiquidacion([lote({ monto, comPct })], null);

  it("comisión correcta al 5%", () => expect(result.totalCom).toBe(com));
  it("total correcto con comPct=5", () => expect(result.total).toBe(total));
  it("linea.comPct == 5", () => expect(result.lineas[0].comPct).toBe(5));
});

describe("calcLiquidacion — vehículo motorizado (gastos administrativos)", () => {
  const monto = 1_000_000;
  const GASTO = 72_000;
  const com = round(monto * 0.10);                    // 100_000
  const gastosAdm = GASTO;                             // 72_000
  const ivaBase = com + gastosAdm;                    // 172_000 (ambos AF)
  const iva = round(ivaBase * IVA);
  const total = monto + com + gastosAdm + iva;

  const result = calcLiquidacion([lote({ monto, motorizado: true })], null, GASTO);

  it("totalAf incluye gastoAdminMotorizado", () => expect(result.totalAf).toBe(gastosAdm));
  it("totalCom correcto", () => expect(result.totalCom).toBe(com));
  it("iva sobre com + gastosAdm", () => expect(result.iva).toBe(iva));
  it("total correcto con motorizado", () => expect(result.total).toBe(total));
  it("linea.gastosAdm == GASTO", () => expect(result.lineas[0].gastosAdm).toBe(GASTO));
  it("linea.motorizado == true", () => expect(result.lineas[0].motorizado).toBe(true));
});

describe("calcLiquidacion — gastoAdminMotorizado personalizado", () => {
  const monto = 800_000;
  const GASTO = 95_000;
  const com = round(monto * 0.10);
  const ivaBase = com + GASTO;
  const iva = round(ivaBase * IVA);
  const total = monto + com + GASTO + iva;

  const result = calcLiquidacion([lote({ monto, motorizado: true })], null, GASTO);

  it("usa el gasto personalizado", () => expect(result.totalAf).toBe(GASTO));
  it("total es correcto con gasto personalizado", () => expect(result.total).toBe(total));
});

describe("calcLiquidacion — múltiples lotes", () => {
  const lotes = [
    lote({ monto: 100_000, comPct: 10 }),
    lote({ lote: "Silla", exp: "E-002", monto: 50_000, comPct: 10 }),
    lote({ lote: "Auto", exp: "E-003", monto: 200_000, comPct: 10, motorizado: true }),
  ];
  const GASTO = 72_000;
  const totalEx = 100_000 + 50_000 + 200_000;          // 350_000
  const totalCom = round((100_000 + 50_000 + 200_000) * 0.10); // 35_000
  const totalAf = GASTO;                               // solo del motorizado
  const ivaBase = totalCom + totalAf;
  const iva = round(ivaBase * IVA);
  const total = totalEx + totalCom + totalAf + iva;

  const result = calcLiquidacion(lotes, null, GASTO);

  it("3 lineas", () => expect(result.lineas).toHaveLength(3));
  it("totalEx suma los 3 lotes", () => expect(result.totalEx).toBe(totalEx));
  it("totalCom suma comisiones de los 3 lotes", () => expect(result.totalCom).toBe(totalCom));
  it("totalAf solo del motorizado", () => expect(result.totalAf).toBe(GASTO));
  it("iva correcto", () => expect(result.iva).toBe(iva));
  it("total correcto", () => expect(result.total).toBe(total));
});

describe("calcLiquidacion — garantía descuenta del total a pagar", () => {
  const monto = 300_000;
  const com = round(monto * 0.10);
  const iva = round(com * IVA);
  const total = monto + com + iva;
  const garantiaMonto = 200_000;

  const postor = { name: "Juan Pérez", nComprador: 1 };
  const garantias = [
    { postor: "Juan Pérez", estado: "aprobada", monto: garantiaMonto },
  ];

  const result = calcLiquidacion([lote({ monto })], postor, 72_000, garantias);

  it("garantia == monto de la garantía aprobada", () => expect(result.garantia).toBe(garantiaMonto));
  it("totalAPagar == total - garantia", () => expect(result.totalAPagar).toBe(total - garantiaMonto));
});

describe("calcLiquidacion — garantía mayor al total (totalAPagar mínimo 0)", () => {
  const monto = 50_000;
  const com = round(monto * 0.10);
  const iva = round(com * IVA);
  const total = monto + com + iva;
  const garantiaMonto = 500_000; // mayor al total

  const postor = { name: "Ana García" };
  const garantias = [{ postor: "Ana García", estado: "aprobada", monto: garantiaMonto }];

  const result = calcLiquidacion([lote({ monto })], postor, 72_000, garantias);

  it("totalAPagar nunca es negativo", () => expect(result.totalAPagar).toBe(0));
  it("garantia refleja el monto real", () => expect(result.garantia).toBe(garantiaMonto));
  it("total no se modifica", () => expect(result.total).toBe(total));
});

describe("calcLiquidacion — garantía pendiente (no aprobada) no descuenta", () => {
  const monto = 200_000;
  const com = round(monto * 0.10);
  const iva = round(com * IVA);
  const total = monto + com + iva;

  const postor = { name: "Carlos López" };
  const garantias = [{ postor: "Carlos López", estado: "pendiente", monto: 100_000 }];

  const result = calcLiquidacion([lote({ monto })], postor, 72_000, garantias);

  it("garantia == 0 cuando estado != aprobada", () => expect(result.garantia).toBe(0));
  it("totalAPagar == total", () => expect(result.totalAPagar).toBe(total));
});

describe("calcLiquidacion — sin postor (garantia siempre 0)", () => {
  const result = calcLiquidacion([lote({ monto: 100_000 })], null, 72_000, [
    { postor: "Alguien", estado: "aprobada", monto: 50_000 },
  ]);

  it("sin postor la garantia es 0", () => expect(result.garantia).toBe(0));
});

describe("calcLiquidacion — lote afecto a IVA (totalAf incluye el monto del lote)", () => {
  const monto = 100_000;
  const com = round(monto * 0.10);           // 10_000
  const ivaBase = monto + com;              // monto también es AF
  const iva = round(ivaBase * IVA);
  const total = monto + com + iva;

  const result = calcLiquidacion([lote({ monto, afectoIva: true })], null);

  it("totalEx == 0 cuando afectoIva", () => expect(result.totalEx).toBe(0));
  it("totalAf incluye el monto del lote", () => {
    // totalAf acumula: monto afecto (al ser afectoIva=true), sin motorizado
    // La lógica actual: if(afecto) totalAf += l.monto; else totalEx += l.monto;
    // Más totalAf += gastosAdm (0)
    // ivaBase = totalCom + totalAf
    expect(result.totalAf).toBe(monto);
  });
  it("iva aplicado sobre monto + com", () => expect(result.iva).toBe(iva));
  it("total correcto", () => expect(result.total).toBe(total));
});

describe("calcLiquidacion — lote con comPct faltante usa default 10%", () => {
  const monto = 100_000;
  const com = round(monto * 0.10);

  const loteSinCom = { lote: "X", exp: "", monto, motorizado: false, afectoIva: false };
  const result = calcLiquidacion([loteSinCom], null);

  it("usa 10% cuando comPct es undefined", () => expect(result.totalCom).toBe(com));
  it("linea.comPct == 10", () => expect(result.lineas[0].comPct).toBe(10));
});

describe("calcLiquidacion — array de lotes vacío", () => {
  const result = calcLiquidacion([], null);

  it("totalEx == 0", () => expect(result.totalEx).toBe(0));
  it("totalCom == 0", () => expect(result.totalCom).toBe(0));
  it("total == 0", () => expect(result.total).toBe(0));
  it("lineas vacías", () => expect(result.lineas).toHaveLength(0));
  it("garantia == 0", () => expect(result.garantia).toBe(0));
  it("totalAPagar == 0", () => expect(result.totalAPagar).toBe(0));
});
