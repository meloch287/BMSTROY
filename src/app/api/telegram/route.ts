import { NextResponse } from 'next/server';
import { saveTelegramSettings, getTelegramSettings } from '@/lib/telegram';

export async function GET() {
  const settings = await getTelegramSettings();
  return NextResponse.json(settings || {});
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action, botToken, chatId, message, imageUrl } = body;
  
  // Save settings action
  if (action === 'saveSettings') {
    const success = await saveTelegramSettings(body.settings);
    return NextResponse.json({ success });
  }

  if (!botToken || !chatId) {
    return NextResponse.json({ success: false, error: 'Missing botToken or chatId' });
  }

  const baseUrl = `https://api.telegram.org/bot${botToken}`;

  try {
    if (action === 'test') {
      // Send test message
      const res = await fetch(`${baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '✅ *Тестовое сообщение*\n\nПодключение к боту БМСтрой работает!',
          parse_mode: 'Markdown'
        })
      });
      
      const data = await res.json();
      
      if (data.ok) {
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json({ success: false, error: data.description });
      }
    }

    if (action === 'broadcast') {
      if (!message) {
        return NextResponse.json({ success: false, error: 'Message is required' });
      }

      let res;
      
      if (imageUrl) {
        // Send photo with caption
        res = await fetch(`${baseUrl}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            photo: imageUrl,
            caption: message,
            parse_mode: 'Markdown'
          })
        });
      } else {
        // Send text message
        res = await fetch(`${baseUrl}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
          })
        });
      }

      const data = await res.json();

      if (data.ok) {
        return NextResponse.json({ success: true, messageId: data.result.message_id });
      } else {
        return NextResponse.json({ success: false, error: data.description });
      }
    }

    if (action === 'notify') {
      // For automatic notifications
      const { type, data: notifyData } = body;
      
      let notifyMessage = '';
      
      switch (type) {
        case 'lead':
          notifyMessage = `🔔 *Новая заявка!*\n\n👤 ${notifyData.name}\n📞 ${notifyData.phone}\n📧 ${notifyData.email || 'Не указан'}\n\n💬 ${notifyData.message || 'Без сообщения'}`;
          break;
        case 'estimate_view':
          notifyMessage = `👁 *Просмотр сметы*\n\n👤 ${notifyData.clientName}\n📋 Смета: ${notifyData.uuid}\n💰 Сумма: ${notifyData.total} ₽`;
          break;
        case 'estimate_approved':
          notifyMessage = `✅ *Смета согласована!*\n\n👤 ${notifyData.clientName}\n📞 ${notifyData.phone}\n💰 Сумма: ${notifyData.total} ₽\n📍 ${notifyData.address || 'Адрес не указан'}`;
          break;
        default:
          notifyMessage = message || 'Уведомление';
      }

      const res = await fetch(`${baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: notifyMessage,
          parse_mode: 'Markdown'
        })
      });

      const responseData = await res.json();
      return NextResponse.json({ success: responseData.ok });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
