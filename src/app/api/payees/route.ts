import {
  createPayee,
  getAllPayees,
  searchPayees,
} from '@/lib/database/payee-service';
import { sanitizeInput } from '@/lib/database/utils';
import { CreatePayeeRequest } from '@/types/payee';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    if (search) {
      const sanitizedSearch = sanitizeInput(search);
      const payees = await searchPayees(sanitizedSearch);
      return NextResponse.json({ payees, total: payees.length });
    }

    const payees = await getAllPayees();
    return NextResponse.json({ payees, total: payees.length });
  } catch (error) {
    console.error('Error in GET /api/payees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payees' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePayeeRequest = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Payee name is required' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedData: CreatePayeeRequest = {
      name: sanitizeInput(body.name),
      description: body.description
        ? sanitizeInput(body.description)
        : undefined,
      contact_info: body.contact_info,
    };

    const payee = await createPayee(sanitizedData);
    return NextResponse.json({ payee }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/payees:', error);
    return NextResponse.json(
      { error: 'Failed to create payee' },
      { status: 500 }
    );
  }
}
