import { createClient } from '@/lib/supabase/server';
import { PayeeFormData } from '@/lib/types/payee';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category_id = searchParams.get('category_id');

    let query = supabase
      .from('payees')
      .select(
        `
        *,
        categories (
          id,
          name,
          color
        )
      `
      )
      .eq('user_id', user.id)
      .order('name');

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    const { data: payees, error } = await query;

    if (error) {
      console.error('Error fetching payees:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payees' },
        { status: 500 }
      );
    }

    return NextResponse.json({ payees });
  } catch (error) {
    console.error('Error in payees API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as PayeeFormData;

    // Validate required fields
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Validate email format if provided
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const { data: payee, error } = await supabase
      .from('payees')
      .insert({
        ...body,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payee:', error);
      return NextResponse.json(
        { error: 'Failed to create payee' },
        { status: 500 }
      );
    }

    return NextResponse.json({ payee }, { status: 201 });
  } catch (error) {
    console.error('Error in payees POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
