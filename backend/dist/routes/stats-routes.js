"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stats_controller_1 = __importDefault(require("../controllers/stats-controller"));
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
router.get('/system', (0, asyncHandler_1.asyncHandler)(stats_controller_1.default.getSystemStats));
router.get('/properties/by-state', (0, asyncHandler_1.asyncHandler)(stats_controller_1.default.getPropertyStatsByState));
router.get('/properties/by-city/:state', (0, asyncHandler_1.asyncHandler)(stats_controller_1.default.getPropertyStatsByCity));
exports.default = router;
