import { NextResponse } from 'next/server';
import { getCollection, addToCollection, deleteCollectionItem } from '@/lib/db';
import { logAction } from '@/lib/audit';

export async function GET() { return NextResponse.json(getCollection('finance')); }

export async function POST(request: Request) {
  const body = await request.json();
  const newTransaction = addToCollection('finance', body);
  
  // Audit log for create action (Requirement 3.1)
  await logAction({
    action: 'create',
    collection: 'finance',
    recordId: newTransaction.id,
    after: newTransaction,
  });
  
  return NextResponse.json(newTransaction);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get('id'));
  
  // Get transaction data before deletion for audit log (Requirement 3.3)
  const transactions = getCollection('finance');
  const transactionToDelete = transactions.find((t: any) => t.id === id);
  
  deleteCollectionItem('finance', id);
  
  // Audit log for delete action
  if (transactionToDelete) {
    await logAction({
      action: 'delete',
      collection: 'finance',
      recordId: id,
      before: transactionToDelete,
    });
  }
  
  return NextResponse.json({ success: true });
}