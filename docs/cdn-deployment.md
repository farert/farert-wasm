# CDN Deployment Guide

This guide covers how to deploy the farert-wasm SDK to various CDN providers for global distribution.

## 📋 Pre-deployment Checklist

- [ ] Package built successfully (`npm run build:sdk:prod`)
- [ ] All tests passing (`npm run test:integration:full-stack`)
- [ ] Version updated in `package.json`
- [ ] Documentation updated
- [ ] npm package published

## 🌐 CDN Provider Options

### 1. unpkg.com (Automatic from npm)

unpkg automatically serves any published npm package. No additional configuration needed.

**Usage Examples:**

```html
<!-- Core SDK -->
<script src="https://unpkg.com/farert-wasm@2.0.0/dist/sdk/index.umd.js"></script>

<!-- Svelte Integration -->
<script src="https://unpkg.com/farert-wasm@2.0.0/dist/sdk/frameworks/svelte.umd.js"></script>

<!-- React Integration -->
<script src="https://unpkg.com/farert-wasm@2.0.0/dist/sdk/frameworks/react.umd.js"></script>

<!-- Vue Integration -->
<script src="https://unpkg.com/farert-wasm@2.0.0/dist/sdk/frameworks/vue.umd.js"></script>

<!-- WebAssembly Module -->
<script src="https://unpkg.com/farert-wasm@2.0.0/dist/farert.js"></script>
```

**Versioning:**
- Latest: `https://unpkg.com/farert-wasm/dist/sdk/index.umd.js`
- Specific: `https://unpkg.com/farert-wasm@2.0.0/dist/sdk/index.umd.js`
- Major: `https://unpkg.com/farert-wasm@2/dist/sdk/index.umd.js`

### 2. jsDelivr (Automatic from npm)

jsDelivr provides automatic CDN distribution from npm with advanced features.

**Usage Examples:**

```html
<!-- Core SDK with automatic minification -->
<script src="https://cdn.jsdelivr.net/npm/farert-wasm@2.0.0/dist/sdk/index.umd.js"></script>

<!-- Combine multiple files -->
<script src="https://cdn.jsdelivr.net/combine/npm/farert-wasm@2.0.0/dist/farert.js,npm/farert-wasm@2.0.0/dist/sdk/index.umd.js"></script>

<!-- Framework-specific -->
<script src="https://cdn.jsdelivr.net/npm/farert-wasm@2.0.0/dist/sdk/frameworks/svelte.umd.js"></script>
```

**Advanced Features:**
- Auto-minification: Add `/min` before the filename
- ESM support: `https://cdn.jsdelivr.net/npm/farert-wasm@2.0.0/dist/sdk/index.esm.js`
- Package info: `https://cdn.jsdelivr.net/npm/farert-wasm@2.0.0/package.json`

### 3. Custom CDN Setup

For enterprise deployments or custom requirements.

#### AWS CloudFront Setup

1. **Create S3 Bucket:**

```bash
aws s3 mb s3://farert-wasm-cdn --region us-east-1
```

2. **Upload Build Artifacts:**

```bash
# Build the SDK
npm run build:sdk:prod

# Upload to S3 with versioning
aws s3 sync dist/ s3://farert-wasm-cdn/v2.0.0/ \
  --acl public-read \
  --cache-control "public, max-age=31536000"

# Create latest symlink
aws s3 cp s3://farert-wasm-cdn/v2.0.0/sdk/index.umd.js \
  s3://farert-wasm-cdn/latest/sdk/index.umd.js \
  --acl public-read
```

3. **CloudFront Distribution:**

```json
{
  "Comment": "Farert-WASM SDK CDN Distribution",
  "DefaultRootObject": "index.html",
  "Origins": [{
    "DomainName": "farert-wasm-cdn.s3.amazonaws.com",
    "Id": "S3-farert-wasm-cdn",
    "S3OriginConfig": {
      "OriginAccessIdentity": ""
    }
  }],
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-farert-wasm-cdn",
    "ViewerProtocolPolicy": "redirect-to-https",
    "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
    "Compress": true
  },
  "Enabled": true,
  "PriceClass": "PriceClass_All"
}
```

4. **Usage:**

```html
<script src="https://d1234567890.cloudfront.net/v2.0.0/sdk/index.umd.js"></script>
<script src="https://d1234567890.cloudfront.net/latest/sdk/index.umd.js"></script>
```

#### Azure CDN Setup

1. **Create Storage Account:**

```bash
az storage account create \
  --name farertwasmstorage \
  --resource-group farert-rg \
  --location eastus \
  --sku Standard_LRS
```

2. **Upload Files:**

