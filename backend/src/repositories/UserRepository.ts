import { Transaction, Op, WhereOptions, fn, col, literal } from 'sequelize';
import BaseRepository from './BaseRepository';
import User, { UserAttributes, UserCreationAttributes } from '../models/User';
import sequelize from '../config/database';

/**
 * Repository class for User model
 * Extends BaseRepository with User-specific query methods
 */
export default class UserRepository extends BaseRepository<User> {
  constructor() {
    super(User);
  }

  /**
   * Find a user by email
   * @param email - Email to search for
   * @returns User instance or null
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  /**
   * Find a user by email and ensure password is included
   * (useful for authentication)
   * @param email - Email to search for
   * @returns User instance or null
   */
  async findByEmailForAuth(email: string): Promise<User | null> {
    return this.findOne(
      { email },
      { attributes: { include: ['password'] } }
    );
  }

  /**
   * Update a user's last login time
   * @param userId - User ID
   * @returns Updated user instance
   */
  async updateLastLogin(userId: number): Promise<User | null> {
    const user = await this.findById(userId);
    if (!user) return null;
    
    user.last_login = new Date();
    await user.save();
    return user;
  }

  /**
   * Find users by role
   * @param role - Role to filter by
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated users with the specified role
   */
  async findByRole(
    role: UserAttributes['role'],
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ rows: User[]; count: number; totalPages: number; currentPage: number }> {
    return this.findPaginated(page, pageSize, {
      where: { role },
      order: [['name', 'ASC']],
    });
  }

  /**
   * Search users by name or email
   * @param query - Search query
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated search results
   */
  async searchUsers(
    query: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ rows: User[]; count: number; totalPages: number; currentPage: number }> {
    const searchQuery = `%${query}%`;
    
    return this.findPaginated(page, pageSize, {
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: searchQuery } },
          { email: { [Op.iLike]: searchQuery } },
        ],
      },
      order: [['name', 'ASC']],
    });
  }

  /**
   * Create a new user with validation
   * @param userData - User data
   * @param transaction - Optional transaction
   * @returns Created user
   */
  async createUser(userData: UserCreationAttributes, transaction?: Transaction): Promise<User> {
    // Email uniqueness validation is handled by the model
    return this.create(userData, transaction);
  }

  /**
   * Change a user's password
   * @param userId - User ID
   * @param newPassword - New password (will be hashed by model hooks)
   * @returns Success indicator
   */
  async changePassword(userId: number, newPassword: string): Promise<boolean> {
    const [affectedRows] = await this.update(userId, {
      password: newPassword,
    });
    
    return affectedRows > 0;
  }

  /**
   * Get active users within a specific period
   * @param days - Number of days to look back
   * @returns User count
   */
  async getActiveUserCount(days: number = 7): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    return this.count({
      where: {
        last_login: {
          [Op.gte]: date,
        },
      },
    });
  }

  /**
   * Get users with upload activity
   * @returns Users with related upload counts
   */
  async getUsersWithUploadCounts(): Promise<User[]> {
    return this.findAll({
      include: [
        {
          association: 'uploadJobs',
          attributes: [],
        },
      ],
      attributes: [
        'id',
        'name',
        'email',
        'role',
        [fn('COUNT', col('uploadJobs.id')), 'uploadCount'],
      ],
      group: ['User.id'],
      order: [[literal('uploadCount'), 'DESC']],
    });
  }
}

// Export a singleton instance
export const userRepository = new UserRepository();
