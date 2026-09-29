import { resetE2EDatabase } from './database';

export default async function globalSetup() {
  await resetE2EDatabase();
}
