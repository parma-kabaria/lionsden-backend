export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'LionsDen Resort Management System API',
    version: '1.0.0',
    description:
      'Production-ready REST API Backend for LionsDen Luxury Resorts (Ahmedabad & Dhari branches). Built with Express 5, Node.js ES Modules, MongoDB Mongoose, and Zod.',
    contact: {
      name: 'LionsDen Engineering Team',
      email: 'engineering@lionsdenresorts.com',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API Version 1',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your Bearer Access Token obtained from /api/v1/auth/login',
      },
    },
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' },
          meta: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Detailed error message' },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'superadmin@lionsdenresorts.com' },
          password: { type: 'string', example: 'ChangeMeSuperSecret123!' },
        },
      },
      RefreshTokenRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', example: 'CurrentPass123!' },
          newPassword: { type: 'string', example: 'NewPass456!' },
        },
      },
      CreateBookingRequest: {
        type: 'object',
        required: ['customer', 'branch', 'bungalow', 'checkIn', 'checkOut'],
        properties: {
          customer: {
            type: 'object',
            required: ['name', 'phone'],
            properties: {
              name: { type: 'string', example: 'Rajesh Patel' },
              phone: { type: 'string', example: '+919876543210' },
              email: { type: 'string', example: 'rajesh@example.com' },
            },
          },
          branch: { type: 'string', example: '67bcb1234567890abcdef001' },
          bungalow: { type: 'string', example: '67bcb1234567890abcdef002' },
          checkIn: { type: 'string', format: 'date-time', example: '2026-11-01T14:00:00.000Z' },
          checkOut: { type: 'string', format: 'date-time', example: '2026-11-04T11:00:00.000Z' },
          guests: {
            type: 'object',
            properties: {
              adults: { type: 'integer', example: 2 },
              children: { type: 'integer', example: 1 },
            },
          },
          foodOption: { type: 'string', enum: ['WITH_FOOD', 'WITHOUT_FOOD'], example: 'WITH_FOOD' },
          foodChargesPerNight: { type: 'integer', description: 'In paise', example: 150000 },
          extraCharges: { type: 'integer', description: 'In paise', example: 0 },
          advancePayment: { type: 'integer', description: 'In paise', example: 500000 },
          paymentMode: { type: 'string', enum: ['UPI', 'CASH', 'BANK_TRANSFER'], example: 'UPI' },
          transactionReference: { type: 'string', example: 'UPI-987654321' },
          specialRequests: { type: 'string', example: 'Ground floor preference, late arrival' },
          idempotencyKey: { type: 'string', example: 'idemp-bk-100234' },
        },
      },
      RecordPaymentRequest: {
        type: 'object',
        required: ['bookingId', 'amount', 'paymentMode'],
        properties: {
          bookingId: { type: 'string', example: '67bcb1234567890abcdef003' },
          amount: { type: 'integer', description: 'In paise', example: 350000 },
          type: { type: 'string', enum: ['ADVANCE', 'BALANCE'], example: 'BALANCE' },
          paymentMode: { type: 'string', enum: ['UPI', 'CASH', 'BANK_TRANSFER'], example: 'UPI' },
          transactionReference: { type: 'string', example: 'UPI/HDFC/20261025' },
          notes: { type: 'string', example: 'Settlement of final balance at check-in' },
          idempotencyKey: { type: 'string', example: 'pay-uuid-7788' },
        },
      },
      SubmitNegotiationRequest: {
        type: 'object',
        required: ['booking', 'requestedRent', 'reason'],
        properties: {
          booking: { type: 'string', example: '67bcb1234567890abcdef003' },
          requestedRent: { type: 'integer', description: 'In paise per night', example: 550000 },
          reason: { type: 'string', example: 'Long stay discount approved for 7-night booking' },
        },
      },
      CreateMaintenanceRequest: {
        type: 'object',
        required: ['bungalow', 'facilityAffected', 'problemDescription'],
        properties: {
          bungalow: { type: 'string', example: '67bcb1234567890abcdef002' },
          facilityAffected: { type: 'string', example: 'Air Conditioning' },
          problemDescription: {
            type: 'string',
            example: 'Master bedroom AC compressor not cooling properly',
          },
          priority: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            example: 'HIGH',
          },
          blocksAvailability: { type: 'boolean', example: false },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User Login with credentials',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } },
          },
        },
        responses: {
          200: { description: 'Login successful with access and refresh tokens' },
          401: { description: 'Invalid credentials or inactive user' },
        },
      },
    },
    '/auth/refresh-token': {
      post: {
        tags: ['Authentication'],
        summary: 'Rotate Refresh Token with reuse detection',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RefreshTokenRequest' } },
          },
        },
        responses: {
          200: { description: 'New token pair generated' },
          401: { description: 'Token invalid or revoked reuse attack detected' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Revoke active refresh token',
        responses: {
          200: { description: 'Logout successful' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get currently authenticated user profile',
        responses: {
          200: { description: 'User profile with role and assigned branch' },
        },
      },
    },
    '/auth/change-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Change account password',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ChangePasswordRequest' } },
          },
        },
        responses: {
          200: { description: 'Password changed successfully' },
        },
      },
    },
    '/availability': {
      get: {
        tags: ['Bungalow Availability'],
        summary: 'Search available bungalows by branch, dates, category, and facilities',
        parameters: [
          { name: 'branch', in: 'query', required: true, schema: { type: 'string' } },
          {
            name: 'checkIn',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'checkOut',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'category',
            in: 'query',
            schema: { type: 'string', enum: ['1BHK', '2BHK', '3BHK', '4BHK'] },
          },
          { name: 'facilities', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description:
              'Available and unavailable bungalows with dynamic pricing and maintenance warnings',
          },
        },
      },
    },
    '/bookings': {
      get: {
        tags: ['Bookings'],
        summary: 'List bookings with filters and pagination',
        parameters: [
          { name: 'branchId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Bookings list' } },
      },
      post: {
        tags: ['Bookings'],
        summary: 'Create booking with ACID concurrency protection and reservation locks',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateBookingRequest' } },
          },
        },
        responses: {
          201: { description: 'Booking created successfully' },
          409: { description: 'Conflict: Bungalow already booked or simultaneous booking attempt' },
        },
      },
    },
    '/bookings/{id}': {
      get: {
        tags: ['Bookings'],
        summary: 'Get booking details by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Booking details' } },
      },
    },
    '/bookings/{id}/cancel': {
      post: {
        tags: ['Bookings'],
        summary: 'Cancel a confirmed booking and release dates',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reason'],
                properties: { reason: { type: 'string', example: 'Customer family emergency' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Booking cancelled' } },
      },
    },
    '/negotiations': {
      get: {
        tags: ['Negotiated Rent'],
        summary: 'List negotiated rent requests',
        parameters: [
          { name: 'branchId', in: 'query', schema: { type: 'string' } },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
          },
        ],
        responses: { 200: { description: 'Negotiation requests list' } },
      },
      post: {
        tags: ['Negotiated Rent'],
        summary: 'Sales submits negotiated rent discount request for a booking',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SubmitNegotiationRequest' },
            },
          },
        },
        responses: { 201: { description: 'Negotiation request submitted' } },
      },
    },
    '/negotiations/{id}/approve': {
      post: {
        tags: ['Negotiated Rent'],
        summary: 'Admin approves negotiated rent and recalculates booking totals',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Negotiation approved and booking rent updated' } },
      },
    },
    '/negotiations/{id}/reject': {
      post: {
        tags: ['Negotiated Rent'],
        summary: 'Admin rejects negotiated rent request',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Negotiation rejected' } },
      },
    },
    '/payments': {
      get: {
        tags: ['Payments'],
        summary: 'List payments ledger entries',
        responses: { 200: { description: 'Payments list' } },
      },
      post: {
        tags: ['Payments'],
        summary: 'Record customer payment with idempotency key and balance update',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RecordPaymentRequest' } },
          },
        },
        responses: { 201: { description: 'Payment recorded and booking balance updated' } },
      },
    },
    '/payments/{id}/reverse': {
      post: {
        tags: ['Payments'],
        summary: 'Record authorized ledger reversal entry for correction or refund',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reason'],
                properties: {
                  reason: {
                    type: 'string',
                    example: 'Wrong transaction reference entered by cashier',
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Reversal entry recorded and balance adjusted' } },
      },
    },
    '/maintenance': {
      get: {
        tags: ['Maintenance'],
        summary: 'List maintenance tickets',
        responses: { 200: { description: 'Maintenance tickets list' } },
      },
      post: {
        tags: ['Maintenance'],
        summary: 'Report a maintenance problem for bungalow or facility',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateMaintenanceRequest' },
            },
          },
        },
        responses: { 201: { description: 'Maintenance ticket created' } },
      },
    },
    '/maintenance/{id}/status': {
      patch: {
        tags: ['Maintenance'],
        summary: 'Admin approves, assigns, starts, or completes maintenance request',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Maintenance status updated and bungalow synced' } },
      },
    },
    '/dashboard': {
      get: {
        tags: ['Dashboard & Analytics'],
        summary: 'Get real-time resort dashboard metrics and action items',
        responses: {
          200: { description: 'Inventory counts, today arrivals/departures, pending actions' },
        },
      },
    },
    '/reports/collections': {
      get: {
        tags: ['Reports'],
        summary: 'Branch-wise, user-wise, and payment-mode financial collections report',
        responses: { 200: { description: 'Financial report' } },
      },
    },
    '/reports/occupancy': {
      get: {
        tags: ['Reports'],
        summary: 'Bungalow category-wise occupancy and revenue report',
        responses: { 200: { description: 'Occupancy statistics' } },
      },
    },
    '/reports/balances': {
      get: {
        tags: ['Reports'],
        summary: 'Booking-wise advance, paid, and outstanding balances report',
        responses: { 200: { description: 'Outstanding balances list' } },
      },
    },
    '/audit-logs': {
      get: {
        tags: ['Audit Logs'],
        summary: 'List immutable audit log trail of sensitive actions',
        responses: { 200: { description: 'Audit logs list' } },
      },
    },
  },
};
