/**
 * File Storage Service
 * Handles file uploads to MinIO/S3
 * Supports: Images, PDFs, Documents, Receipts, Contracts
 */

const { MinioClient } = require('../config/minio')
const crypto = require('crypto')
const path = require('path')
const { ApiError } = require('../helpers/response')
const logger = require('../config/logger')

const ALLOWED_FILE_TYPES = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'],
  receipts: ['.pdf', '.jpg', '.jpeg', '.png'],
  contracts: ['.pdf', '.doc', '.docx']
}

const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  receipt: 5 * 1024 * 1024, // 5MB
  contract: 10 * 1024 * 1024 // 10MB
}

/**
 * Generate unique filename
 */
function generateFilename(originalName) {
  const timestamp = Date.now()
  const random = crypto.randomBytes(8).toString('hex')
  const ext = path.extname(originalName)
  const basename = path.basename(originalName, ext).replace(/[^a-z0-9]/gi, '-').toLowerCase()
  return `${basename}-${timestamp}-${random}${ext}`
}

/**
 * Validate file type
 */
function validateFileType(filename, category) {
  const ext = path.extname(filename).toLowerCase()
  const allowed = ALLOWED_FILE_TYPES[category] || [...ALLOWED_FILE_TYPES.images, ...ALLOWED_FILE_TYPES.documents]
  
  if (!allowed.includes(ext)) {
    throw ApiError.badRequest(`File type ${ext} not allowed for ${category}`)
  }
  
  return true
}

/**
 * Validate file size
 */
function validateFileSize(size, category) {
  const maxSize = MAX_FILE_SIZES[category] || MAX_FILE_SIZES.document
  
  if (size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(2)
    throw ApiError.badRequest(`File size exceeds maximum ${maxMB}MB for ${category}`)
  }
  
  return true
}

/**
 * Upload file to MinIO/S3
 */
async function uploadFile(file, businessId, category = 'documents', metadata = {}) {
  try {
    // Validate file
    validateFileType(file.originalname, category)
    validateFileSize(file.size, category)

    // Generate storage path: businessId/category/filename
    const filename = generateFilename(file.originalname)
    const objectPath = `${businessId}/${category}/${filename}`

    // Upload to MinIO
    await MinioClient.putObject(
      process.env.MINIO_BUCKET || 'msme-files',
      objectPath,
      file.buffer,
      file.size,
      {
        'Content-Type': file.mimetype,
        'X-Business-Id': businessId,
        'X-Category': category,
        'X-Original-Name': file.originalname,
        ...metadata
      }
    )

    logger.info(`File uploaded: ${objectPath}`)

    return {
      filename,
      originalName: file.originalname,
      path: objectPath,
      size: file.size,
      mimeType: file.mimetype,
      url: await getFileUrl(objectPath)
    }
  } catch (error) {
    logger.error('File upload failed:', error)
    throw error
  }
}

/**
 * Upload multiple files
 */
async function uploadFiles(files, businessId, category = 'documents', metadata = {}) {
  const uploads = files.map(file => uploadFile(file, businessId, category, metadata))
  return await Promise.all(uploads)
}

/**
 * Get file URL (presigned for private files)
 */
async function getFileUrl(objectPath, expiresIn = 3600) {
  try {
    // Generate presigned URL (valid for 1 hour by default)
    const url = await MinioClient.presignedGetObject(
      process.env.MINIO_BUCKET || 'msme-files',
      objectPath,
      expiresIn
    )
    return url
  } catch (error) {
    logger.error('Failed to generate file URL:', error)
    throw ApiError.internalError('Failed to generate file URL')
  }
}

/**
 * Download file
 */
async function downloadFile(objectPath) {
  try {
    const stream = await MinioClient.getObject(
      process.env.MINIO_BUCKET || 'msme-files',
      objectPath
    )
    return stream
  } catch (error) {
    logger.error('File download failed:', error)
    throw ApiError.notFound('File not found')
  }
}

/**
 * Delete file
 */
async function deleteFile(objectPath) {
  try {
    await MinioClient.removeObject(
      process.env.MINIO_BUCKET || 'msme-files',
      objectPath
    )
    logger.info(`File deleted: ${objectPath}`)
    return { success: true }
  } catch (error) {
    logger.error('File deletion failed:', error)
    throw error
  }
}

/**
 * Delete multiple files
 */
async function deleteFiles(objectPaths) {
  const deletions = objectPaths.map(path => deleteFile(path))
  return await Promise.allSettled(deletions)
}

/**
 * List files in business folder
 */
async function listFiles(businessId, category = null, prefix = '') {
  try {
    const folderPrefix = category 
      ? `${businessId}/${category}/${prefix}`
      : `${businessId}/${prefix}`

    const stream = MinioClient.listObjects(
      process.env.MINIO_BUCKET || 'msme-files',
      folderPrefix,
      true
    )

    const files = []
    
    return new Promise((resolve, reject) => {
      stream.on('data', obj => {
        files.push({
          name: obj.name,
          size: obj.size,
          lastModified: obj.lastModified,
          etag: obj.etag
        })
      })
      
      stream.on('end', () => resolve(files))
      stream.on('error', reject)
    })
  } catch (error) {
    logger.error('Failed to list files:', error)
    throw error
  }
}

/**
 * Get file metadata
 */
async function getFileMetadata(objectPath) {
  try {
    const stat = await MinioClient.statObject(
      process.env.MINIO_BUCKET || 'msme-files',
      objectPath
    )
    return stat
  } catch (error) {
    logger.error('Failed to get file metadata:', error)
    throw ApiError.notFound('File not found')
  }
}

/**
 * Copy file
 */
async function copyFile(sourcePath, destinationPath) {
  try {
    await MinioClient.copyObject(
      process.env.MINIO_BUCKET || 'msme-files',
      destinationPath,
      `/${process.env.MINIO_BUCKET || 'msme-files'}/${sourcePath}`
    )
    
    logger.info(`File copied: ${sourcePath} → ${destinationPath}`)
    return { success: true, path: destinationPath }
  } catch (error) {
    logger.error('File copy failed:', error)
    throw error
  }
}

/**
 * Check if file exists
 */
async function fileExists(objectPath) {
  try {
    await getFileMetadata(objectPath)
    return true
  } catch (error) {
    return false
  }
}

module.exports = {
  uploadFile,
  uploadFiles,
  getFileUrl,
  downloadFile,
  deleteFile,
  deleteFiles,
  listFiles,
  getFileMetadata,
  copyFile,
  fileExists,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZES
}
