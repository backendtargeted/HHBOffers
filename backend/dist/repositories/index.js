"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityLogRepository = exports.uploadJobRepository = exports.propertyRepository = exports.userRepository = exports.ActivityLogRepository = exports.UploadJobRepository = exports.PropertyRepository = exports.UserRepository = exports.BaseRepository = void 0;
const BaseRepository_1 = __importDefault(require("./BaseRepository"));
exports.BaseRepository = BaseRepository_1.default;
const UserRepository_1 = __importStar(require("./UserRepository"));
exports.UserRepository = UserRepository_1.default;
Object.defineProperty(exports, "userRepository", { enumerable: true, get: function () { return UserRepository_1.userRepository; } });
const PropertyRepository_1 = __importStar(require("./PropertyRepository"));
exports.PropertyRepository = PropertyRepository_1.default;
Object.defineProperty(exports, "propertyRepository", { enumerable: true, get: function () { return PropertyRepository_1.propertyRepository; } });
const UploadJobRepository_1 = __importStar(require("./UploadJobRepository"));
exports.UploadJobRepository = UploadJobRepository_1.default;
Object.defineProperty(exports, "uploadJobRepository", { enumerable: true, get: function () { return UploadJobRepository_1.uploadJobRepository; } });
const ActivityLogRepository_1 = __importStar(require("./ActivityLogRepository"));
exports.ActivityLogRepository = ActivityLogRepository_1.default;
Object.defineProperty(exports, "activityLogRepository", { enumerable: true, get: function () { return ActivityLogRepository_1.activityLogRepository; } });
// Export default as an object with all repositories
exports.default = {
    userRepository: UserRepository_1.userRepository,
    propertyRepository: PropertyRepository_1.propertyRepository,
    uploadJobRepository: UploadJobRepository_1.uploadJobRepository,
    activityLogRepository: ActivityLogRepository_1.activityLogRepository
};
