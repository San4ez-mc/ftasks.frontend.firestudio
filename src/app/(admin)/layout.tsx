
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

// This layout is part of a deprecated feature and now only serves to redirect users away.
export default function AdminLayout({ children }: { children: ReactNode }) {
  redirect('/');
}
