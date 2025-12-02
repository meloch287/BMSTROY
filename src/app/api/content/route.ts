import { NextResponse } from 'next/server';
import { getCollection, addToCollection, deleteCollectionItem, saveCollection } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'reviews' | 'team' | 'hero'
  
  if (type === 'hero') {
      const data = getCollection('hero');
      return NextResponse.json(data[0] || { 
        title: 'БМСТРОЙ', 
        subtitle: 'Инновации. Качество. Технологии.', 
        bg: '/uploads/1764611922746-1__4_.jpeg' 
      });
  }
  
  return NextResponse.json(getCollection(type || 'reviews'));
}

export async function POST(request: Request) {
  const body = await request.json();
  const { type, data } = body;

  if (type === 'hero') {
      saveCollection('hero', [data]); // Перезаписываем (там всегда 1 объект)
      return NextResponse.json({ success: true });
  }

  const newItem = addToCollection(type, data);
  return NextResponse.json(newItem);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type');
  
  if (id && type) {
    deleteCollectionItem(type, Number(id));
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Error' }, { status: 400 });
}