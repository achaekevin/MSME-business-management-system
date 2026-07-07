const Minio = require('minio')
const appConfig = require('../config/app')
const logger = require('../config/logger')

const minioClient = new Minio.Client({
  endPoint: appConfig.storage.endpoint,
  port: appConfig.storage.port,
  useSSL: appConfig.storage.useSSL,
  accessKey: appConfig.storage.accessKey,
  secretKey: appConfig.storage.secretKey
})

const BUCKET = appConfig.storage.bucket

async function ensureBucket() {
  const exists = await minioClient.bucketExists(BUCKET).catch(() => false)
  if (!exists) {
    await minioClient.makeBucket(BUCKET, 'us-east-1')
    logger.info(`Created storage bucket: ${BUCKET}`)
  }
}

/**
 * Uploads a buffer (e.g. generated PDF/Excel report, profile image) and
 * returns a publicly-resolvable URL (assumes bucket policy or CDN in front;
 * for private buckets, swap to getPresignedUrl below).
 */
async function uploadBuffer(objectName, buffer, contentType = 'application/octet-stream') {
  await minioClient.putObject(BUCKET, objectName, buffer, buffer.length, { 'Content-Type': contentType })
  return `${appConfig.storage.useSSL ? 'https' : 'http'}://${appConfig.storage.endpoint}:${appConfig.storage.port}/${BUCKET}/${objectName}`
}

async function uploadFile(objectName, filePath, contentType) {
  await minioClient.fPutObject(BUCKET, objectName, filePath, { 'Content-Type': contentType })
  return `${appConfig.storage.useSSL ? 'https' : 'http'}://${appConfig.storage.endpoint}:${appConfig.storage.port}/${BUCKET}/${objectName}`
}

async function getPresignedUrl(objectName, expirySeconds = 3600) {
  return minioClient.presignedGetObject(BUCKET, objectName, expirySeconds)
}

async function deleteObject(objectName) {
  await minioClient.removeObject(BUCKET, objectName)
}

module.exports = { minioClient, ensureBucket, uploadBuffer, uploadFile, getPresignedUrl, deleteObject }
