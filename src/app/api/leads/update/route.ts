import { NextResponse } from 'next/server';
import { getCollection, saveCollection } from '@/lib/db';

export async function POST(request: Request) {
  const body = await request.json();
  const { id, status, clientUuid } = body;
  
  const leads = getCollection('leads');
  const index = leads.findIndex((l: any) => l.id === id);
  
  if (index !== -1) {
    // Update status if provided
    if (status !== undefined) {
      leads[index].status = status;
    }
    
    // Update clientUuid if provided (can be set to null to unlink)
    // Requirements: 2.3
    if (clientUuid !== undefined) {
      leads[index].clientUuid = clientUuid;
    }
    
    saveCollection('leads', leads);
    return NextResponse.json({ success: true, lead: leads[index] });
  }
  return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
}