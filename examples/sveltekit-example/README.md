# Farert WebAssembly SDK - SvelteKit Example

A comprehensive demonstration of the Farert WebAssembly SDK integrated with SvelteKit, showcasing Japanese railway fare calculation capabilities with modern web technologies.

## 🚀 Features

- **Station Search**: Search Japanese railway stations with real-time results
- **Route Planning**: Calculate fares for complex routes with multiple stops
- **Performance Monitoring**: Real-time SDK performance metrics and benchmarking
- **Live Examples**: Interactive code examples with executable demos
- **Comprehensive Documentation**: Complete API reference and guides
- **Responsive Design**: Mobile-friendly interface with modern UI components
- **Type Safety**: Full TypeScript integration with strict type checking

## 🏗️ Architecture

This example demonstrates the integration of the Farert WebAssembly SDK with SvelteKit, featuring:

- **WebAssembly Core**: High-performance C++ railway fare calculation engine
- **TypeScript API Layer**: Type-safe wrapper around WebAssembly functions  
- **Svelte Stores**: Reactive state management for SDK integration
- **SvelteKit Framework**: Server-side rendering and modern web app features
- **Component Architecture**: Reusable UI components with proper separation of concerns

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Modern browser with WebAssembly support
- TypeScript knowledge (recommended)

### Setup

1. **Clone and navigate to the example directory:**
   ```bash
   git clone https://github.com/ntake/farert-wasm.git
   cd farert-wasm/examples/sveltekit-example
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173` to see the application.

## 🎯 Usage Examples

### Basic Station Search

```typescript
import { farertStore, isReady } from '$lib/stores/farert-store';

// Wait for SDK to be ready
$: if ($isReady) {
  searchStations();
}

async function searchStations() {
  try {
    const results = await farertStore.searchStations('東京');
    console.log('Found stations:', results);
  } catch (error) {
    console.error('Search failed:', error);
  }
}
```

### Fare Calculation

```typescript
import { farertStore } from '$lib/stores/farert-store';

async function calculateFare() {
  const route = [
    { stationId: 1130101, stationName: '東京' },
    { stationId: 1130123, stationName: '横浜' }
  ];

  try {
    const result = await farertStore.calculateFare(route);
    console.log(`Fare: ¥${result.fareInfo.fare}`);
    console.log(`Calculation time: ${result.calculationTimeMs}ms`);
  } catch (error) {
    console.error('Calculation failed:', error);
  }
}
```

### Reactive State Management

```svelte
<script>
  import { farertStore, isReady, isLoading, hasError, currentError } from '$lib/stores/farert-store';

  // Reactive statements for different SDK states
  $: if ($isLoading) {
    console.log('SDK is initializing...');
  }

  $: if ($isReady) {
    console.log('SDK is ready for use!');
  }

  $: if ($hasError) {
    console.error('SDK error:', $currentError?.message);
  }
</script>

{#if $isLoading}
  <LoadingSpinner message="Initializing WebAssembly SDK..." />
{:else if $hasError}
  <ErrorMessage error={$currentError} />
{:else if $isReady}
  <StationSearch />
{/if}
```

## 📱 Application Structure

```
src/
├── routes/                 # SvelteKit routes
│   ├── +layout.svelte     # Main application layout
│   ├── +page.svelte       # Homepage with SDK demo
│   ├── stations/          # Station search functionality
│   ├── routes/            # Route planning and fare calculation
│   ├── examples/          # Interactive SDK examples
│   ├── performance/       # Performance monitoring dashboard
│   └── docs/             # Comprehensive documentation
├── lib/
│   ├── components/        # Reusable UI components
│   │   ├── Navigation.svelte
│   │   ├── Footer.svelte
│   │   ├── LoadingOverlay.svelte
│   │   └── ErrorBoundary.svelte
│   └── stores/           # Svelte stores
│       └── farert-store.ts # SDK integration store
├── app.html              # HTML template with Japanese fonts
├── tsconfig.json         # TypeScript configuration
├── svelte.config.js      # SvelteKit configuration
└── vite.config.ts        # Vite configuration
```

## 🔧 Configuration

### SDK Configuration

The SDK can be configured during initialization:

```typescript
await farertStore.initialize({
  enableCache: true,        // Enable result caching
  cacheTimeout: 300000,     // Cache timeout in milliseconds
  debugMode: false,         // Enable debug logging
  autoRetry: true,          // Automatic retry on errors
  maxRetries: 3             // Maximum retry attempts
});
```

### SvelteKit Configuration

Key configuration files:

- **`svelte.config.js`**: SvelteKit and adapter configuration
- **`vite.config.ts`**: Vite build configuration with WebAssembly support
- **`tsconfig.json`**: TypeScript strict mode and path aliases

## 🎨 Styling and Design

The application uses:

- **Custom CSS**: Tailwind-inspired utility classes
- **Component-scoped styles**: Svelte's built-in styling system
- **Responsive design**: Mobile-first approach with grid and flexbox
- **Japanese typography**: Noto Sans JP font for proper Japanese text rendering
- **Dark mode support**: CSS custom properties for theme switching

## 📊 Performance Features

The example includes comprehensive performance monitoring:

- **Real-time metrics**: Operation timing and success rates
- **Interactive benchmarks**: Run performance tests with different scenarios
- **Visual charts**: SVG-based performance visualization
- **Cache analytics**: Hit rates and optimization insights

## 🧪 Testing

Run the development server and navigate to different sections:

1. **Homepage**: Basic SDK demonstration and feature overview
2. **Station Search**: Test station lookup and information display
3. **Route Planning**: Complex route calculation with multiple stops
4. **Examples**: Interactive code examples with live execution
5. **Performance**: Benchmarking and performance analysis tools

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Deployment Options

The application can be deployed to various platforms:

- **Vercel**: Zero-config deployment with `@sveltejs/adapter-vercel`
- **Netlify**: Static site generation with `@sveltejs/adapter-netlify`
- **Node.js**: Server deployment with `@sveltejs/adapter-node`
- **Static hosting**: Pre-rendered static files with `@sveltejs/adapter-static`

## 🔍 Browser Compatibility

**Minimum Requirements:**
- WebAssembly support (all modern browsers)
- ES2020+ JavaScript features
- CSS Grid and Flexbox support

**Tested Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📚 Learning Resources

- **Live Examples**: `/examples` - Interactive code examples
- **API Documentation**: `/docs` - Complete API reference
- **Performance Analysis**: `/performance` - Benchmarking tools
- **Source Code**: Comprehensive comments and TypeScript types

## 🤝 Contributing

This example serves as a reference implementation. To contribute:

1. Fork the main repository
2. Create a feature branch
3. Make your changes with proper TypeScript types
4. Test with the example application
5. Submit a pull request

## 📄 License

This project is licensed under the GPL-3.0 License - see the main repository for details.

## 🔗 Links

- **Main Repository**: [farert-wasm](https://github.com/ntake/farert-wasm)
- **SvelteKit Documentation**: [kit.svelte.dev](https://kit.svelte.dev)
- **TypeScript Guide**: [typescriptlang.org](https://www.typescriptlang.org)
- **WebAssembly**: [webassembly.org](https://webassembly.org)

---

**Built with ❤️ using SvelteKit and WebAssembly**