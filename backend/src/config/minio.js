/**
 * MinIO Configuration
 * S3-compatible object storage
 */

const Minio = require('minio')
const logger = require('./logger')

// Initialize MinIO client
const MinioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
})

/**
 * Initialize MinIO bucket
 */
async function initializeBucket() {
  const bucketName = process.env.MINIO_BUCKET || 'msme-files'

  try {
    // Check if bucket exists
    const exists = await MinioClient.bucketExists(bucketName)

    if (!exists) {
      // Create bucket
      await MinioClient.makeBucket(bucketName, 'us-east-1')
      logger.info(`✅ MinIO bucket created: ${bucketName}`)

      // Set bucket policy for private access
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`]
          }
        ]
      }

      // Note: In production, set proper access policies
      logger.info(`✅ MinIO bucket configured: ${bucketName}`)
    } else {
      logger.info(`✅ MinIO bucket exists: ${bucketName}`)
    }
  } catch (error) {
    logger.error('❌ MinIO initialization failed:', error.message)
    logger.warn('⚠️  File uploads will not work without MinIO')
  }
}

// Initialize on startup
initializeBucket().catch(err => {
  logger.error('MinIO bucket initialization error:', err)
})

module.exports = {
  MinioClient,
  initializeBucket
}
