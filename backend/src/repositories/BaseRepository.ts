import { Model, ModelCtor, WhereOptions, FindOptions, Op, Transaction, ModelAttributes, CreationAttributes } from 'sequelize';

/**
 * Base Repository class that implements common CRUD operations
 * This class serves as the foundation for all other repositories
 * in the application, following the Repository Pattern for data access abstraction
 */
export default class BaseRepository<T extends Model> {
  protected model: ModelCtor<T>;

  constructor(model: ModelCtor<T>) {
    this.model = model;
  }

  /**
   * Find a record by its primary key
   * @param id - The primary key value
   * @param options - Additional find options
   * @returns The found record or null
   */
  async findById(id: number | string, options: FindOptions = {}): Promise<T | null> {
    return this.model.findByPk(id, options);
  }

  /**
   * Find a single record based on where conditions
   * @param where - The where conditions
   * @param options - Additional find options
   * @returns The found record or null
   */
  async findOne(where: WhereOptions, options: FindOptions = {}): Promise<T | null> {
    return this.model.findOne({
      ...options,
      where,
    });
  }

  /**
   * Find all records that match the given conditions
   * @param options - Find options including where, order, limit, etc.
   * @returns An array of records
   */
  async findAll(options: FindOptions = {}): Promise<T[]> {
    return this.model.findAll(options);
  }

  /**
   * Count records that match the given conditions
   * @param options - Find options including where
   * @returns The count of matching records
   */
  async count(options: FindOptions = {}): Promise<number> {
    return this.model.count(options);
  }

  /**
   * Create a new record
   * @param data - The data to create
   * @param transaction - Optional transaction
   * @returns The created record
   */
  async create(data: CreationAttributes<T>, transaction?: Transaction): Promise<T> {
    return this.model.create(data, { 
      transaction 
    });
  }

  /**
   * Update a record by its primary key
   * @param id - The primary key value
   * @param data - The data to update
   * @param transaction - Optional transaction
   * @returns The number of affected rows
   */
  async update(id: number | string, data: Partial<ModelAttributes<T>>, transaction?: Transaction): Promise<[number, T[]]> {
    // First update the record
    const [affectedRows] = await this.model.update(data, {
      where: { id } as any,
      transaction,
    });

    // Then fetch the updated record
    const updatedInstance = await this.model.findByPk(id, { transaction }) as T;
    
    return [affectedRows, updatedInstance ? [updatedInstance] : []];
  }

  /**
   * Update records based on where conditions
   * @param where - The where conditions
   * @param data - The data to update
   * @param transaction - Optional transaction
   * @returns The number of affected rows
   */
  async updateWhere(where: WhereOptions, data: Partial<ModelAttributes<T>>, transaction?: Transaction): Promise<[number, T[]]> {
    return this.model.update(data, {
      where,
      transaction,
      returning: true,
    }) as Promise<[number, T[]]>;
  }

  /**
   * Delete a record by its primary key
   * @param id - The primary key value
   * @param transaction - Optional transaction
   * @returns The number of deleted rows
   */
  async delete(id: number | string, transaction?: Transaction): Promise<number> {
    return this.model.destroy({
      where: { id } as any,
      transaction,
    });
  }

  /**
   * Delete records based on where conditions
   * @param where - The where conditions
   * @param transaction - Optional transaction
   * @returns The number of deleted rows
   */
  async deleteWhere(where: WhereOptions, transaction?: Transaction): Promise<number> {
    return this.model.destroy({
      where,
      transaction,
    });
  }

  /**
   * Find records with pagination
   * @param page - The page number (1-based)
   * @param pageSize - The page size
   * @param options - Additional find options
   * @returns An object with rows and count
   */
  async findPaginated(
    page: number = 1, 
    pageSize: number = 20, 
    options: FindOptions = {}
  ): Promise<{ rows: T[]; count: number; totalPages: number; currentPage: number }> {
    const { count, rows } = await this.model.findAndCountAll({
      ...options,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return {
      rows,
      count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
    };
  }

  /**
   * Get model instances by multiple IDs
   * @param ids - Array of IDs to fetch
   * @param options - Additional find options
   * @returns Array of found records
   */
  async findByIds(ids: (number | string)[], options: FindOptions = {}): Promise<T[]> {
    if (!ids.length) return [];
    
    return this.model.findAll({
      ...options,
      where: {
        ...options.where,
        id: { [Op.in]: ids },
      } as any,
    });
  }

  /**
   * Perform a bulk create operation
   * @param records - Array of records to create
   * @param transaction - Optional transaction
   * @returns Array of created records
   */
  async bulkCreate(records: CreationAttributes<T>[], transaction?: Transaction): Promise<T[]> {
    return this.model.bulkCreate(records, {
      transaction,
      returning: true,
    });
  }

  /**
   * Check if a record exists by ID
   * @param id - The ID to check
   * @returns Boolean indicating if record exists
   */
  async exists(id: number | string): Promise<boolean> {
    const count = await this.model.count({
      where: { id } as any,
    });
    return count > 0;
  }

  /**
   * Check if records exist based on where conditions
   * @param where - The where conditions
   * @returns Boolean indicating if records exist
   */
  async existsWhere(where: WhereOptions): Promise<boolean> {
    const count = await this.model.count({ where });
    return count > 0;
  }
}
