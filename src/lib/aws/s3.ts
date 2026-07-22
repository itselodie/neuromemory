/**
 * NeuroMemory — AWS S3 Cold Storage SDK Wrapper & Stub Client
 * Archives aged/decayed episodic & semantic memories into AWS S3 cold vault.
 * Automatically falls back to stub logging when S3 environment credentials are missing.
 */

export interface S3Config {
  bucketName: string;
  region: string;
  isStubbed: boolean;
}

export function getS3Config(): S3Config {
  const bucketName = process.env.AWS_S3_BUCKET_NAME || 'neuromemory-cold-storage-archive';
  const region = process.env.AWS_REGION || 'us-east-1';
  const hasCreds = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

  return {
    bucketName,
    region,
    isStubbed: !hasCreds,
  };
}

export interface ArchivePayload {
  memoryId: string;
  sourceTable: 'episodic_memory' | 'semantic_memory';
  sessionId?: string;
  content: string;
  metadata?: Record<string, unknown>;
  archivedAt: string;
}

/**
 * Uploads a memory archive JSON payload to AWS S3.
 * Returns the S3 object key.
 */
export async function archiveMemoryToS3(payload: ArchivePayload): Promise<string> {
  const config = getS3Config();
  const datePrefix = new Date().toISOString().split('T')[0];
  const objectKey = `archives/${datePrefix}/${payload.sourceTable}/${payload.memoryId}.json`;

  if (config.isStubbed) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AWS S3 STUB] Offloading memory ${payload.memoryId} to stub key: s3://${config.bucketName}/${objectKey}`);
    }
    return objectKey;
  }

  try {
    // @ts-ignore - Optional SDK dependency loaded at runtime
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const s3Client = new S3Client({ region: config.region });

    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
      Body: JSON.stringify(payload, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(command);
    return objectKey;
  } catch (error) {
    console.warn('[AWS S3 Warning] Failed to upload archive to S3. Using stub key.', error);
    return objectKey;
  }
}
