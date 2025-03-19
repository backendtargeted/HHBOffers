import { Transaction, Op, WhereOptions, Sequelize, QueryTypes } from 'sequelize';
import BaseRepository from './BaseRepository';
import Property, { PropertyAttributes, PropertyCreationAttributes } from '../models/Property';
import sequelize from '../config/database';
import logger from '../logger';

/**
 * Repository class for Property model
 * Extends BaseRepository with Property-specific query methods
 */
export default class PropertyRepository extends BaseRepository<Property> {
  constructor() {
    super(Property);
  }

  /**
   * Find a property by its exact address combination
   * Used for deduplication during imports
   * @param propertyAddress - Street address
   * @param propertyCity - City
   * @param propertyState - State code
   * @param propertyZip - ZIP code
   * @returns Property instance or null
   */
  async findByAddressCombination(
    propertyAddress: string,
    propertyCity: string,
    propertyState: string,
    propertyZip: string
  ): Promise<Property | null> {
    logger.info(`[PropertyRepository] Finding property by address combination: ${propertyAddress}, ${propertyCity}, ${propertyState}, ${propertyZip}`);
    const property = await this.findOne({
      property_address: propertyAddress,
      property_city: propertyCity,
      property_state: propertyState,
      property_zip: propertyZip,
    });
    logger.info(`[PropertyRepository] Found property: ${JSON.stringify(property)}`);
    return property;
  }

  /**
   * Search properties by address with autocomplete functionality
   * @param query - Search query string
   * @param limit - Maximum number of results
   * @returns Array of matching properties
   */
  async searchByAddress(query: string, limit: number = 10): Promise<Property[]> {
    // Normalize the query to improve matching
    const normalizedQuery = query.trim().toLowerCase();
    const searchQuery = `%${normalizedQuery}%`;
    
    return this.findAll({
      where: {
        [Op.or]: [
          { property_address: { [Op.iLike]: searchQuery } },
          { property_city: { [Op.iLike]: searchQuery } },
          { property_zip: { [Op.like]: searchQuery } },
        ],
      },
      limit,
      order: [
        ['property_city', 'ASC'],
        ['property_zip', 'ASC'],
        ['property_address', 'ASC'],
      ],
    });
  }

  /**
   * Create a new property or update if it already exists (address-based deduplication)
   * @param propertyData - Property data
   * @param transaction - Optional transaction
   * @returns Created or updated property instance and a boolean indicating if it was created
   */
  async startTransaction(): Promise<Transaction> {
    return sequelize.transaction();
  }

  override async bulkCreate(
    records: PropertyCreationAttributes[],
    transaction?: Transaction,
    updateOnDuplicate?: (keyof PropertyAttributes)[]
  ): Promise<Property[]> {
    return this.model.bulkCreate(records, {
      transaction,
      updateOnDuplicate,
      returning: true
    });
  }

  async createOrUpdate(
    propertyData: PropertyCreationAttributes,
    transaction?: Transaction
  ): Promise<[Property, boolean]> {
    logger.info(`[PropertyRepository] createOrUpdate called with propertyData: ${JSON.stringify(propertyData)}`);
    // Check if property already exists based on address
    const existingProperty = await this.findByAddressCombination(
      propertyData.property_address,
      propertyData.property_city,
      propertyData.property_state,
      propertyData.property_zip
    );

    if (existingProperty) {
      logger.info(`[PropertyRepository] Found existing property: ${JSON.stringify(existingProperty)}`);
      // Update the offer amount if it changed
      if (existingProperty.offer !== propertyData.offer) {
        const [, updatedProperties] = await this.update(
          existingProperty.id,
          { offer: propertyData.offer as any },
          transaction
        );
        return [updatedProperties[0] || existingProperty, false];
      }
      return [existingProperty, false];
    }

    logger.info(`[PropertyRepository] Creating new property: ${JSON.stringify(propertyData)}`);
    // Create new property if it doesn't exist
    const newProperty = await this.create(propertyData, transaction);
    return [newProperty, true];
  }

  /**
   * Find properties by ZIP code
   * @param zipCode - ZIP code to search for
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated properties in the specified ZIP code
   */
  async findByZipCode(
    zipCode: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ rows: Property[]; count: number; totalPages: number; currentPage: number }> {
    return this.findPaginated(page, pageSize, {
      where: { property_zip: zipCode },
      order: [['property_address', 'ASC']],
    });
  }

  /**
   * Find properties by city
   * @param city - City to search for
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated properties in the specified city
   */
  async findByCity(
    city: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ rows: Property[]; count: number; totalPages: number; currentPage: number }> {
    return this.findPaginated(page, pageSize, {
      where: { property_city: { [Op.iLike]: city } },
      order: [['property_address', 'ASC']],
    });
  }

  /**
   * Find properties by state
   * @param state - State code to search for
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated properties in the specified state
   */
  async findByState(
    state: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ rows: Property[]; count: number; totalPages: number; currentPage: number }> {
    return this.findPaginated(page, pageSize, {
      where: { property_state: state.toUpperCase() },
      order: [
        ['property_city', 'ASC'],
        ['property_address', 'ASC'],
      ],
    });
  }

