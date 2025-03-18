# Tech Context

## Technologies Used

**Frontend:**

- React.js
- Material-UI
- Axios
- React Query
- React Hook Form
- Redux Toolkit

**Backend:**

- Node.js with Express
- TypeScript
- Sequelize ORM
- JWT (jsonwebtoken)
- Multer
- ExcelJS and CSV-parser
- Winston
- Express-Winston
- Express-Validator
- Bcrypt

**Database:**

- PostgreSQL
- Redis

**Deployment:**

- Docker
- Docker Compose
- Nginx

## Development Setup

- TypeScript for type safety
- ESLint and Prettier for code quality
- Jest for unit testing
- Docker for consistent environments

## Technical Constraints

- On-premises deployment
- Limited server resources (8GB RAM, 4 CPU cores)
- Database size limit (50GB)
- 8-week development timeline

## Dependencies

**Backend Dependencies:**

- express
- winston
- express-winston
- dotenv
- typescript
- eslint
- prettier
- eslint-config-prettier
- jest
- supertest
- @types/express
- @types/jest
- @types/node
- ts-node
- @types/winston
- sequelize
- pg
- pg-hstore
- jsonwebtoken
- multer
- exceljs
- csv-parser
- bcrypt
- express-validator

**Frontend Dependencies:**

- react
- react-dom
- react-router-dom
- @mui/material
- @emotion/react
- @emotion/styled
- @mui/icons-material
- axios
- react-query
- react-hook-form
- yup
- @hookform/resolvers
- react-toastify
- react-loading-overlay
- ag-grid-community
- ag-grid-react
- typescript
- @types/react
- @types/react-dom
- eslint
- prettier
- eslint-config-prettier
- vite
- @vitejs/plugin-react
- @reduxjs/toolkit
- react-redux

## Tech Context Updates

New dependencies:

- swagger-ui-express
- swagger-jsdoc

Updated TypeScript configuration:

- Added resolveJsonModule for JSON imports
- Enabled esModuleInterop for better module compatibility

## Async Handling Strategy

- Express type definitions require void returns for RequestHandlers
- Controllers must use `Promise<void>` return types
- Error handling through `next()` propagation
- Standardized async handler pattern:

```typescript
const wrapAsync = (
  fn: (req: Request, res: Response) => Promise<any>
): RequestHandler => {
  return (req, res, next) => void fn(req, res).catch(next);
};
```

## Type Safety Improvements

- Added strict type checking for route handlers
- Implemented proper error propagation in async functions
- Enhanced type definitions for Express middleware
- Standardized response type handling across controllers

## Async Handling Strategy

- Express type definitions require void returns for RequestHandlers
- Controllers must use `Promise<void>` return types
- Error handling through `next()` propagation
- Approved pattern:

```typescript
const asyncHandler =
  (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
```
