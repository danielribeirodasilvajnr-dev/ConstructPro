const inss = 3060.70;
const targetMulta4 = 254.80;
const targetMulta3 = 560.57;

// Let's test daily rate from 0.30% to 0.40% in steps of 0.001%, and days from 1 to 100.
let found = false;
for (let rateBP = 300; rateBP <= 400; rateBP++) {
  const rate = rateBP / 100000; // e.g. 0.0033
  for (let days4 = 1; days4 <= 100; days4++) {
    for (let days3 = days4 + 1; days3 <= 100; days3++) {
      const m4 = Math.round(inss * Math.min(0.20, days4 * rate) * 100) / 100;
      const m3 = Math.round(inss * Math.min(0.20, days3 * rate) * 100) / 100;
      if (m4 === targetMulta4 && m3 === targetMulta3) {
        console.log(`Match! Rate: ${(rate * 100).toFixed(4)}%, days4: ${days4}, days3: ${days3}`);
        found = true;
      }
    }
  }
}

if (!found) {
  console.log("No exact match found with simple formula. Let's try if the fine is calculated on a corrected INSS.");
  // Let's test with corrected INSS = inss * (1 + correction)
  // Competitor average correction is 1.060% (1.0106)
  const correctedInss = inss * 1.0106;
  console.log("Corrected INSS:", correctedInss);
  for (let rateBP = 300; rateBP <= 400; rateBP++) {
    const rate = rateBP / 100000;
    for (let days4 = 1; days4 <= 100; days4++) {
      for (let days3 = days4 + 1; days3 <= 100; days3++) {
        const m4 = Math.round(correctedInss * Math.min(0.20, days4 * rate) * 100) / 100;
        const m3 = Math.round(correctedInss * Math.min(0.20, days3 * rate) * 100) / 100;
        if (m4 === targetMulta4 && m3 === targetMulta3) {
          console.log(`Match with corrected INSS! Rate: ${(rate * 100).toFixed(4)}%, days4: ${days4}, days3: ${days3}`);
          found = true;
        }
      }
    }
  }
}
