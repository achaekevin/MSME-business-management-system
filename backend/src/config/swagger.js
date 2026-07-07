const swaggerJsdoc = require('swagger-jsdoc')
const appConfig = require('./app')

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MSME Business Management System API',
      version: '1.0.0',
      description:
        'Multi-tenant SaaS REST API for MSME business management — auth, sales, inventory, finance, HR, and more. ' +
        'Every authenticated request operates within the tenant context resolved from the JWT (businessId, branchId).'
    },
    servers: [
      { url: `${appConfig.appUrl}/api`, description: 'Current environment' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        apiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'object' }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                data: { type: 'array', items: {} },
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                totalPages: { type: 'integer' }
              }
            }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/modules/**/*.routes.js', './src/modules/**/*.swagger.js']
}

module.exports = swaggerJsdoc(options)
