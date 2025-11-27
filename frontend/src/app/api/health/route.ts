import { NextResponse } from 'next/server';

/**
 * Route de santé pour le healthcheck Docker/Kubernetes
 * GET /api/health
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'frontend',
    },
    { status: 200 }
  );
}
