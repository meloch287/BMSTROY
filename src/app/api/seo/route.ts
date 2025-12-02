import { NextResponse } from 'next/server';
import { getCollection, saveCollection } from '@/lib/db';

export async function GET() { return NextResponse.json(getCollection('seo')[0] || { title: 'БМСТРОЙ', desc: 'Ремонт' }); }

export async function POST(request: Request) {
  const body = await request.json();
  saveCollection('seo', [body]);
  return NextResponse.json({ success: true });
}