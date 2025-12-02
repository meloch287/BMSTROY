import { NextResponse } from 'next/server';
import { getCollection, addToCollection, deleteCollectionItem } from '@/lib/db';

export async function GET() { return NextResponse.json(getCollection('finance')); }

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json(addToCollection('finance', body));
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  deleteCollectionItem('finance', Number(searchParams.get('id')));
  return NextResponse.json({ success: true });
}