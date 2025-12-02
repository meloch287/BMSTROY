import { NextResponse } from 'next/server';
import { getCollection, addToCollection, saveCollection } from '@/lib/db';
import { unlinkClientFromLead } from '@/lib/linking';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uuid = searchParams.get('uuid');
  const clients = getCollection('clients');
  
  if (uuid) {
      const client = clients.find((c: any) => c.uuid === uuid);
      return client ? NextResponse.json(client) : NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(clients);
}

export async function POST(request: Request) {
  const body = await request.json();
  
  if (body.action === 'create') {
      const newClient = {
          ...body.data,
          uuid: Math.random().toString(36).substring(2) + Date.now().toString(36),
          reports: [],
          progress: 0,
          currentStage: '',
          // Store leadId if creating from lead (Requirements: 2.3)
          leadId: body.data.leadId || undefined,
      };
      
      // If creating from lead, update lead with clientUuid
      if (body.data.leadId) {
        const leads = getCollection('leads');
        const leadIndex = leads.findIndex((l: any) => l.id === body.data.leadId);
        if (leadIndex !== -1) {
          leads[leadIndex].clientUuid = newClient.uuid;
          saveCollection('leads', leads);
        }
      }
      
      return NextResponse.json(addToCollection('clients', newClient));
  }
  
  if (body.action === 'add_report') {
      const clients = getCollection('clients');
      const client = clients.find((c: any) => c.uuid === body.clientUuid);
      if (client) {
          if (!client.reports) client.reports = [];
          client.reports.unshift(body.report);
          saveCollection('clients', clients);
          return NextResponse.json({ success: true });
      }
  }
  return NextResponse.json({ error: 'Action unknown' }, { status: 400 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const clients = getCollection('clients');
  const index = clients.findIndex((c: any) => c.uuid === body.uuid);
  
  if (index !== -1) {
    clients[index] = { ...clients[index], ...body.data };
    saveCollection('clients', clients);
    return NextResponse.json(clients[index]);
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const uuid = searchParams.get('uuid');
  
  if (!uuid) {
    return NextResponse.json({ error: 'UUID required' }, { status: 400 });
  }
  
  const clients = getCollection('clients');
  
  // Find client to get linked entities
  const client = clients.find((c: any) => c.uuid === uuid);
  
  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }
  
  // Clean up lead reference (Requirements: 5.2)
  unlinkClientFromLead(uuid);
  
  // Delete linked estimate if exists
  if (client.estimateUuid) {
    const estimates = getCollection('estimates');
    const filteredEstimates = estimates.filter((e: any) => e.uuid !== client.estimateUuid);
    saveCollection('estimates', filteredEstimates);
  }
  
  // Delete client
  const filtered = clients.filter((c: any) => c.uuid !== uuid);
  saveCollection('clients', filtered);
  return NextResponse.json({ success: true });
}