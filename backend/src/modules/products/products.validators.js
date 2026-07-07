const { z } = require('zod')

const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  unitId: z.string().uuid().optional().nullable(),
  costPrice: z.coerce.number().min(0).default(0),
  sellingPrice: z.coerce.number().min(0).default(0),
  barcode: z.string().optional(),
  trackInventory: z.coerce.boolean().default(true),
  reorderPoint: z.coerce.number().int().min(0).default(5),
  businessId: z.string().optional()
})

const updateProductSchema = createProductSchema.partial()

const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  lowStock: z.coerce.boolean().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
})

const createCategorySchema = z.object({
  name: z.string().min(1),
  parentId: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  businessId: z.string().optional()
})

const createUnitSchema = z.object({
  name: z.string().min(1),
  abbreviation: z.string().min(1).max(10),
  businessId: z.string().optional()
})

const createVariantSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  costPrice: z.coerce.number().min(0).default(0),
  sellingPrice: z.coerce.number().min(0).default(0),
  attributes: z.record(z.string()).optional()
})

module.exports = {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
  createCategorySchema,
  createUnitSchema,
  createVariantSchema
}
