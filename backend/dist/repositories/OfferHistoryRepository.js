"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.offerHistoryRepository = void 0;
const OfferHistory_1 = require("../models/OfferHistory");
const BaseRepository_1 = __importDefault(require("./BaseRepository"));
const logger_1 = __importDefault(require("../logger"));
class OfferHistoryRepository extends BaseRepository_1.default {
    constructor() {
        super(OfferHistory_1.OfferHistory);
    }
    /**
     * Add a new offer to the history
     */
    addOffer(data, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const offerData = {
                property_id: data.propertyId,
                offer_amount: data.offerAmount,
                offer_date: new Date(data.offerDate),
            };
            logger_1.default.info('[OfferHistory] Data for offer creation:', { offerAmount: data.offerAmount, offerDate: data.offerDate });
            return yield this.create(offerData, transaction);
        });
    }
    /**
     * Find all offers for a property, ordered by offer date (desc) and creation date (desc)
     */
    findByPropertyId(propertyId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.findAll({
                where: { property_id: propertyId },
                order: [
                    ['offer_date', 'DESC'],
                    ['created_at', 'DESC']
                ]
            });
        });
    }
    /**
     * Get the latest offer for a property
     */
    getLatestOffer(propertyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const offers = yield this.findByPropertyId(propertyId);
            return offers.length > 0 ? offers[0] : null;
        });
    }
}
exports.offerHistoryRepository = new OfferHistoryRepository();
