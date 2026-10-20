import {
  Repository,
  EntityManager,
  DataSource,
  DeepPartial,
  ObjectLiteral,
  SelectQueryBuilder,
} from 'typeorm';
import { Inject, Type } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

export interface GenericSearchOptions<T> {
  term?: string;
  fields: Array<keyof T>;
}

export interface GenericQueryOptions<T> {
  where?: Partial<Record<keyof T, any>>;
  search?: GenericSearchOptions<T>;
  relations?: string[];
  orderBy?: Partial<Record<keyof T, 'ASC' | 'DESC'>>;
  skip?: number;
  take?: number;
}

export interface IGenericRepository<T extends ObjectLiteral> {
  findAll(options?: GenericQueryOptions<T>): Promise<T[]>;
  findOneById(id: string, relations?: string[]): Promise<T | null>;
  findOneWhere(where: Partial<Record<keyof T, any>>, relations?: string[]): Promise<T | null>;
  create(data: DeepPartial<T>): Promise<T>;
  createMany(data: DeepPartial<T>[]): Promise<T[]>;
  update(id: string, data: DeepPartial<T>, relations?: string[]): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  deleteWhere(where: Partial<Record<keyof T, any>>): Promise<number>;
  distinct<K extends keyof T>(column: K): Promise<Array<T[K]>>;
  count(where?: Partial<Record<keyof T, any>>): Promise<number>;
  executeInTransaction<R>(work: (txManager: EntityManager) => Promise<R>): Promise<R>;
  getRawRepository(): Repository<T>;
}

export class GenericRepository<T extends ObjectLiteral> implements IGenericRepository<T> {
  constructor(
    protected readonly repository: Repository<T>,
    protected readonly dataSource: DataSource,
  ) {}

  getRawRepository(): Repository<T> {
    return this.repository;
  }

  async findAll(options?: GenericQueryOptions<T>): Promise<T[]> {
    const alias = this.repository.metadata.targetName.toLowerCase();
    const qb: SelectQueryBuilder<T> = this.repository.createQueryBuilder(alias);

    // 1. Inclusions / Relations
    if (options?.relations && options.relations.length > 0) {
      for (const rel of options.relations) {
        // Support nested relations (e.g. 'products.prices')
        const parts = rel.split('.');
        if (parts.length === 1) {
          qb.leftJoinAndSelect(`${alias}.${parts[0]}`, parts[0]);
        } else {
          qb.leftJoinAndSelect(`${parts[0]}.${parts[1]}`, `${parts[0]}_${parts[1]}`);
        }
      }
    }

    // 2. Exact / Normalized Where criteria
    if (options?.where) {
      let paramIndex = 0;
      for (const [key, val] of Object.entries(options.where)) {
        if (val === undefined || val === null || val === 'all' || val === '') {
          continue;
        }

        const paramName = `param_${paramIndex++}`;
        if (typeof val === 'string') {
          // Case-insensitive exact match with trimmed spaces
          qb.andWhere(`LOWER(TRIM(${alias}.${key})) = LOWER(TRIM(:${paramName}))`, {
            [paramName]: val.trim(),
          });
        } else {
          qb.andWhere(`${alias}.${key} = :${paramName}`, { [paramName]: val });
        }
      }
    }

    // 3. Search filter across designated fields
    if (options?.search?.term && options.search.fields?.length) {
      const cleanTerm = options.search.term.trim().toLowerCase();
      if (cleanTerm !== '') {
        const searchConditions = options.search.fields.map((field, idx) => {
          return `LOWER(CAST(${alias}.${String(field)} AS TEXT)) LIKE :searchTerm_${idx}`;
        });

        const searchParams: Record<string, string> = {};
        options.search.fields.forEach((_, idx) => {
          searchParams[`searchTerm_${idx}`] = `%${cleanTerm}%`;
        });

        qb.andWhere(`(${searchConditions.join(' OR ')})`, searchParams);
      }
    }

    // 4. Order By
    if (options?.orderBy) {
      let first = true;
      for (const [field, direction] of Object.entries(options.orderBy)) {
        if (first) {
          qb.orderBy(`${alias}.${field}`, direction as 'ASC' | 'DESC');
          first = false;
        } else {
          qb.addOrderBy(`${alias}.${field}`, direction as 'ASC' | 'DESC');
        }
      }
    }

    // 5. Pagination
    if (options?.skip !== undefined) {
      qb.skip(options.skip);
    }
    if (options?.take !== undefined) {
      qb.take(options.take);
    }

    return await qb.getMany();
  }

  async findOneById(id: string, relations?: string[]): Promise<T | null> {
    const alias = this.repository.metadata.targetName.toLowerCase();
    const qb = this.repository.createQueryBuilder(alias);

    if (relations && relations.length > 0) {
      for (const rel of relations) {
        const parts = rel.split('.');
        if (parts.length === 1) {
          qb.leftJoinAndSelect(`${alias}.${parts[0]}`, parts[0]);
        } else {
          qb.leftJoinAndSelect(`${parts[0]}.${parts[1]}`, `${parts[0]}_${parts[1]}`);
        }
      }
    }

    qb.where(`${alias}.id = :id`, { id });
    return await qb.getOne();
  }

  async findOneWhere(
    where: Partial<Record<keyof T, any>>,
    relations?: string[],
  ): Promise<T | null> {
    const items = await this.findAll({ where, relations, take: 1 });
    return items[0] || null;
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity as any);
  }

  async createMany(data: DeepPartial<T>[]): Promise<T[]> {
    const entities = this.repository.create(data as any);
    return await this.repository.save(entities as any);
  }

  async update(id: string, data: DeepPartial<T>, relations?: string[]): Promise<T | null> {
    const existing = await this.findOneById(id);
    if (!existing) return null;

    const merged = this.repository.merge(existing, data as any);
    await this.repository.save(merged as any);

    return await this.findOneById(id, relations);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return Boolean(result.affected && result.affected > 0);
  }

  async deleteWhere(where: Partial<Record<keyof T, any>>): Promise<number> {
    const result = await this.repository.delete(where as any);
    return result.affected || 0;
  }

  async distinct<K extends keyof T>(column: K): Promise<Array<T[K]>> {
    const alias = this.repository.metadata.targetName.toLowerCase();
    const result = await this.repository
      .createQueryBuilder(alias)
      .select(`DISTINCT(${alias}.${String(column)})`, String(column))
      .orderBy(`${alias}.${String(column)}`, 'ASC')
      .getRawMany();

    return result.map((r) => r[String(column)]).filter(Boolean);
  }

  async count(where?: Partial<Record<keyof T, any>>): Promise<number> {
    if (!where || Object.keys(where).length === 0) {
      return await this.repository.count();
    }
    return await this.repository.count({ where: where as any });
  }

  async executeInTransaction<R>(work: (txManager: EntityManager) => Promise<R>): Promise<R> {
    return await this.dataSource.transaction(work);
  }
}

export function getGenericRepositoryToken(entity: Type<any> | Function): string {
  return `GENERIC_REPOSITORY_${entity.name}`;
}

export function InjectGenericRepository(entity: Type<any> | Function) {
  return Inject(getGenericRepositoryToken(entity));
}

export function createGenericRepositoryProvider(entity: Type<any>) {
  return {
    provide: getGenericRepositoryToken(entity),
    useFactory: (typeOrmRepo: Repository<any>, dataSource: DataSource) => {
      return new GenericRepository(typeOrmRepo, dataSource);
    },
    inject: [getRepositoryToken(entity), DataSource],
  };
}
