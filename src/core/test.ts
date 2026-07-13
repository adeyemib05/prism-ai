import { generateFullReport, buildQuickCheck } from './reportBuilder';

async function run() {
  console.log('--- Quick Check: PEPE ---');
  try {
    const qc = await buildQuickCheck('PEPE');
    console.log(qc);
  } catch (e: any) {
    console.error('Quick check failed:', e.message);
  }

  console.log('\n--- Full Report: SOL ---');
  const start = Date.now();
  try {
    const report = await generateFullReport('SOL');
    console.log(`Report generated in ${Date.now() - start}ms`);
    console.log(report.markdown);
  } catch (e: any) {
    console.error('Full report failed:', e.message);
  }
  
  console.log('\n--- Full Report: SOL (Cached) ---');
  const start2 = Date.now();
  try {
    const cachedReport = await generateFullReport('SOL');
    console.log(`Cached report retrieved in ${Date.now() - start2}ms`);
  } catch(e:any) {}
}

run().catch(console.error);
