import LeagueApp from './league-app';
import { getLeague } from '../lib/league.mjs';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const initialData = await getLeague();
  return <LeagueApp initialData={initialData} />;
}
