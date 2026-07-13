import axios from 'axios';

async function run() {
  console.log('Testing MCP Endpoints on localhost:3000...\n');
  
  try {
    console.log('1. GET /tools');
    const tools = await axios.get('http://127.0.0.1:3000/tools');
    console.log(`Found ${tools.data.tools.length} tools`);
    
    console.log('\n2. POST /tools/quick_check (Free)');
    const qc = await axios.post('http://127.0.0.1:3000/tools/quick_check', { symbol: 'PEPE' });
    console.log(`Verdict: ${qc.data.data.verdict}`);
    
    console.log('\n3. POST /tools/analyze_token (Premium - mock paid)');
    const report = await axios.post('http://127.0.0.1:3000/tools/analyze_token', { symbol: 'BTC' });
    console.log(`Report generated successfully. Length: ${report.data.data.markdown.length} chars`);
    
    console.log('\nAll endpoints working correctly!');
  } catch (error: any) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

run();
