const API = 'http://localhost:5000/api/analysis/rounds';

const multipliers = [
  71.90, 19.47, 17.79, 33.44, 1.93,
  1.28, 2.75, 26.05, 1.17, 2.12,
  2.11, 1.20, 1.77, 1.20, 1.10,
  2.11, 7.49, 1.44, 4.85, 2.77,
  7.91, 1.39, 8.21, 1.88, 10.73,
  2.21, 1.24, 24.79, 135.24, 5.09
];

async function main() {
  const response = await fetch(API);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data.rounds)) {
    throw new Error('Repons API a pa gen lis rounds lan.');
  }

  const existing = data.rounds;

  const knownHistorical = new Set(
    existing
      .filter(round => round.source === 'historical_result')
      .map(round => round.multiplier)
  );

  let added = 0;
  let skipped = 0;

  for (const multiplier of multipliers) {
    if (knownHistorical.has(multiplier)) {
      console.log(`SKIP ${multiplier}x: deja prezan.`);
      skipped++;
      continue;
    }

    const result = await fetch(API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        multiplier,
        durationSeconds: null,
        source: 'historical_result'
      })
    });

    const body = await result.json();

    if (!result.ok || body.success === false) {
      console.error(`ECHÈK ${multiplier}x:`, body);
      continue;
    }

    console.log(`AJOUTE ${multiplier}x`);
    knownHistorical.add(multiplier);
    added++;
  }

  console.log('\nRezime enpòtasyon:');
  console.log('Nouvo rezilta:', added);
  console.log('Sote:', skipped);
}

main().catch(error => {
  console.error('Erè:', error.message);
  process.exitCode = 1;
});
