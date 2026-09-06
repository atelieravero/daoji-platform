import React from 'react';
import { notFound } from 'next/navigation';
import EventEditor from '@/components/admin/EventEditor';
import { getEventAction } from '../actions';

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;
  const res = await getEventAction(id);

  if (res.error || !res.data) {
    notFound();
  }

  return <EventEditor initialEvent={res.data} isNew={false} />;
}