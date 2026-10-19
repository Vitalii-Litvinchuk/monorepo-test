import {
  BadRequestException,
  ValidationError,
  ValidationPipe as NestValidationPipe,
} from '@nestjs/common';

/**
 * Pipeline-first validation pipe matching C# ActionFilter / ModelValidation
 * Formats errors as Record<field, string[]> for the RFC 7807 ProblemDetails filter
 */
export function createPipelineValidationPipe(): NestValidationPipe {
  return new NestValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    exceptionFactory: (validationErrors: ValidationError[] = []) => {
      const errors: Record<string, string[]> = {};

      const formatErrors = (errs: ValidationError[], parent = '') => {
        for (const err of errs) {
          const field = parent ? `${parent}.${err.property}` : err.property;
          if (err.constraints) {
            errors[field] = Object.values(err.constraints);
          }
          if (err.children && err.children.length > 0) {
            formatErrors(err.children, field);
          }
        }
      };

      formatErrors(validationErrors);

      return new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed.',
        errors,
      });
    },
  });
}
