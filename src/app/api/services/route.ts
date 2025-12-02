import { NextResponse } from 'next/server';
import { getCollection, saveCollection } from '@/lib/db';

const DEFAULT_SERVICES = [
  { 
    id: 'design', 
    title: 'Дизайн-проект', 
    desc: 'Включен в стоимость ремонта. 3D визуализация и чертежи.',
    images: [
        '/uploads/1764618989423-1__1_.jpeg',
        '/uploads/1764621861710-1__11_.jpeg'
    ]
  },
  { 
    id: 'repair', 
    title: 'Ремонт под ключ', 
    desc: 'Возьмем на себя всё: от демонтажа до клининга.',
    images: [
        '/uploads/1764623765908-1__9_.jpeg',
        '/uploads/1764623768565-1__3_.jpeg'
    ]
  },
  { 
    id: 'finish', 
    title: 'Чистовая отделка', 
    desc: 'Идеальная покраска, укладка плитки и паркета.',
    images: [
        '/uploads/1764611922746-1__4_.jpeg'
    ]
  }
];

export async function GET() {
  const services = getCollection('services');
  if (services.length === 0) return NextResponse.json(DEFAULT_SERVICES);
  return NextResponse.json(services);
}

export async function POST(request: Request) {
  const body = await request.json();
  saveCollection('services', body);
  return NextResponse.json({ success: true });
}