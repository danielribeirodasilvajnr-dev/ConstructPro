// Let's search for how the competitor's Multa is calculated.
// Competitor INSS = 3060.70
// Month 4 Multa = 254.80
// Month 3 Multa = 560.57
// Month 2 Multa = 612.14 (which is exactly 20% of 3060.70)
// Month 1 Multa = 612.14 (20%)

const inss = 3060.70;
const targetMulta4 = 254.80;
const targetMulta3 = 560.57;

console.log("INSS:", inss);
console.log("Target Multa 4:", targetMulta4, "Ratio:", targetMulta4 / inss);
console.log("Target Multa 3:", targetMulta3, "Ratio:", targetMulta3 / inss);

// Let's test different number of days and daily rates.
// Standard daily rate is 0.33% (0.0033).
for (let days4 = 1; days4 <= 100; days4++) {
  for (let days3 = days4 + 1; days3 <= 100; days3++) {
    // Let's test standard 0.33% daily rate:
    const m4_std = Math.round(inss * Math.min(0.20, days4 * 0.33 / 100) * 100) / 100;
    const m3_std = Math.round(inss * Math.min(0.20, days3 * 0.33 / 100) * 100) / 100;
    if (m4_std === targetMulta4 || m3_std === targetMulta3) {
      console.log(`Std rate 0.33%: days4=${days4} (calc=${m4_std}), days3=${days3} (calc=${m3_std})`);
    }
    
    // What if daily rate is 1/300?
    const m4_300 = Math.round(inss * Math.min(0.20, days4 * (1/300)) * 100) / 100;
    const m3_300 = Math.round(inss * Math.min(0.20, days3 * (1/300)) * 100) / 100;
    if (m4_300 === targetMulta4 || m3_300 === targetMulta3) {
      console.log(`Rate 1/300: days4=${days4} (calc=${m4_300}), days3=${days3} (calc=${m3_300})`);
    }
  }
}
