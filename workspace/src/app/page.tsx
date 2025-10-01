
import { redirect } from 'next/navigation';

export default function RootPage() {
  // The main page of the app is the tasks page.
  // Redirect any traffic from the root to the /tasks route.
  redirect('/tasks');
}
