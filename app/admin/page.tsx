'use client';

import { useEffect } from 'react';

export default function AdminRootRedirect() {
  useEffect(() => {
    window.location.replace('/admin/events');
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 text-gray-500 font-sans">
      <p>Redirecting to Daoji Admin Portal...</p>
    </div>
  );
}