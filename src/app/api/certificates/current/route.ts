import { NextResponse } from 'next/server';
import { phoenixApiService } from '@/lib/phoenix-api-service';

export async function GET() {
  try {
    const certificates = await phoenixApiService.getAllCertificates();
    
    return NextResponse.json({
      success: true,
      certificates,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 