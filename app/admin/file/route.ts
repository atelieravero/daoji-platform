import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '@/lib/s3/client';

export async function GET(request: NextRequest) {
  // =====================================================================
  // SECURITY GATE (To be implemented in Ticket 07)
  // We will add Supabase Auth checks here to ensure ONLY the logged-in 
  // admin can execute the rest of this code.
  // =====================================================================

  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path');

  if (!path) {
    return new NextResponse('Bad Request: Missing file path', { status: 400 });
  }

  // Basic validation to ensure they are only requesting submission files
  if (!path.startsWith('submissions/')) {
    return new NextResponse('Forbidden: Invalid file path', { status: 403 });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: path,
    });

    // Generate a secure, temporary download URL valid for only 60 seconds
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    // Instantly redirect the admin's browser to the secure Cloudflare R2 file
    return NextResponse.redirect(signedUrl);

  } catch (error) {
    console.error('Error generating secure download URL:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}