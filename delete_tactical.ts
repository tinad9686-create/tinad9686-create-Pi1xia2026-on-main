import fs from 'fs';

const content = fs.readFileSync('src/components/NeonGameSandbox.tsx', 'utf8');
const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.startsWith('function TacticalPositioning({'));
const endIndex = lines.findIndex((l, i) => i > startIndex && l.startsWith('function TrajectoryLine('));

if (startIndex !== -1 && endIndex !== -1) {
  lines.splice(startIndex, endIndex - startIndex);
  fs.writeFileSync('src/components/NeonGameSandbox.tsx', lines.join('\n'));
} else {
  console.error("Could not find boundaries.");
}
