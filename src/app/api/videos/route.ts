import { NextResponse } from 'next/server';
import { getCollection, addToCollection, deleteCollectionItem, updateCollectionItem } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const videos = getCollection('videos');
  return NextResponse.json(videos);
}

export async function POST(request: Request) {
  const body = await request.json();
  const video = addToCollection('videos', {
    title: body.title,
    type: body.type || 'Обзор',
    url: body.url,
    thumb: body.thumb || body.url, // Для MP4 можно использовать первый кадр или отдельную картинку
    isYoutube: body.isYoutube || false,
  });
  return NextResponse.json(video);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const updated = updateCollectionItem('videos', body.id, {
    title: body.title,
    type: body.type,
    url: body.url,
    thumb: body.thumb,
    isYoutube: body.isYoutube,
  });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get('id'));
  deleteCollectionItem('videos', id);
  return NextResponse.json({ success: true });
}
