const { z } = require('zod')

const DOCUMENT_TYPES = ['contract', 'receipt', 'invoice', 'report', 'id_document', 'license', 'certificate', 'other']

const documentMetaSchema = z.object({
  name: z.string().optional(),
  type: z.enum(DOCUMENT_TYPES).optional().default('other')
})

module.exports = { documentMetaSchema, DOCUMENT_TYPES }
