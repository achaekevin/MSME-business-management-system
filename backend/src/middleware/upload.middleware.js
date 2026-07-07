const multer = require('multer')
const path = require('path')
const { ApiError } = require('../helpers/response')

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']

const storage = multer.memoryStorage()

function fileFilter(allowedTypes) {
  return (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(ApiError.badRequest(`File type ${file.mimetype} not allowed`))
    }
    cb(null, true)
  }
}

const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES)
})

const uploadDocument = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: fileFilter(ALLOWED_DOCUMENT_TYPES)
})

const uploadAny = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }
})

module.exports = { uploadImage, uploadDocument, uploadAny }
