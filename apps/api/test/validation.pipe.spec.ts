import { createPipelineValidationPipe } from '../src/common/pipes/validation.pipe';
import { CreateOrderDtoClass } from '../src/modules/orders/dto/create-order.dto';
import { BadRequestException } from '@nestjs/common';

describe('Pipeline ValidationPipe Unit Tests (C# style)', () => {
  const pipe = createPipelineValidationPipe();

  it('should reject invalid CreateOrderDto with structured errors Record<field, string[]>', async () => {
    const invalidDto = new CreateOrderDtoClass();
    invalidDto.title = 'A'; // Too short (min 3)

    try {
      await pipe.transform(invalidDto, {
        type: 'body',
        metatype: CreateOrderDtoClass,
      });
      fail('Expected BadRequestException to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      const res: any = (err as BadRequestException).getResponse();
      expect(res.statusCode).toBe(400);
      expect(res.errors).toBeDefined();
      expect(res.errors.title).toBeDefined();
      expect(Array.isArray(res.errors.title)).toBe(true);
    }
  });

  it('should accept valid CreateOrderDto', async () => {
    const validDto = new CreateOrderDtoClass();
    validDto.title = 'Valid Order Title';

    const result = await pipe.transform(validDto, {
      type: 'body',
      metatype: CreateOrderDtoClass,
    });
    expect(result.title).toBe('Valid Order Title');
  });
});
