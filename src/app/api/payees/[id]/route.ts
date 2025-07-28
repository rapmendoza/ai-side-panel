import {
  deletePayee,
  getPayeeById,
  updatePayee,
} from '@/lib/database/payee-service';
import { isValidUUID, sanitizeInput } from '@/lib/database/utils';
import { UpdatePayeeRequest } from '@/types/payee';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid payee ID format' },
        { status: 400 }
      );
    }

    const payee = await getPayeeById(id);

    if (!payee) {
      return NextResponse.json({ error: 'Payee not found' }, { status: 404 });
    }

    return NextResponse.json({ payee });
  } catch (error) {
    console.error(`Error in GET /api/payees/${(await params).id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch payee' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdatePayeeRequest = await request.json();

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid payee ID format' },
        { status: 400 }
      );
    }

    // Check if payee exists
    const existingPayee = await getPayeeById(id);
    if (!existingPayee) {
      return NextResponse.json({ error: 'Payee not found' }, { status: 404 });
    }

    // Sanitize inputs
    const sanitizedData: UpdatePayeeRequest = {};
    if (body.name) sanitizedData.name = sanitizeInput(body.name);
    if (body.description)
      sanitizedData.description = sanitizeInput(body.description);
    if (body.contact_info) sanitizedData.contact_info = body.contact_info;

    const updatedPayee = await updatePayee(id, sanitizedData);
    return NextResponse.json({ payee: updatedPayee });
  } catch (error) {
    console.error(`Error in PUT /api/payees/${(await params).id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update payee' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid payee ID format' },
        { status: 400 }
      );
    }

    // Check if payee exists
    const existingPayee = await getPayeeById(id);
    if (!existingPayee) {
      return NextResponse.json({ error: 'Payee not found' }, { status: 404 });
    }

    const result = await deletePayee(id);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to delete payee' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Payee deleted successfully' });
  } catch (error) {
    console.error(`Error in DELETE /api/payees/${(await params).id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete payee' },
      { status: 500 }
    );
  }
}