```bash
# Get storage account key
STORAGE_KEY=$(az storage account keys list \
  --account-name farertwasmstorage \
  --resource-group farert-rg \
  --query '[0].value' -o tsv)

# Create container
az storage container create \
  --name sdk \
  --account-name farertwasmstorage \
  --account-key $STORAGE_KEY \
  --public-access blob

# Upload files
az storage blob upload-batch \
  --source dist/ \
  --destination sdk/v2.0.0 \
  --account-name farertwasmstorage \
  --account-key $STORAGE_KEY
```

3. **Create CDN Profile and Endpoint:**

```bash
az cdn profile create \
  --name farert-wasm-cdn \
  --resource-group farert-rg \
  --sku Standard_Microsoft

az cdn endpoint create \
  --name farert-wasm \
  --profile-name farert-wasm-cdn \
  --resource-group farert-rg \
  --origin farertwasmstorage.blob.core.windows.net
```

## 🔧 CDN Configuration Best Practices

### Cache Headers Configuration

For optimal performance, configure these cache headers:

```nginx
# Static assets (JS, CSS, WASM)
location ~* \.(js|css|wasm)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin "*";
}

# Version-specific files (never change)
location ~* /v\d+\.\d+\.\d+/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Latest files (short cache)
location ~* /latest/ {
    expires 5m;
    add_header Cache-Control "public, max-age=300";
}
```

### CORS Configuration

Enable CORS for cross-origin requests:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration>
    <CORSRule>
        <AllowedOrigin>*</AllowedOrigin>
        <AllowedMethod>GET</AllowedMethod>
        <AllowedMethod>HEAD</AllowedMethod>
        <AllowedHeader>*</AllowedHeader>
        <MaxAgeSeconds>86400</MaxAgeSeconds>
    </CORSRule>
</CORSConfiguration>
```

### Security Headers

Add security headers for production:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

## 🎯 Framework-Specific CDN Usage

### Svelte/SvelteKit

```html
<!-- In app.html -->
<script src="https://unpkg.com/farert-wasm@2/dist/sdk/frameworks/svelte.umd.js"></script>
<script>
  window.FarertWasm.initializeSvelte({
    wasmUrl: 'https://unpkg.com/farert-wasm@2/dist/farert.wasm'
  });
</script>
```

### React

```html
<!-- In index.html -->
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/farert-wasm@2/dist/sdk/frameworks/react.umd.js"></script>
```

### Vue

```html
<!-- In index.html -->
<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
<script src="https://unpkg.com/farert-wasm@2/dist/sdk/frameworks/vue.umd.js"></script>
```

### Vanilla JavaScript

```html
<script src="https://unpkg.com/farert-wasm@2/dist/sdk/index.umd.js"></script>
<script>
  window.FarertWasm.initialize({
    wasmUrl: 'https://unpkg.com/farert-wasm@2/dist/farert.wasm'
  }).then(api => {
    // Use the API
    const stationId = api.getStationId('東京');
    console.log('Tokyo Station ID:', stationId);
  });
</script>
```

## 🚀 Deployment Automation

### GitHub Actions for CDN Deployment

Create `.github/workflows/cdn-deploy.yml`:

```yaml
name: Deploy to CDN

on:
  release:
    types: [published]
  workflow_dispatch:

