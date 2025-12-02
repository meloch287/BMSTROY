import { getCollection, saveCollection } from './db';

export async function sendTelegramNotification(text: string, botToken?: string, chatId?: string) {
  try {
    // If no token/chatId provided, try to get from settings
    if (!botToken || !chatId) {
      const settings = getTelegramSettingsSync();
      if (settings) {
        botToken = settings.botToken;
        chatId = settings.adminUserId;
      }
    }

    if (!botToken || !chatId) {
      console.warn('Telegram settings not configured');
      return false;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const body = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    return data.ok;

  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return false;
  }
}

export function saveTelegramSettingsSync(settings: { botToken: string; adminUserId: string; notifyOnLead: boolean; notifyOnApproval: boolean }) {
  try {
    const fs = require('fs');
    const path = require('path');
    const settingsPath = path.join(process.cwd(), 'data', 'telegram.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save Telegram settings:', error);
    return false;
  }
}

export function getTelegramSettingsSync() {
  try {
    const fs = require('fs');
    const path = require('path');
    const settingsPath = path.join(process.cwd(), 'data', 'telegram.json');
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    }
  } catch {}
  return null;
}

// Async wrappers for API routes
export async function saveTelegramSettings(settings: any) {
  return saveTelegramSettingsSync(settings);
}

export async function getTelegramSettings() {
  return getTelegramSettingsSync();
}
