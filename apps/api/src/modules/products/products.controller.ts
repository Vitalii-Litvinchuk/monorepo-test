import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDtoClass } from './dto/create-product.dto';
import { UpdateProductDtoClass } from './dto/update-product.dto';
import { ProductFilterDtoClass } from './dto/product-filter.dto';
import { Product, UserRole } from '@dzencode/contracts';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Query() filter: ProductFilterDtoClass): Promise<Product[]> {
    return this.productsService.findAll(filter);
  }

  @Get('types')
  async getTypes(): Promise<string[]> {
    return this.productsService.getTypes();
  }

  @Get('specifications')
  async getSpecifications(): Promise<string[]> {
    return this.productsService.getSpecifications();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async create(@Body() dto: CreateProductDtoClass): Promise<Product> {
    return this.productsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDtoClass,
  ): Promise<Product> {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
