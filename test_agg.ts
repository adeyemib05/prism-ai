import { resolveTokenData } from './src/data/dataAggregator';

async function test() {
  console.log("Resolving BTC...");
  const data = await resolveTokenData('BTC');
  console.log(JSON.stringify(data, null, 2));
}
test();
