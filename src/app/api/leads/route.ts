import { NextResponse } from 'next/server';
import { getCollection, addToCollection, deleteCollectionItem } from '@/lib/db';
import { sendTelegramNotification } from '@/lib/telegram';

export async function GET() {
  const leads = getCollection('leads');
  return NextResponse.json(leads);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.name || !body.phone) {
        return NextResponse.json({ error: 'Name and Phone are required' }, { status: 400 });
    }

    const newLead = addToCollection('leads', { ...body, status: 'new' });

    const message = `🔥 <b>Новая заявка!</b>\n\n` +
                    `👤 <b>Имя:</b> ${body.name}\n` +
                    `📞 <b>Телефон:</b> ${body.phone}\n` +
                    `📌 <b>Тип:</b> ${body.type || 'Заявка с сайта'}\n` +
                    `🕒 <b>Время:</b> ${new Date().toLocaleString('ru-RU')}`;

    sendTelegramNotification(message);

    return NextResponse.json(newLead);
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      deleteCollectionItem('leads', Number(id));
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'No ID provided' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}