# Farert Svelte Components Showcase

Interactive showcase of Svelte components for Japanese railway fare calculation applications, powered by the Farert WebAssembly SDK.

## 🚀 Live Demo

Visit the live showcase: [https://farert-svelte-components.vercel.app](https://farert-svelte-components.vercel.app) *(Coming Soon)*

## 📋 Overview

This showcase demonstrates the complete set of Svelte components available in the Farert WebAssembly SDK:

- **StationSelector** - Intelligent station search with autocomplete and prefecture filtering
- **RouteBuilder** - Drag-and-drop interface for building complex multi-segment routes
- **FareDisplay** - Comprehensive fare calculation results with discount options
- **LoadingSpinner** - Customizable loading indicators for async operations

## 🏗️ Technology Stack

- **Frontend**: Svelte 4 + SvelteKit + TypeScript
- **Backend**: C++ Core + WebAssembly
- **Database**: SQLite3 + MEMFS (embedded)
- **Styling**: Custom CSS with Tailwind-like utilities
- **Icons**: Lucide Svelte
- **Build**: Vite + Static Adapter
- **Deployment**: Vercel/GitHub Pages ready

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ and npm
- Modern browser with WebAssembly support

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ntake/farert-wasm.git
cd farert-wasm/examples/svelte-components
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Available Scripts

```bash
npm run dev          # Development server with hot reload
npm run build        # Production build for deployment
npm run preview      # Preview production build locally
npm run check        # Type check and validate Svelte components
npm run lint         # Lint code with ESLint
npm run format       # Format code with Prettier
```

## 📁 Project Structure

```
src/
├── routes/
│   ├── +layout.svelte          # Main layout with navigation
│   ├── +page.svelte            # Homepage with feature overview
│   ├── station-selector/       # StationSelector component demo
│   ├── route-builder/          # RouteBuilder component demo
│   ├── fare-display/           # FareDisplay component demo
│   ├── loading-spinner/        # LoadingSpinner component demo
│   └── documentation/          # Documentation and guides
├── lib/                        # Shared components and utilities
├── app.html                    # HTML template
└── app.css                     # Global styles
```

## 🎨 Component Features

### StationSelector
- Fuzzy search with Japanese text support (Kanji/Hiragana/Romaji)
- Prefecture filtering for common station names
- Real-time autocomplete with debouncing
- Accessibility support with keyboard navigation

### RouteBuilder
- Drag-and-drop station reordering
- Dynamic station addition with search
- Visual feedback for route validation
- Undo/redo functionality (planned)

### FareDisplay
- Detailed fare breakdown by segment and line
- Multiple discount options (IC card, senior, disability)
- Alternative route suggestions with cost comparison
- Expandable sections for detailed information

### LoadingSpinner
- Multiple animation styles (spinner, dots, pulse, bars)
- Customizable size, color, and text
- Overlay mode for full-screen loading
- ARIA labels for screen reader support

## 🔧 Configuration

### Path Aliases

The project uses the following path aliases configured in `svelte.config.js`:

```javascript
alias: {
  $components: '../../src/sdk/svelte/components',  // SDK components
  $stores: '../../src/sdk/svelte',                 // Svelte stores
  $lib: './src/lib'                               // Local components
}
```

### TypeScript Configuration

TypeScript is configured with strict mode enabled and proper path mappings in `tsconfig.json`.

### Static Site Generation

The project uses `@sveltejs/adapter-static` for deployment to static hosting platforms:

```javascript
adapter: adapter({
  pages: 'build',
  assets: 'build',
  fallback: 'index.html',
  precompress: false,
  strict: true
})
```

## 🚀 Deployment

### Vercel Deployment

1. Fork/clone the repository
2. Connect your Vercel account
3. Deploy from the `examples/svelte-components` directory
4. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Root Directory**: `examples/svelte-components`

### GitHub Pages Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy the `build` directory to GitHub Pages

### Manual Deployment

The showcase generates static files that can be deployed to any web server:

```bash
npm run build
# Upload the 'build' directory to your web server
```

## 🧪 Testing and Validation

### Component Testing

Run component tests with:
```bash
npm run test
```

### Type Checking

Validate TypeScript types:
```bash
npm run check
```

### Build Validation

Test production build:
```bash
npm run build && npm run preview
```

## 🎯 Usage in Your Projects

### Installation

```bash
npm install @farert/svelte-sdk
```

### Basic Usage

```svelte
<script>
  import { StationSelector, RouteBuilder, FareDisplay } from '@farert/svelte-sdk';
  
  let selectedStation = null;
  let routeSegments = [];
  let fareInfo = null;
</script>

<StationSelector bind:selectedStation />
<RouteBuilder bind:routeSegments />
{#if fareInfo}
  <FareDisplay {fareInfo} showBreakdown={true} />
{/if}
```

### SvelteKit Integration

```javascript
// src/routes/+page.js
import { initializeFarert } from '@farert/svelte-sdk';

export async function load() {
  const sdk = await initializeFarert();
  return {
    sdk
  };
}
```

## 📚 Documentation

- [Component API Reference](./src/routes/documentation/+page.svelte)
- [Integration Guides](https://github.com/ntake/farert-wasm/tree/main/docs)
- [WebAssembly SDK Documentation](../../README.md)

## 🐛 Issues and Support

- **Bug Reports**: [GitHub Issues](https://github.com/ntake/farert-wasm/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/ntake/farert-wasm/discussions)
- **Documentation Issues**: [Create an Issue](https://github.com/ntake/farert-wasm/issues/new)

## 🤝 Contributing

We welcome contributions to improve the component showcase:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests if applicable
5. Commit with conventional commits: `git commit -m 'feat: add amazing feature'`
6. Push to your fork: `git push origin feature/amazing-feature`
7. Create a Pull Request

## 📄 License

This project is licensed under the GPL-3.0 License - see the [LICENSE](../../LICENSE) file for details.

## 🙏 Acknowledgments

- **Svelte Team** - For the amazing reactive framework
- **SvelteKit Team** - For the full-stack framework
- **Lucide** - For the beautiful icon set
- **JR Group** - For providing railway data standards
- **Contributors** - Everyone who has contributed to this project

---

## 📊 Project Status

### ✅ Completed Features

- [x] Project setup with SvelteKit and TypeScript
- [x] Responsive layout with navigation
- [x] StationSelector component demo with interactive search
- [x] RouteBuilder component demo with drag-and-drop
- [x] FareDisplay component demo with detailed breakdown
- [x] LoadingSpinner component demo with multiple styles
- [x] Documentation page with integration guides
- [x] Mobile-responsive design
- [x] Code examples with copy functionality
- [x] Japanese text support with proper fonts

### 🚧 In Development

- [ ] WebAssembly SDK integration
- [ ] Real station data from embedded database
- [ ] Actual fare calculations
- [ ] Component testing suite
- [ ] Performance optimizations
- [ ] Accessibility improvements

### 🎯 Planned Features

- [ ] Interactive tutorials
- [ ] Theme customization
- [ ] Advanced examples
- [ ] TypeScript API reference
- [ ] Video demonstrations
- [ ] Multi-language support

## 🔗 Related Projects

- [Farert WebAssembly Core](../../) - Main WebAssembly SDK
- [SvelteKit Example](../sveltekit-example) - Complete application example
- [React Components](../react-components) - React component library *(Planned)*
- [Vue Components](../vue-components) - Vue component library *(Planned)*

---

**Built with ❤️ for the Japanese railway development community**