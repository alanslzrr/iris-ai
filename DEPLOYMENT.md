# Cloud Run Deployment

## Google Console Setup

### 1. Secret Manager
Create these secrets:
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- `SESSION_SECRET` - Random string for sessions
- `NEXTAUTH_URL` - Production domain (e.g., `https://your-app.com`)
- `NEXT_PUBLIC_SITE_URL` - Production domain (e.g., `https://your-app.com`)

### 2. Cloud Build
- Connect GitHub repository
- Use `cloudbuild.yaml` from root directory
- Trigger on push to main branch

### 3. Cloud Run
- **Source**: Continuously deploy from source repository
- **Repository**: Your GitHub repo
- **Build**: Use `cloudbuild.yaml`
- **Service**: `iris-ai`
- **Region**: `us-central1`

### 4. Google OAuth
- Create OAuth 2.0 Client ID for Web application
- **Redirect URIs**: `https://your-domain.com/api/auth/callback/google`
- **JavaScript origins**: `https://your-domain.com`

## Environment Variables
- `NODE_ENV=production`
- `NEXT_TELEMETRY_DISABLED=1`
- `HOSTNAME=0.0.0.0`
- `PORT=3000`

## Secrets (from Secret Manager)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SESSION_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_SITE_URL`

