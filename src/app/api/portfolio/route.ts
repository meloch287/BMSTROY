import { NextResponse } from 'next/server';
import { getCollection, addToCollection, deleteCollectionItem, updateCollectionItem } from '@/lib/db';

export async function GET() {
  return NextResponse.json(getCollection('portfolio'));
}

export async function POST(request: Request) {
  const body = await request.json();
  const newItem = addToCollection('portfolio', body);
  return NextResponse.json(newItem);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) {
    return NextResponse.json({ error: 'No ID' }, { status: 400 });
  }
  const updated = updateCollectionItem('portfolio', Number(id), updates);
  if (updated) {
    return NextResponse.json(updated);
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (id) {
    deleteCollectionItem('portfolio', Number(id));
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'No ID' }, { status: 400 });
}