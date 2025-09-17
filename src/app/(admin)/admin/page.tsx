
import { redirect } from 'next/navigation';

export default function AdminPage() {
  // Redirect to the default admin page
  redirect('/admin/companies');
}
