import { NextResponse } from 'next/server';
import { getCollection, saveCollection } from '@/lib/db';

export async function GET() {
  const templates = getCollection('templates');
  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  const body = await request.json();
  const templates = getCollection('templates');
  
  const existingIndex = templates.findIndex((t: any) => t.id === body.id);
  
  if (existingIndex !== -1) {
    templates[existingIndex] = { ...templates[existingIndex], ...body };
  } else {
    templates.push({ id: body.id || Date.now(), name: body.name, content: body.content });
  }
  
  saveCollection('templates', templates);
  return NextResponse.json({ success: true });
}