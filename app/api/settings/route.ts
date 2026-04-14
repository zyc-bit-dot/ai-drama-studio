import { NextRequest, NextResponse } from 'next/server';
import { saveConfig, getMaskedConfig } from '@/lib/server/config';
import { SaveSettingsRequest } from '@/types';

export async function GET() {
  const masked = getMaskedConfig();
  return NextResponse.json(masked);
}

export async function POST(req: NextRequest) {
  try {
    const body: SaveSettingsRequest = await req.json();
    saveConfig({
      deepseekKey: body.deepseekKey,
      klingAccessKey: body.klingAccessKey,
      klingSecretKey: body.klingSecretKey,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[settings POST]', e);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}
