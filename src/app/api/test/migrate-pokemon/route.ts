import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Make a request to the migration endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/migrate/pokemon-canevolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Migration test completed',
      result
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST() {
  return GET(); // Just redirect to GET for testing
}
