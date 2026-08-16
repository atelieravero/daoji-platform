import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '@/lib/s3/client';
import { requirePermission } from '@/lib/auth-guards';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path');

  if (!path) {
    return new NextResponse('Bad Request: Missing file path', { status: 400 });
  }

  // Prevent directory traversal and enforce strict partition prefixes
  if (
    path.includes('..') || 
    (!path.startsWith('submissions/test/') && !path.startsWith('submissions/real/'))
  ) {
    return new NextResponse('Forbidden: Invalid file path', { status: 403 });
  }

  // 🛡️ Granular Action Guard based on dataset sensitivity
  if (path.startsWith('submissions/real/')) {
    await requirePermission('submissions:view_real');
  } else {
    await requirePermission('submissions:view_test');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: path,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    return NextResponse.redirect(signedUrl);

  } catch (error) {
    console.error('Error generating secure download URL:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}