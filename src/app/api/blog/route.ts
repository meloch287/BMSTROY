import { NextResponse } from 'next/server';
import { getCollection, addToCollection, updateCollectionItem, deleteCollectionItem } from '@/lib/db';

export async function GET() {
  return NextResponse.json(getCollection('posts'));
}

export async function POST(request: Request) {
  const body = await request.json();
  const newItem = addToCollection('posts', body);
  return NextResponse.json(newItem);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (id) {
    deleteCollectionItem('posts', Number(id));
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'No ID' }, { status: 400 });
}