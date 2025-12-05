import { Transaction, Sequelize } from 'sequelize';
import { OfferHistory, OfferHistoryCreationAttributes } from '../models/OfferHistory';
import BaseRepository from './BaseRepository';
import logger from '../logger';
import sequelize from '../config/database';

class OfferHistoryRepository extends BaseRepository<OfferHistory> {
  constructor() {
    super(OfferHistory);
  }

  /**
   * Add a new offer to the history
   */
  async addOffer(
    data: { 
      propertyId: number; 
      offerAmount: string; 
      offerDate: string; 
    }, 
    transaction?: Transaction
  ): Promise<OfferHistory> {
    const offerData: OfferHistoryCreationAttributes = {
      property_id: data.propertyId,
      offer_amount: data.offerAmount,
      offer_date: new Date(data.offerDate),
    };

    logger.info('[OfferHistory] Data for offer creation:', { offerAmount: data.offerAmount, offerDate: data.offerDate });

    return await this.create(offerData, transaction);
  }

  /**
   * Find all offers for a property, ordered by offer date (desc) and creation date (desc)
   * Uses raw date formatting to avoid timezone conversion issues
   */
  async findByPropertyId(propertyId: number): Promise<OfferHistory[]> {
    return await this.findAll({
      where: { property_id: propertyId },
      order: [
        ['offer_date', 'DESC'],
        ['created_at', 'DESC']
      ],
      attributes: {
        include: [
          // Format offer_date as string directly from database to avoid timezone conversion
          [sequelize.literal("TO_CHAR(offer_date, 'YYYY-MM-DD')"), 'offer_date_string']
        ]
      },
      raw: false
    });
  }

  /**
   * Get the latest offer for a property
   */
  async getLatestOffer(propertyId: number): Promise<OfferHistory | null> {
    const offers = await this.findByPropertyId(propertyId);
    return offers.length > 0 ? offers[0] : null;
  }
}

export const offerHistoryRepository = new OfferHistoryRepository(); 