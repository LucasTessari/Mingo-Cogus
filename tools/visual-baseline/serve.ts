// Sobe o site original (ICO) com a API falsa, para comparar lado a lado com o site novo.
//   npm run serve -w @mingo/visual-baseline   ->  http://localhost:3101
import { ICO_URL, MOCK_PORT, prepareIcoApp, startIcoApp, waitFor } from './capture';
import { startMockIcoApi } from './mock-ico-api';

prepareIcoApp();
await startMockIcoApi(MOCK_PORT);
const icoApp = startIcoApp();
process.on('SIGINT', () => {
  icoApp.kill();
  process.exit(0);
});
await waitFor(ICO_URL, 180_000);
console.log(`✅ Site original em ${ICO_URL}`);
