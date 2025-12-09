import { NextResponse } from 'next/server';
import { getCollection, addToCollection, saveCollection } from '@/lib/db';
import { sendTelegramNotification } from '@/lib/telegram';
import { linkEstimateToClient, unlinkEstimateFromClient } from '@/lib/linking';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uuid = searchParams.get('uuid');
  const estimates = getCollection('estimates');
  
  if (uuid) {
    const est = estimates.find((e: any) => e.uuid === uuid);
    return est ? NextResponse.json(est) : NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(estimates);
}

export async function POST(request: Request) {
  const body = await request.json();
  
  if (body.action === 'create') {
    const estimateUuid = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const newEst = {
      ...body.data,
      uuid: estimateUuid,
      items: body.data.items || [],
      // Accept clientUuid for linking (Requirements: 3.4)
      clientUuid: body.data.clientUuid || undefined,
      createdAt: new Date().toISOString()
    };
    
    const savedEstimate = addToCollection('estimates', newEst);
    
    // If clientUuid provided, create bidirectional link (Requirements: 3.4)
    if (body.data.clientUuid) {
      linkEstimateToClient(estimateUuid, body.data.clientUuid);
    }
    
    return NextResponse.json(savedEstimate);
  }
  
  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const estimates = getCollection('estimates');
  const index = estimates.findIndex((e: any) => e.uuid === body.uuid);
  
  if (index !== -1) {
    const estimate = estimates[index];
    
    if (body.approved !== undefined && body.approved === true && !estimate.approved) {
      // Mark as approved
      estimates[index].approved = true;
      estimates[index].approvedItems = body.approvedItems;
      estimates[index].approvedAt = new Date().toISOString();
      if (body.clientPhone) estimates[index].clientPhone = body.clientPhone;
      
      const clients = getCollection('clients');
      let clientUuid = estimate.clientUuid;
      
      // Check if estimate already has a linked client (Requirements: 4.4)
      if (clientUuid) {
        // Update existing client status on approval
        const clientIndex = clients.findIndex((c: any) => c.uuid === clientUuid);
        if (clientIndex !== -1) {
          clients[clientIndex].currentStage = 'Смета согласована';
          clients[clientIndex].progress = clients[clientIndex].progress || 0;
          saveCollection('clients', clients);
        }
      } else {
        // Auto-create client from estimate data if no client linked
        clientUuid = Math.random().toString(36).substring(2) + Date.now().toString(36);
        
        const newClient = {
          uuid: clientUuid,
          name: estimate.clientName,
          phone: estimate.clientPhone || '',
          email: estimate.clientEmail || '',
          project: estimate.address || 'Проект по смете ' + estimate.uuid.slice(0, 8),
          estimateUuid: estimate.uuid,
          progress: 0,
          currentStage: 'Смета согласована',
          reports: [],
          createdAt: new Date().toISOString()
        };
        
        clients.push(newClient);
        saveCollection('clients', clients);
        
        // Save client UUID to estimate
        estimates[index].clientUuid = clientUuid;
      }
      
      // Send Telegram notification
      const total = estimate.items?.reduce((a: number, i: any) => a + Number(i.price || 0), 0) || 0;
      const notifyMessage = `✅ <b>Смета согласована!</b>\n\n` +
        `👤 <b>Клиент:</b> ${estimate.clientName}\n` +
        `📞 <b>Телефон:</b> ${body.clientPhone || estimate.clientPhone || 'Не указан'}\n` +
        `💰 <b>Сумма:</b> ${total.toLocaleString()} ₽\n` +
        `📍 <b>Адрес:</b> ${estimate.address || 'Не указан'}\n` +
        `🕒 <b>Время:</b> ${new Date().toLocaleString('ru-RU')}`;
      
      sendTelegramNotification(notifyMessage);
    }
    
    if (body.data) {
      estimates[index] = { ...estimates[index], ...body.data };
    }
    
    saveCollection('estimates', estimates);
    return NextResponse.json(estimates[index]);
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const uuid = searchParams.get('uuid');
  
  if (!uuid) {
    return NextResponse.json({ error: 'UUID required' }, { status: 400 });
  }
  
  const estimates = getCollection('estimates');
  
  // Find estimate to get linked client
  const estimate = estimates.find((e: any) => e.uuid === uuid);
  
  if (!estimate) {
    return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
  }
  
  // Clean up client reference instead of deleting client (Requirements: 5.3)
  // This removes estimateUuid from the linked client
  unlinkEstimateFromClient(uuid);
  
  // Delete estimate
  const filtered = estimates.filter((e: any) => e.uuid !== uuid);
  saveCollection('estimates', filtered);
  return NextResponse.json({ success: true });
}