import { NextResponse } from 'next/server';
import { getCollection, saveCollection } from '@/lib/db';

export async function GET() {
  const settings = getCollection('settings');
  // Return settings directly (not wrapped in object)
  return NextResponse.json(settings[0] || {});
}

export async function POST(request: Request) {
  const body = await request.json();
  const { type, data } = body;

  if (type === 'settings') {
      saveCollection('settings', [data]);
      return NextResponse.json({ success: true });
  }
  
  if (type === 'service_update') {
      return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
}