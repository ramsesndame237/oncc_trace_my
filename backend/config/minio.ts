import env from '#start/env'

export default {
  endPoint: env.get('MINIO_ENDPOINT') || 'localhost',
  port: Number.parseInt(env.get('MINIO_PORT') || '9000'),
  useSSL: env.get('MINIO_USE_SSL') === 'true',
  accessKey: env.get('MINIO_ACCESS_KEY') || 'minioadmin',
  secretKey: env.get('MINIO_SECRET_KEY') || 'minioadmin',
  bucket: env.get('MINIO_BUCKET') || 'oncc-documents',
  region: env.get('MINIO_REGION') || 'us-east-1',
}
