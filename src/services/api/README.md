
# KisanShaktiAI API Gateway Architecture

## Overview
This directory contains the client-side services for the secure multi-tenant API Gateway architecture. The API Gateway acts as a secure proxy between frontend applications and the Supabase database.

## Architecture Components

### 1. API Client (`ApiClient.ts`)
- Base HTTP client with tenant isolation
- Automatic JWT token management
- Rate limiting and retry logic
- Standardized error handling

### 2. Authentication Service (`AuthApiService.ts`)
- Farmer login/register with mobile + PIN
- JWT token management
- Session validation and refresh
- Logout functionality

### 3. Tenant Service (`TenantApiService.ts`)
- Tenant branding and feature management
- Multi-tenant context switching
- Domain-based tenant detection

### 4. Farmer Service (`FarmerApiService.ts`)
- Profile management
- Land records CRUD
- Financial transactions
- AI chat integration
- Weather data access

### 5. Secure Gateway (`SecureApiGateway.ts`)
- Centralized authentication state
- Secure token storage
- API service orchestration
- Offline/online state management

## Security Features

### Tenant Isolation
- Every API call includes `x-tenant-id` header
- Server-side RLS enforcement
- Tenant-specific rate limiting

### Authentication
- JWT tokens with automatic refresh
- Secure storage using Capacitor Preferences
- No direct Supabase access from frontend

### Rate Limiting
- 1000 requests/hour for farmers
- 5000 requests/hour for tenant admins
- 10000 requests/hour for super admins

## Usage Examples

### Authentication
```typescript
import { useSecureAuth } from '@/hooks/useSecureAuth';

const { login, register, logout, isAuthenticated } = useSecureAuth();

// Login
const result = await login({
  mobile_number: '9876543210',
  pin: '1234',
  tenant_id: 'tenant-uuid'
});

// Register
const result = await register({
  mobile_number: '9876543210',
  pin: '1234',
  farmer_data: {
    name: 'John Farmer',
    village: 'Sample Village'
  }
});
```

### API Calls
```typescript
import { secureApiGateway } from '@/services/SecureApiGateway';

// Get farmer API
const farmerApi = secureApiGateway.getFarmerApi();

// Fetch profile
const profile = await farmerApi.getProfile();

// Update profile
const updated = await farmerApi.updateProfile({
  name: 'Updated Name',
  village: 'New Village'
});

// Manage lands
const lands = await farmerApi.getLands();
const newLand = await farmerApi.createLand({
  land_area_acres: 5.5,
  soil_type: 'loamy',
  village: 'Sample Village'
});
```

## API Gateway Endpoints

### Authentication
- `POST /api/auth/login` - Farmer login
- `POST /api/auth/register` - Farmer registration
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - Logout
- `GET /api/auth/check-farmer/:mobile` - Check if farmer exists

### Tenant Management
- `GET /api/branding/:tenantId` - Get tenant branding
- `GET /api/features/:tenantId` - Get tenant features
- `GET /api/tenant/:id` - Get tenant info
- `GET /api/tenant/slug/:slug` - Get tenant by slug
- `GET /api/tenant/detect?domain=` - Detect tenant by domain

### Farmer APIs
- `GET /api/farmer/profile` - Get farmer profile
- `PUT /api/farmer/profile` - Update farmer profile
- `GET /api/farmer/lands` - Get farmer lands
- `POST /api/farmer/lands` - Create new land
- `PUT /api/farmer/lands/:id` - Update land
- `DELETE /api/farmer/lands/:id` - Delete land
- `GET /api/farmer/transactions` - Get transactions
- `POST /api/farmer/transactions` - Create transaction
- `DELETE /api/farmer/transactions/:id` - Delete transaction
- `POST /api/farmer/chat` - AI chat
- `GET /api/farmer/weather` - Weather data

## Migration Guide

### Phase 1: Setup API Gateway
1. Deploy API Gateway server (Flask/Node.js)
2. Configure environment variables
3. Set up rate limiting and monitoring

### Phase 2: Frontend Migration
1. Replace direct Supabase calls with API Gateway calls
2. Update authentication flow
3. Implement secure token storage

### Phase 3: Security Hardening
1. Remove Supabase anon key from frontend
2. Enable strict tenant isolation
3. Implement comprehensive logging

### Phase 4: Scaling
1. Add Redis caching
2. Implement horizontal scaling
3. Add monitoring and alerting

## Environment Setup

### Development
```bash
# Start local API Gateway
cd api-gateway
npm install
npm run dev
```

### Production
```bash
# Deploy to cloud provider
# Configure domain: api.kisanshaktiai.com
# Set up SSL/TLS certificates
# Configure monitoring
```

## Next Steps
1. Implement the API Gateway server
2. Deploy to production environment
3. Configure monitoring and alerting
4. Implement comprehensive testing
5. Document deployment procedures
