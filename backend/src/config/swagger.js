const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Citation Generator API',
      version: '1.0.0',
      description:
        'Intelligent Citation Generator — generate properly formatted academic citations using AI. Supports APA, MLA, Chicago, Harvard, Vancouver, and IEEE styles.',
      contact: {
        name: 'Citation Generator',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        // -------- Enums --------
        CitationStyle: {
          type: 'string',
          enum: ['apa', 'mla', 'chicago', 'harvard', 'vancouver', 'ieee'],
          example: 'apa',
        },
        SourceType: {
          type: 'string',
          enum: ['journal', 'book', 'book-chapter', 'website', 'thesis', 'conference'],
          example: 'journal',
        },

        // -------- Auth --------
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', minLength: 8, example: 'securePass123' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', example: 'securePass123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Login successful' },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            user: { $ref: '#/components/schemas/UserSafe' },
          },
        },
        RefreshRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
        ForgotPasswordRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
          },
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['token', 'password'],
          properties: {
            token: { type: 'string' },
            password: { type: 'string', minLength: 8 },
          },
        },

        // -------- User --------
        UserSafe: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['free', 'pro', 'admin'] },
            isVerified: { type: 'boolean' },
            avatar: { type: 'string', nullable: true },
            preferences: {
              type: 'object',
              properties: {
                defaultStyle: { $ref: '#/components/schemas/CitationStyle' },
                defaultSourceType: { $ref: '#/components/schemas/SourceType' },
                darkMode: { type: 'boolean' },
                emailNotifications: { type: 'boolean' },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Jane Doe' },
            email: { type: 'string', format: 'email' },
          },
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['newPassword'],
          properties: {
            currentPassword: { type: 'string' },
            newPassword: { type: 'string', minLength: 8 },
          },
        },
        UserStats: {
          type: 'object',
          properties: {
            totalGenerated: { type: 'integer' },
            totalSaved: { type: 'integer' },
            mostUsedStyle: { type: 'string', nullable: true },
            mostUsedSourceType: { type: 'string', nullable: true },
          },
        },

        // -------- Citation --------
        GenerateCitationRequest: {
          type: 'object',
          required: ['rawInput', 'style', 'sourceType'],
          properties: {
            rawInput: { type: 'string', maxLength: 5000, example: 'Smith, J. (2023). Machine Learning in Healthcare. Nature, 45(2), 123-145. doi:10.1234/example' },
            style: { $ref: '#/components/schemas/CitationStyle' },
            sourceType: { $ref: '#/components/schemas/SourceType' },
          },
        },
        CitationBreakdown: {
          type: 'object',
          properties: {
            authors: { type: 'string' },
            year: { type: 'string' },
            title: { type: 'string' },
            source: { type: 'string' },
            doi: { type: 'string' },
            url: { type: 'string' },
            volume: { type: 'string' },
            issue: { type: 'string' },
            pages: { type: 'string' },
            publisher: { type: 'string' },
            edition: { type: 'string' },
          },
        },
        CitationResult: {
          type: 'object',
          properties: {
            style: { $ref: '#/components/schemas/CitationStyle' },
            sourceType: { $ref: '#/components/schemas/SourceType' },
            rawInput: { type: 'string' },
            citation: { type: 'string', example: 'Smith, J. (2023). Machine Learning in Healthcare. Nature, 45(2), 123-145. https://doi.org/10.1234/example' },
            inTextCitation: { type: 'string', example: '(Smith, 2023)' },
            breakdown: { $ref: '#/components/schemas/CitationBreakdown' },
            notes: { type: 'string' },
          },
        },
        SaveCitationRequest: {
          type: 'object',
          required: ['style', 'sourceType', 'rawInput', 'citation', 'inTextCitation'],
          properties: {
            style: { $ref: '#/components/schemas/CitationStyle' },
            sourceType: { $ref: '#/components/schemas/SourceType' },
            rawInput: { type: 'string' },
            citation: { type: 'string' },
            inTextCitation: { type: 'string' },
            breakdown: { $ref: '#/components/schemas/CitationBreakdown' },
            notes: { type: 'string' },
          },
        },
        Citation: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            style: { $ref: '#/components/schemas/CitationStyle' },
            sourceType: { $ref: '#/components/schemas/SourceType' },
            rawInput: { type: 'string' },
            citation: { type: 'string' },
            inTextCitation: { type: 'string' },
            breakdown: { $ref: '#/components/schemas/CitationBreakdown' },
            notes: { type: 'string' },
            projectIds: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            pages: { type: 'integer' },
          },
        },
        DOILookupRequest: {
          type: 'object',
          required: ['doi'],
          properties: {
            doi: { type: 'string', example: '10.1038/s41586-020-2649-2' },
          },
        },
        URLLookupRequest: {
          type: 'object',
          required: ['url'],
          properties: {
            url: { type: 'string', format: 'uri', example: 'https://www.nature.com/articles/s41586-020-2649-2' },
          },
        },

        // -------- Project --------
        CreateProjectRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Thesis Chapter 2' },
            description: { type: 'string', example: 'Literature review citations' },
          },
        },
        UpdateProjectRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            citationIds: { type: 'array', items: { type: 'string' } },
            citationCount: { type: 'integer' },
            shareToken: { type: 'string', nullable: true },
            isPublic: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AddCitationToProjectRequest: {
          type: 'object',
          required: ['citationId'],
          properties: {
            citationId: { type: 'string' },
          },
        },

        // -------- Bibliography --------
        ExportBibliographyRequest: {
          type: 'object',
          required: ['citationIds', 'format'],
          properties: {
            citationIds: { type: 'array', items: { type: 'string' }, minItems: 1 },
            style: { $ref: '#/components/schemas/CitationStyle' },
            format: { type: 'string', enum: ['txt', 'docx', 'pdf', 'bib', 'ris'] },
            sort: { type: 'string', enum: ['alpha', 'appearance'] },
          },
        },

        // -------- Common --------
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Auth', description: 'Authentication & authorization' },
      { name: 'Citations', description: 'Citation generation, CRUD & lookup' },
      { name: 'Projects', description: 'Project management & sharing' },
      { name: 'Bibliography', description: 'Bibliography export' },
      { name: 'User', description: 'User profile & settings' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
