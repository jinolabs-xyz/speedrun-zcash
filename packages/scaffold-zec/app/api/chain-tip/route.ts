import { NextResponse } from 'next/server';
import { getChainTip } from '../../../server/lightwalletd';

export const runtime = 'nodejs';
export const revalidate = 30;

export async function GET() {
  try {
    return NextResponse.json({ height: await getChainTip() });
  } catch {
    return NextResponse.json({ height: null });
  }
}