jobs:
  deploy-cdn:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build SDK
        run: npm run build:sdk:prod
      
      - name: Deploy to AWS S3
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          VERSION=$(node -p "require('./package.json').version")
          aws s3 sync dist/ s3://farert-wasm-cdn/v$VERSION/ \
            --acl public-read \
            --cache-control "public, max-age=31536000"
          
          # Update latest
          aws s3 sync dist/ s3://farert-wasm-cdn/latest/ \
            --acl public-read \
            --cache-control "public, max-age=300"
      
      - name: Invalidate CloudFront
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/latest/*"
```

### npm Script for CDN Deployment

Add to `package.json`:

```json
{
  "scripts": {
    "deploy:cdn": "npm run build:sdk:prod && node scripts/deploy-cdn.js",
    "deploy:cdn:staging": "npm run build:sdk:prod && node scripts/deploy-cdn.js --staging"
  }
}
```

Create `scripts/deploy-cdn.js`:

```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const { readFileSync } = require('fs');
const path = require('path');

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const version = pkg.version;
const isStaging = process.argv.includes('--staging');

const bucket = isStaging ? 'farert-wasm-cdn-staging' : 'farert-wasm-cdn';
const distributionId = isStaging 
  ? process.env.CLOUDFRONT_STAGING_DISTRIBUTION_ID 
  : process.env.CLOUDFRONT_DISTRIBUTION_ID;

console.log(`🚀 Deploying farert-wasm v${version} to ${bucket}...`);

try {
  // Upload versioned files
  execSync(`aws s3 sync dist/ s3://${bucket}/v${version}/ --acl public-read --cache-control "public, max-age=31536000"`, {
    stdio: 'inherit'
  });

  if (!isStaging) {
    // Update latest (production only)
    execSync(`aws s3 sync dist/ s3://${bucket}/latest/ --acl public-read --cache-control "public, max-age=300"`, {
      stdio: 'inherit'
    });

    // Invalidate CloudFront
    if (distributionId) {
      execSync(`aws cloudfront create-invalidation --distribution-id ${distributionId} --paths "/latest/*"`, {
        stdio: 'inherit'
      });
    }
  }

  console.log('✅ CDN deployment completed successfully!');
  
  console.log('\n📋 CDN URLs:');
  console.log(`   Versioned: https://d1234567890.cloudfront.net/v${version}/sdk/index.umd.js`);
  if (!isStaging) {
    console.log(`   Latest: https://d1234567890.cloudfront.net/latest/sdk/index.umd.js`);
  }

} catch (error) {
  console.error('❌ CDN deployment failed:', error.message);
  process.exit(1);
}
```

## 📊 CDN Monitoring and Analytics

### Performance Monitoring

1. **Real User Monitoring (RUM):**

```javascript
// Add to CDN-served files
window.FarertWasm.onLoad = function(loadTime) {
  // Send metrics to your analytics service
  analytics.track('SDK_Load_Time', {
    version: '2.0.0',
    loadTime: loadTime,
    userAgent: navigator.userAgent,
    timestamp: Date.now()
  });
};
```

2. **Error Tracking:**

```javascript
window.FarertWasm.onError = function(error) {
  // Send error metrics
  analytics.track('SDK_Error', {
    version: '2.0.0',
    error: error.message,
    stack: error.stack,
    timestamp: Date.now()
  });
};
```

### Usage Analytics

Track CDN usage patterns:

```javascript
// Add to your analytics dashboard
const trackCDNUsage = () => {
  // Track which CDN is being used
  const cdnProvider = detectCDNProvider(document.currentScript.src);
  
  analytics.track('CDN_Usage', {
    provider: cdnProvider,
    version: window.FarertWasm.version,
    framework: detectFramework(),
    timestamp: Date.now()
  });
};

function detectCDNProvider(url) {
  if (url.includes('unpkg.com')) return 'unpkg';
  if (url.includes('jsdelivr.net')) return 'jsdelivr';
  if (url.includes('cloudfront.net')) return 'cloudfront';
  return 'custom';
}
```

## 🔍 Testing CDN Deployment

### Automated CDN Testing

Create `scripts/test-cdn.js`:

```javascript
#!/usr/bin/env node

const https = require('https');
const { performance } = require('perf_hooks');

const CDN_URLS = [
  'https://unpkg.com/farert-wasm@2/dist/sdk/index.umd.js',
  'https://cdn.jsdelivr.net/npm/farert-wasm@2/dist/sdk/index.umd.js',
  'https://d1234567890.cloudfront.net/latest/sdk/index.umd.js'
];

async function testCDNUrl(url) {
  return new Promise((resolve) => {
    const start = performance.now();
    
    const req = https.get(url, (res) => {
      const end = performance.now();
      const loadTime = Math.round(end - start);
      
      resolve({
        url,
        status: res.statusCode,
        loadTime,
        contentLength: res.headers['content-length'],
        success: res.statusCode === 200
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url,
        status: 0,
        loadTime: 0,
        error: error.message,
        success: false
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        url,
        status: 0,
        loadTime: 10000,
        error: 'Timeout',
        success: false
      });
    });
  });
}

async function testAllCDNs() {
  console.log('🧪 Testing CDN deployments...\n');
  
  for (const url of CDN_URLS) {
    const result = await testCDNUrl(url);
    
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${new URL(url).hostname}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Load Time: ${result.loadTime}ms`);
    if (result.contentLength) {
      console.log(`   Size: ${Math.round(result.contentLength / 1024)}KB`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log();
  }
}

testAllCDNs();
```

Add to `package.json`:

```json
{
  "scripts": {
    "test:cdn": "node scripts/test-cdn.js"
  }
}
```

## 🎯 Best Practices Summary

1. **Version Management:**
   - Always use semantic versioning
   - Maintain versioned CDN URLs for stability
   - Provide latest URLs for development

2. **Performance:**
   - Enable compression and caching
   - Use HTTP/2 for better performance
   - Monitor load times and availability

3. **Security:**
   - Implement proper CORS headers
   - Use HTTPS everywhere
   - Add security headers for protection

4. **Reliability:**
   - Use multiple CDN providers for redundancy
   - Implement proper error handling
   - Monitor uptime and performance

5. **Monitoring:**
   - Track usage patterns and errors
   - Set up alerts for deployment failures
   - Monitor load times across regions

This completes the CDN deployment guide for the farert-wasm SDK.