  /**
   * Find properties by owner (first and last name)
   * @param name - Owner name to search for
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated properties with the specified owner
   */
  async findByOwnerName(
    name: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ rows: Property[]; count: number; totalPages: number; currentPage: number }> {
    const searchQuery = `%${name}%`;
    
    return this.findPaginated(page, pageSize, {
      where: {
        [Op.or]: [
          { first_name: { [Op.iLike]: searchQuery } },
          { last_name: { [Op.iLike]: searchQuery } },
        ],
      },
      order: [
        ['last_name', 'ASC'],
        ['first_name', 'ASC'],
      ],
    });
  }

  /**
   * Find properties with offers in a specific range
   * @param minOffer - Minimum offer amount
   * @param maxOffer - Maximum offer amount
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated properties with offers in the specified range
   */
  async findByOfferRange(
    minOffer: number,
    maxOffer: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ rows: Property[]; count: number; totalPages: number; currentPage: number }> {
    return this.findPaginated(page, pageSize, {
      where: {
        offer: {
          [Op.between]: [minOffer, maxOffer],
        },
      },
      order: [['offer', 'DESC']],
    });
  }

  /**
   * Search properties with multiple criteria
   * @param query - Search query string
   * @param limit - Maximum number of results
   * @param offset - Number of results to skip
   * @returns Array of matching properties
   */
  async searchProperties(query: string, limit: number = 10, offset: number = 0): Promise<Property[]> {
    const searchTerms = query.split(' ').filter((term: string) => term.length > 0);
    
    const whereConditions: any[] = [];
    
    for (const term of searchTerms) {
      whereConditions.push({
        [Op.or]: [
          { property_address: { [Op.iLike]: `%${term}%` } },
          { property_city: { [Op.iLike]: `%${term}%` } },
          { first_name: { [Op.iLike]: `%${term}%` } },
          { last_name: { [Op.iLike]: `%${term}%` } }
        ]
      });
    }
    
    return this.findAll({
      where: {
        [Op.and]: whereConditions
      },
      limit,
      offset,
      order: [['updated_at', 'DESC']]
    });
  }

  /**
   * Count search results for a query string
   * @param query - Search query string
   * @returns Number of matching properties
   */
  async countSearchResults(query: string): Promise<number> {
    const searchTerms = query.split(' ').filter((term: string) => term.length > 0);
    
    const whereConditions: any[] = [];
    
    for (const term of searchTerms) {
      whereConditions.push({
        [Op.or]: [
          { property_address: { [Op.iLike]: `%${term}%` } },
          { property_city: { [Op.iLike]: `%${term}%` } },
          { first_name: { [Op.iLike]: `%${term}%` } },
          { last_name: { [Op.iLike]: `%${term}%` } }
        ]
      });
    }
    
    return this.count({
      where: {
        [Op.and]: whereConditions
      }
    });
  }

  /**
   * Get properties added today
   * @returns Count of properties added today
   */
  async getPropertiesAddedToday(): Promise<number> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  return this.count({
    where: {
      created_at: {
        [Op.gte]: todayStart
      }
    }
  });
}

/**
 * Get properties updated today (excluding newly created ones)
 * @returns Count of properties updated today
 */
async getPropertiesUpdatedToday(): Promise<number> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  return this.count({
    where: {
      updated_at: {
        [Op.gte]: todayStart
      },
      created_at: {
        [Op.lt]: todayStart
      }
    }
  });
}

  /**
   * Get property statistics by state
   * @returns Array of state statistics with count and average offer
   */
  async getStatsByState(): Promise<Array<{ state: string; count: number; averageOffer: number }>> {
    type StatsResult = { state: string; count: string; averageOffer: string };
    
    const results = await sequelize.query<StatsResult>(`
      SELECT 
        property_state as state, 
        COUNT(*) as count, 
        AVG(offer) as "averageOffer"
      FROM properties 
      GROUP BY property_state 
      ORDER BY COUNT(*) DESC
    `, { type: QueryTypes.SELECT });

    return results.map(result => ({
      state: result.state,
      count: parseInt(result.count, 10),
      averageOffer: parseFloat(result.averageOffer) || 0
    }));
  }

  /**
   * Get property statistics by city for a specific state
   * @param state - State code to filter by
   * @returns Array of city statistics with count and average offer
   */
  async getStatsByCity(state: string): Promise<Array<{ city: string; count: number; averageOffer: number }>> {
    type StatsResult = { city: string; count: string; averageOffer: string };
    
    const results = await sequelize.query<StatsResult>(`
      SELECT 
        property_city as city, 
        COUNT(*) as count, 
        AVG(offer) as "averageOffer"
      FROM properties 
      WHERE property_state = :state
      GROUP BY property_city 
      ORDER BY COUNT(*) DESC
    `, { 
      replacements: { state: state.toUpperCase() },
      type: QueryTypes.SELECT 
    });

    return results.map(result => ({
      city: result.city,
      count: parseInt(result.count, 10),
      averageOffer: parseFloat(result.averageOffer) || 0
    }));
  }
}

// Export a singleton instance
export const propertyRepository = new PropertyRepository();
