import { NextResponse } from 'next/server';
import { getCollection, addToCollection } from '@/lib/db';

export async function GET() { return NextResponse.json(getCollection('logs')); }

export async function POST(request: Request) {
    const body = await request.json();
    return NextResponse.json(addToCollection('logs', { ...body, date: new Date().toISOString() }));
}