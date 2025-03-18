import { Request, Response } from 'express';
import Property from '../models/Property';
import { propertyRepository } from '../repositories';
import { activityLogRepository } from '../repositories';
import { redisService } from '../services/redis-service';
import logger from '../logger';

class PropertyController {
  /**
   * Get all properties with pagination
   * @param req Request object
   * @param res Response object
   */
  async getAllProperties(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.limit as string) || 20;
      
      // Cache key based on query parameters
      const cacheKey = `properties:all:page=${page}:limit=${pageSize}`;
      
      // Try to get from cache first
      const cachedData = await redisService.get(cacheKey);
      if (cachedData) {
        return res.status(200).json({
          success: true,
          ...cachedData,
          fromCache: true
        });
      }
      
      // If not in cache, get from database
      const result = await propertyRepository.findPaginated(page, pageSize);
      
      // Store in cache for 5 minutes
      await redisService.set(cacheKey, result, 300);
      
      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      logger.error('Error fetching properties:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching properties'
      });
    }
  }

  /**
   * Get property by ID
   * @param req Request object
   * @param res Response object
   */
  async getPropertyById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Cache key
      const cacheKey = `property:${id}`;
      
      // Try to get from cache first
      const cachedProperty = await redisService.get(cacheKey);
      if (cachedProperty) {
        return res.status(200).json({
          success: true,
          property: cachedProperty,
          fromCache: true
        });
      }
      
      // If not in cache, get from database
      const property = await propertyRepository.findById(parseInt(id));
      
      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }
      
      // Store in cache for 10 minutes
      await redisService.set(cacheKey, property, 600);
      
      // Log view activity
      const userId = (req as any).user?.id;
      if (userId) {
        await activityLogRepository.log({
          user_id: userId,
          action: 'view',
          entity_type: 'property',
          entity_id: id,
          ip_address: req.ip
        });
      }
      
      return res.status(200).json({
        success: true,
        property
      });
    } catch (error) {
      logger.error(`Error fetching property with ID ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching property'
      });
    }
  }

  /**
   * Create a new property
   * @param req Request object
   * @param res Response object
   */
  async createProperty(req: Request, res: Response) {
    try {
      const propertyData = {
        first_name: req.body.firstName,
        last_name: req.body.lastName,
        property_address: req.body.propertyAddress,
        property_city: req.body.propertyCity,
        property_state: req.body.propertyState,
        property_zip: req.body.propertyZip,
        offer: req.body.offer,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Check if property with same address already exists
      const existingProperty = await propertyRepository.findByAddressCombination(
        propertyData.property_address,
        propertyData.property_city,
        propertyData.property_state,
        propertyData.property_zip
      );
      
      if (existingProperty) {
        return res.status(409).json({
          success: false,
          message: 'Property with this address already exists'
        });
      }
      
      // Create property
      const property = await propertyRepository.create(propertyData);
      
      // Log creation activity
      const userId = (req as any).user?.id;
      await activityLogRepository.log({
        user_id: userId,
        action: 'create',
        entity_type: 'property',
        entity_id: property.id.toString(),
        details: propertyData,
        ip_address: req.ip
      });
      
      // Invalidate related cache keys
      await redisService.delete('properties:all:*');
      
      return res.status(201).json({
        success: true,
        property
      });
    } catch (error) {
      logger.error('Error creating property:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating property'
      });
    }
  }

  /**
   * Update a property
   * @param req Request object
   * @param res Response object
   */
  async updateProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const propertyId = parseInt(id);
      
      // Check if property exists
      const existingProperty = await propertyRepository.findById(propertyId);
      
      if (!existingProperty) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }
      
      const updateData: any = {};
      
      // Only include fields that are present in the request
      if (req.body.firstName !== undefined) updateData.first_name = req.body.firstName;
      if (req.body.lastName !== undefined) updateData.last_name = req.body.lastName;
      if (req.body.propertyAddress !== undefined) updateData.property_address = req.body.propertyAddress;
      if (req.body.propertyCity !== undefined) updateData.property_city = req.body.propertyCity;
      if (req.body.propertyState !== undefined) updateData.property_state = req.body.propertyState;
      if (req.body.propertyZip !== undefined) updateData.property_zip = req.body.propertyZip;
      if (req.body.offer !== undefined) updateData.offer = req.body.offer;
      
      // Always update the updated_at timestamp
      updateData.updated_at = new Date();
      
      // If changing address, check for duplicates
      if (updateData.property_address || updateData.property_city || 
          updateData.property_state || updateData.property_zip) {
            
        const addressToCheck = {
          property_address: updateData.property_address || existingProperty.property_address,
          property_city: updateData.property_city || existingProperty.property_city,
          property_state: updateData.property_state || existingProperty.property_state,
          property_zip: updateData.property_zip || existingProperty.property_zip
        };
        
        const duplicateProperty = await propertyRepository.findByAddressCombination(
          addressToCheck.property_address,
          addressToCheck.property_city,
          addressToCheck.property_state,
          addressToCheck.property_zip
        );
        
        if (duplicateProperty && duplicateProperty.id !== propertyId) {
          return res.status(409).json({
            success: false,
            message: 'Another property with this address already exists'
          });
        }
      }
      
      // Update property
      const [numUpdated, [updatedProperty]] = await propertyRepository.update(propertyId, updateData);
      
      if (numUpdated === 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update property'
        });
      }
      
      // Log update activity
      const userId = (req as any).user?.id;
      await activityLogRepository.log({
        user_id: userId,
        action: 'update',
        entity_type: 'property',
        entity_id: id,
        details: updateData,
        ip_address: req.ip
      });
      
      // Invalidate cache
      await redisService.delete(`property:${id}`);
      await redisService.delete('properties:all:*');
      
      return res.status(200).json({
        success: true,
        property: updatedProperty
      });
    } catch (error) {
      logger.error(`Error updating property with ID ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Error updating property'
      });
    }
  }

  /**
   * Delete a property
   * @param req Request object
   * @param res Response object
   */
  async deleteProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const propertyId = parseInt(id);
      
      // Check if property exists
      const existingProperty = await propertyRepository.findById(propertyId);
      
      if (!existingProperty) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }
      
      // Delete property
      const deleted = await propertyRepository.delete(propertyId);
      
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete property'
        });
      }
      
      // Log deletion activity
      const userId = (req as any).user?.id;
      await activityLogRepository.log({
        user_id: userId,
        action: 'delete',
        entity_type: 'property',
        entity_id: id,
        details: {
          property_address: existingProperty.property_address,
          property_city: existingProperty.property_city,
          property_state: existingProperty.property_state,
          property_zip: existingProperty.property_zip
        },
        ip_address: req.ip
      });
      
      // Invalidate cache
      await redisService.delete(`property:${id}`);
      await redisService.delete('properties:all:*');
      
      return res.status(200).json({
        success: true,
        message: 'Property deleted successfully'
      });
    } catch (error) {
      logger.error(`Error deleting property with ID ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting property'
      });
    }
  }


  /**
   * Batch update properties
   * @param req Request object
   * @param res Response object
   */
  async batchUpdateProperties(req: Request, res: Response) {
    try {
      const { properties } = req.body;
      
      if (!Array.isArray(properties) || properties.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request. Expected an array of properties.'
        });
      }
      
      const results = {
        total: properties.length,
        updated: 0,
        failed: 0,
        errors: [] as { id: number; error: string }[]
      };
      
      const userId = (req as any).user?.id;
      
      // Process each property update
      for (const property of properties) {
        try {
          if (!property.id) {
            results.failed++;
            results.errors.push({ id: property.id || 0, error: 'Missing property ID' });
            continue;
          }
          
          const propertyId = typeof property.id === 'string' ? parseInt(property.id) : property.id;
          
          // Check if property exists
          const existingProperty = await propertyRepository.findById(propertyId);
          
          if (!existingProperty) {
            results.failed++;
            results.errors.push({ id: propertyId, error: 'Property not found' });
            continue;
          }
          
          const updateData: any = {};
          
          // Only include fields that are present in the request
          if (property.firstName !== undefined) updateData.first_name = property.firstName;
          if (property.lastName !== undefined) updateData.last_name = property.lastName;
          if (property.propertyAddress !== undefined) updateData.property_address = property.propertyAddress;
          if (property.propertyCity !== undefined) updateData.property_city = property.propertyCity;
          if (property.propertyState !== undefined) updateData.property_state = property.propertyState;
          if (property.propertyZip !== undefined) updateData.property_zip = property.propertyZip;
          if (property.offer !== undefined) updateData.offer = property.offer;
          
          // Always update the updated_at timestamp
          updateData.updated_at = new Date();
          
          // If changing address, check for duplicates
          if (updateData.property_address || updateData.property_city || 
              updateData.property_state || updateData.property_zip) {
                
            const addressToCheck = {
              property_address: updateData.property_address || existingProperty.property_address,
              property_city: updateData.property_city || existingProperty.property_city,
              property_state: updateData.property_state || existingProperty.property_state,
              property_zip: updateData.property_zip || existingProperty.property_zip
            };
            
            const duplicateProperty = await propertyRepository.findByAddressCombination(
              addressToCheck.property_address,
              addressToCheck.property_city,
              addressToCheck.property_state,
              addressToCheck.property_zip
            );
            
            if (duplicateProperty && duplicateProperty.id !== propertyId) {
              results.failed++;
              results.errors.push({ 
                id: propertyId, 
                error: 'Another property with this address already exists' 
              });
              continue;
            }
          }
          
          // Update property
          const [numUpdated, [updatedProperty]] = await propertyRepository.update(propertyId, updateData);
          
          if (numUpdated === 0) {
            results.failed++;
            results.errors.push({ id: propertyId, error: 'Failed to update property' });
            continue;
          }
          
          // Log update activity
          await activityLogRepository.log({
            user_id: userId,
            action: 'batch_update',
            entity_type: 'property',
            entity_id: propertyId.toString(),
            details: updateData,
            ip_address: req.ip
          });
          
          // Invalidate cache
          await redisService.delete(`property:${propertyId}`);
          
          results.updated++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error(`Error updating property in batch operation:`, errorMessage);
          
          results.failed++;
          results.errors.push({ 
            id: property.id || 0, 
            error: errorMessage 
          });
        }
      }
      
      // Invalidate list caches
      await redisService.delete('properties:all:*');
      await redisService.delete('properties:search:*');
      
      return res.status(200).json({
        success: true,
        results
      });
    } catch (error) {
      logger.error('Error performing batch update:', error);
      return res.status(500).json({
        success: false,
        message: 'Error performing batch update'
      });
    }
  }
      

  /**
   * Search properties with pagination and autocomplete functionality
   * @param req Request object
   * @param res Response object
   */
  async searchProperties(req: Request, res: Response) {
    try {
      const query = req.query.q as string || '';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      
      // If query is too short, return empty results
      if (query.length < 2) {
        return res.status(200).json({
          success: true,
          results: [],
          total: 0,
          page,
          limit
        });
      }
      
      // Cache key
      const cacheKey = `properties:search:q=${query}:page=${page}:limit=${limit}`;
      
      // Try to get from cache first
      const cachedResults = await redisService.get(cacheKey);
      if (cachedResults) {
        return res.status(200).json({
          success: true,
          ...cachedResults,
          fromCache: true
        });
      }
      
      // Get search results
      const results = await propertyRepository.searchProperties(query, limit, offset);
      const total = await propertyRepository.count({
        where: results.length > 0 ? { id: { in: results.map((p: Property) => p.id) } } : {}
      });
      
      // Format response
      const response = {
        results,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
      
      // Cache results for 5 minutes
      await redisService.set(cacheKey, response, 300);
      
      // Log search activity
      const userId = (req as any).user?.id;
      if (userId) {
        await activityLogRepository.log({
          user_id: userId,
          action: 'search',
          entity_type: 'property',
          details: { query, page, limit, resultsCount: results.length },
          ip_address: req.ip
        });
      }
      
      return res.status(200).json({
        success: true,
        ...response
      });
    } catch (error) {
      logger.error(`Error searching properties with query ${req.query.q}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Error searching properties'
      });
    }
  }

    /**
   * Batch create properties
   * @param req Request object
   * @param res Response object
   */
  async batchCreateProperties(req: Request, res: Response) {
    try {
      const { properties } = req.body;
      
      if (!Array.isArray(properties) || properties.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request. Expected an array of properties.'
        });
      }
      
      const results = {
        total: properties.length,
        created: 0,
        failed: 0,
        errors: [] as { index: number; error: string }[]
      };
      
      const userId = (req as any).user?.id;
      const createdProperties = [];
      
      // Process each property
      for (let i = 0; i < properties.length; i++) {
        try {
          const property = properties[i];
          
          // Transform to database format
          const propertyData = {
            first_name: property.firstName || null,
            last_name: property.lastName || null,
            property_address: property.propertyAddress,
            property_city: property.propertyCity,
            property_state: property.propertyState,
            property_zip: property.propertyZip,
            offer: property.offer,
            created_at: new Date(),
            updated_at: new Date()
          };
          
          // Check for duplicate by address
          const existingProperty = await propertyRepository.findByAddressCombination(
            propertyData.property_address,
            propertyData.property_city,
            propertyData.property_state,
            propertyData.property_zip
          );
          
          if (existingProperty) {
            results.failed++;
            results.errors.push({ 
              index: i, 
              error: 'Property with this address already exists' 
            });
            continue;
          }
          
          // Create the property
          const newProperty = await propertyRepository.create(propertyData);
          
          // Log creation
          await activityLogRepository.log({
            user_id: userId,
            action: 'batch_create',
            entity_type: 'property',
            entity_id: newProperty.id.toString(),
            details: propertyData,
            ip_address: req.ip
          });
          
          results.created++;
          createdProperties.push(newProperty);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error(`Error creating property in batch operation:`, errorMessage);
          
          results.failed++;
          results.errors.push({ index: i, error: errorMessage });
        }
      }
      
      // Invalidate list caches
      await redisService.delete('properties:all:*');
      
      return res.status(201).json({
        success: true,
        results,
        properties: createdProperties
      });
    } catch (error) {
      logger.error('Error performing batch creation:', error);
      return res.status(500).json({
        success: false,
        message: 'Error performing batch creation'
      });
    }
  }
}

export default new PropertyController();
