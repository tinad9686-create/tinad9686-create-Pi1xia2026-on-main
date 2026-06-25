const csvText = "Grace,Hugo,11,Gu ge,Tracy,5\rSarah Su,Iris,11,Molly,Rubin,5";
const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
console.log("lines count:", lines.length);
console.log("lines[0]:", lines[0]);

const parts = lines[0].split(/[,\t;]/).map(s => s.trim().replace(/^"|"$/g, ''));
console.log("parts length:", parts.length);
console.log("parts[5]:", parts[5]);

const score2 = parseInt(parts[5]) || 0;
console.log("score2:", score2);
