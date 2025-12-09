import { NextResponse } from 'next/server';
import { getCollection, addToCollection, deleteCollectionItem, saveCollection } from '@/lib/db';

export async function GET() { return NextResponse.json(getCollection('inventory')); }

export async function POST(request: Request) {
  const body = await request.json();
  if (body.action === 'update') {
     const items = getCollection('inventory');
     const item = items.find((i: any) => i.id === body.id);
     if (item) {
         item.qty = body.qty;
         saveCollection('inventory', items);
     }
     return NextResponse.json({ success: true });
  }
  return NextResponse.json(addToCollection('inventory', body));
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  deleteCollectionItem('inventory', Number(searchParams.get('id')));
  return NextResponse.json({ success: true });
}