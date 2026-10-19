import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ProblemDetails } from '@dzencode/contracts';

/**
 * Standard RFC 7807 Problem Details Exception Filter
 * Converts any HTTP exception or validation error into structured field errors
 * (matches C# ASP.NET Core ModelState validation behavior)
 */
@Catch()
export class ProblemDetailsExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'An unexpected error occurred.';
    let detail: string | undefined = undefined;
    let errors: Record<string, string[]> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const errorObject = res as any;
        title = errorObject.error || errorObject.message || exception.name;

        // ValidationPipe formatted errors
        if (errorObject.errors && typeof errorObject.errors === 'object') {
          errors = errorObject.errors;
        } else if (Array.isArray(errorObject.message)) {
          // Standard NestJS validation error messages array
          errors = {
            general: errorObject.message,
          };
          title = 'Validation failed.';
        } else if (typeof errorObject.message === 'string') {
          detail = errorObject.message;
        }
      } else if (typeof res === 'string') {
        detail = res;
      }
    } else if (exception instanceof Error) {
      detail = exception.message;
    }

    const problemDetails: ProblemDetails = {
      type: `https://httpstatuses.com/${status}`,
      title,
      status,
      detail,
      errors,
    };

    response.status(status).json(problemDetails);
  }
}
