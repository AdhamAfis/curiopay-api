import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({
  description: 'Unauthorized - Valid JWT token is required',
  schema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        example: 'Unauthorized',
      },
      statusCode: {
        type: 'number',
        example: 401,
      },
      error: {
        type: 'string',
        example: 'Unauthorized',
      },
    },
  },
})
export class BaseController {} 