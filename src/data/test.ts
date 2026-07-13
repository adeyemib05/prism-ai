import { resolveTokenData } from './dataAggregator';

async function run() {
  console.log('--- Testing BTC ---');
  try {
    const btc = await resolveTokenData('BTC');
    console.log(`Success! Price: $${btc.price}, Source: ${btc.source}`);
  } catch (e: any) {
    console.error('BTC failed:', e.message);
  }

  console.log('\n--- Testing PEPE ---');
  try {
    const pepe = await resolveTokenData('PEPE');
    console.log(`Success! Price: $${pepe.price}, Source: ${pepe.source}`);
  } catch (e: any) {
    console.error('PEPE failed:', e.message);
  }

  console.log('\n--- Testing ethereum ---');
  try {
    const eth = await resolveTokenData('ethereum');
    console.log(`Success! Price: $${eth.price}, Source: ${eth.source}`);
  } catch (e: any) {
    console.error('ethereum failed:', e.message);
  }
}

run();
