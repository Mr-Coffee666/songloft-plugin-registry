import { execSync } from 'child_process';
import { GDStudioConfig } from '../src/config';

const sources = ['netease', 'tencent', 'kuwo', 'joox'];
const keyword = '周杰伦';

async function runTests() {
  console.log('Starting API Tests for GD Studio...\n');
  let allPassed = true;
  
  for (const source of sources) {
    console.log(`[TEST] Testing source: ${source}`);
    
    try {
      const url = `https://music-api.gdstudio.xyz/api.php?types=search&source=${source}&name=${encodeURIComponent(keyword)}&count=5&pages=1`;
      const cmd = `curl.exe -s -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "${url}"`;
      const out = execSync(cmd).toString();
      
      const results = JSON.parse(out);
      
      if (Array.isArray(results) && results.length > 0) {
        console.log(`  ✅ OK: Received ${results.length} items.`);
        console.log(`  -> First item: ${results[0].name} - ${results[0].artist}`);
      } else if (results.list && results.list.length > 0) {
        console.log(`  ✅ OK: Received ${results.list.length} items.`);
        console.log(`  -> First item: ${results.list[0].name} - ${results.list[0].artist}`);
      } else {
        console.log(`  ⚠️ WARN: Received empty array or object:`, out.substring(0, 100));
      }
    } catch (e) {
      console.error(`  ❌ ERROR: Failed to search for source ${source}:`, String(e));
      allPassed = false;
    }
    console.log('');
  }
  
  if (allPassed) {
    console.log('🎉 All sources passed!');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed.');
    process.exit(1);
  }
}

runTests();
