// Let's analyze what parameters result in INSS Inicial = 80198.85 for area = 417.
// Under SP, dest = Residencial unifamiliar (fatorDest = 0.89).
// Concrete = Sim (percAjuste = 5.00%).
// Responsavel = pessoa física (aliquotaINSS = 0.3680).
// percUsoUF = 4.90.
// baseMaoObra is either progressive or tier-based.

const area = 417;
const targetInss = 80198.85;
const fatorDest = 0.89;
const aliquotaINSS = 0.3680;
const percUsoUF = 4.90;
const percAjuste = 5.00;
const abatimentoPerc = (percUsoUF * percAjuste) / 100; // 0.245

console.log("Abatimento:", abatimentoPerc);

// Let's calculate for different baseMaoObra values.
// Under RFB, the base percentage can be:
// 1. Tier-based: 18.00% (or 20.00% previously)
// 2. Progressive:
//    - up to 100: 4%
//    - 100 to 250: 8%
//    - 250 to 350: 11%
//    - 350 to 400: 14%
//    - above 400: 18% (or 20%?)

function getProgressiveBase(a) {
  let sum = 0;
  if (a <= 100) {
    sum += a * 4;
  } else {
    sum += 100 * 4;
    if (a <= 250) {
      sum += (a - 100) * 8;
    } else {
      sum += 150 * 8;
      if (a <= 350) {
        sum += (a - 250) * 11;
      } else {
        sum += 100 * 11;
        if (a <= 400) {
          sum += (a - 350) * 14;
        } else {
          sum += 50 * 14;
          sum += (a - 400) * 18; // or 20%
        }
      }
    }
  }
  return sum / a;
}

console.log("Progressive base for 417m²:", getProgressiveBase(417));
console.log("Progressive base for 287m²:", getProgressiveBase(287));

// Now let's find the VAU for each method:
// Method A: Tier-based baseMaoObra = 18%
// Method B: Tier-based baseMaoObra = 20%
// Method C: Progressive with 18% above 400
// Method D: Progressive with 20% above 400

const methods = [
  { name: "Tier 18%", getBase: () => 18.00 },
  { name: "Tier 20%", getBase: () => 20.00 },
  { name: "Progressive (18%)", getBase: (a) => getProgressiveBase(a) },
  { name: "Progressive (20% above 400)", getBase: (a) => {
      let sum = 400 + 1200 + 1100 + 700 + (a - 400) * 20;
      return sum / a;
    } 
  }
];

for (const m of methods) {
  const base = m.getBase(area);
  const eff = base - abatimentoPerc;
  // targetInss = area * VAU * fatorDest * (eff / 100) * aliquotaINSS
  const vau = targetInss / (area * fatorDest * (eff / 100) * aliquotaINSS);
  console.log(`${m.name}: base=${base.toFixed(4)}%, eff=${eff.toFixed(4)}%, VAU required=${vau.toFixed(2)}`);
}
