# Deployment Guide

## Prerequisites

- Node.js 20.x or higher
- npm or yarn package manager
- Backend API endpoint (or use mock data for development)

## Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Configure environment variables:**

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your API endpoint:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com/api
```

3. **Run development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production

1. **Create production build:**

```bash
npm run build
```

2. **Start production server:**

```bash
npm start
```

## Docker Deployment (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t los-config-platform .
docker run -p 3000:3000 los-config-platform
```

## Environment Variables

### Required

- `NEXT_PUBLIC_API_BASE_URL`: Backend API base URL

### Optional Feature Flags

- `NEXT_PUBLIC_ENABLE_FLOW_BUILDER`: Enable/disable Flow Builder (default: true)
- `NEXT_PUBLIC_ENABLE_CUSTOM_CODE`: Enable/disable custom code execution (default: true)
- `NEXT_PUBLIC_ENABLE_AUDIT_TRAIL`: Enable/disable audit trail (default: true)
- `NEXT_PUBLIC_ENABLE_IMPORT_EXPORT`: Enable/disable config import/export (default: true)

## Backend Integration

The platform expects the following API endpoints:

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Screen Configs
- `GET /configs/screens` - List all screen configs
- `POST /configs/screens` - Create screen config
- `PUT /configs/screens/:id` - Update screen config
- `POST /configs/screens/:id/activate` - Activate config
- `POST /configs/screens/:id/deprecate` - Deprecate config

### Validation Configs
- `GET /configs/validations/:screenId` - Get validation config
- `POST /configs/validations` - Create validation config
- `PUT /configs/validations/:id` - Update validation config

### Field Mappings
- `GET /mappings` - List all mappings
- `POST /mappings` - Create mapping
- `PUT /mappings/:id` - Update mapping
- `DELETE /mappings/:id` - Delete mapping

### Flow Configs
- `GET /configs/flows` - List all flows
- `POST /configs/flows` - Create flow
- `PUT /configs/flows/:id` - Update flow
- `POST /configs/flows/:id/activate` - Activate flow

### Master Data
- `GET /master-data/partners` - List partners
- `GET /master-data/branches` - List branches
- `GET /master-data/products` - List products
- `GET /master-data/screens` - List screens

## Mock Mode (Development)

The application includes mock data for development. To use it:

1. Keep the API URL pointing to localhost or any unreachable endpoint
2. The app will use mock data from `src/lib/mock-api.ts`
3. Test credentials:
   - Admin: admin@kaleidofin.com / admin123
   - Editor: editor@kaleidofin.com / admin123
   - Viewer: viewer@kaleidofin.com / admin123

## Performance Optimization

### Production Optimizations

1. **Enable caching:**
   - Configure appropriate cache headers on API
   - Use React Query's `staleTime` and `cacheTime`

2. **Enable compression:**
   - Use gzip/brotli compression
   - Configure in Next.js or reverse proxy

3. **CDN Setup:**
   - Serve static assets from CDN
   - Configure `assetPrefix` in `next.config.js`

4. **Database optimization:**
   - Add proper indexes
   - Implement pagination
   - Use connection pooling

## Security Checklist

- [ ] HTTPS enabled
- [ ] JWT tokens with proper expiration
- [ ] CORS configured correctly
- [ ] Rate limiting on API
- [ ] Input validation on backend
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Role-based access control
- [ ] Audit logging enabled

## Monitoring

### Recommended Tools

- **Error Tracking:** Sentry
- **Analytics:** Google Analytics or Mixpanel
- **Performance:** Vercel Analytics or New Relic
- **Uptime:** UptimeRobot or Pingdom

### Health Checks

Add health check endpoint:
- `GET /health` - Application health status

## Troubleshooting

### Build Errors

**Error: Module not found**
```bash
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors**
```bash
npm run type-check
```

### Runtime Issues

**API connection failed**
- Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
- Verify CORS is enabled on backend
- Check network connectivity

**Authentication issues**
- Clear browser localStorage
- Check JWT token expiration
- Verify backend auth endpoint

### Performance Issues

**Slow page loads**
- Enable React Query DevTools
- Check network tab for slow API calls
- Optimize images and assets
- Enable production build optimizations

## Support

For issues or questions:
- Check the README.md
- Review the codebase documentation
- Contact: dev-team@kaleidofin.com

## License

Proprietary - Kaleidofin

