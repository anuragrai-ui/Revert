# Revert

CertifyOS Workflow Revert UI — a React-based UI for testing and using the CertifyOS Credentialing Workflow Revert Status APIs. Supports both STG (testing) and Production environments with automatic token fetching.

## Features

- **Environment Selection**: Toggle between STG and Production environments
- **Automatic Token Management**: Fetches access tokens automatically from the CertifyOS platform
- **Workflow Revert Operations**: Support for both Credentialing and Facility workflow reverts
- **cURL Command Generator**: Shows equivalent cURL commands for debugging
- **Error Handling**: User-friendly error messages for common API errors
- **Response Viewer**: Formatted JSON response display with copy functionality

## Prerequisites

- Node.js 18+ and npm
- Access to CertifyOS platform (logged in for token generation)

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

### 1. Select Environment

Choose between STG (Staging) for testing or Production for live operations:
- **STG** (Orange): Use for testing - `https://ng-api-stg.certifyos.com`
- **Production** (Green): Use for live operations - `https://ng-api-production.certifyos.com`

### 2. Fetch Access Token

The application automatically attempts to fetch an access token when you load the page or switch environments. The token comes from:
- STG: `https://ng-web.certifyos.com/api/users/access-token`
- Production: `https://ng.certifyos.com/api/users/access-token`

**Important**: You must be logged into the CertifyOS classic platform in another browser tab for the token to be generated automatically.

Click "Refresh Token" if you encounter authentication errors.

### 3. Revert Workflow Status

Fill in the form:

| Field | Description | Example |
|-------|-------------|---------|
| **Workflow Type** | Select Credentialing or Facility workflow | Credentialing Workflow |
| **Workflow ID** | The ID of the workflow to revert | `abc123-def456` |
| **Organization ID** | Your organization ID (saved automatically) | `org_12345` |
| **Reason** | Required reason for the revert (include TS ticket) | `TS-12345 — reverting per client request` |

### 4. API Endpoints

The application calls these endpoints:

**Credentialing Workflows:**
```
PATCH {baseUrl}/credentialing-workflows/{id}/revert-status
```

**Facility Workflows:**
```
PATCH {baseUrl}/facility-credentialing-workflows/{id}/revert-status
```

### 5. Review Response

After submission, you'll see:
- **Success**: Green response panel with formatted JSON
- **Error**: Red error panel with explanation
- **cURL Command**: The equivalent cURL command for debugging

## API Permissions

### Who Can Revert

| Current Status | Who Can Revert |
|----------------|----------------|
| Not Started → PSV Ready | Regular credentialing users |
| Approved, Denied, Tabled, Committee, Withdrawn/Cancelled | Only Supervisors |

### Restrictions

- Cannot revert if the provider has another active workflow
- Only one step back at a time (hard revert)
- Reason field is mandatory and recorded in audit trail

## Common Errors

| HTTP Code | Meaning | Solution |
|-----------|---------|----------|
| 401 | Unauthorized | Refresh your access token |
| 403 | Forbidden | Only Supervisors can revert certain statuses |
| 404 | Not Found | Verify the workflow ID exists |

## Project Structure

```
src/
├── components/
│   ├── EnvironmentSelector.tsx    # STG/Prod toggle
│   ├── TokenManager.tsx           # Token display & refresh
│   ├── WorkflowRevertForm.tsx   # Main revert form
│   ├── ResponseDisplay.tsx        # Response & cURL viewer
│   └── Layout.tsx                 # Page layout wrapper
├── hooks/
│   ├── useAccessToken.ts          # Token fetching hook
│   └── useWorkflowRevert.ts       # API call hook
├── services/
│   └── api.ts                     # API client & utilities
├── types/
│   └── index.ts                   # TypeScript interfaces
└── App.tsx                        # Main application
```

## Technologies

- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Axios** for HTTP requests
- **Lucide React** for icons

## Security Notes

- Access tokens are stored in memory only (not localStorage)
- Organization ID is optionally saved to localStorage for convenience
- All API calls use HTTPS
- Tokens are valid for 24 hours

## Browser Compatibility

Requires a modern browser with:
- Fetch API support
- ES6+ JavaScript support
- Clipboard API (for copy functionality)

## Troubleshooting

### "No access token received"
- Make sure you are logged into the CertifyOS classic platform
- Check browser console for CORS errors
- Try refreshing the token

### "Unauthorized" errors
- Your token may have expired
- Click "Refresh Token" to get a new one

### "Forbidden" errors
- You may not have Supervisor permissions
- Contact your administrator for elevated access

## Development

```bash
# Run with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

Internal use only - CertifyOS
