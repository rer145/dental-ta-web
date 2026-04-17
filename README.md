# Dental Age Estimation - Web Application

This is a web-based version of the Subadult Dental Age Estimation application, converted from the original Electron desktop app to run in web browsers using Astro.

## Features

- **Multi-language Support**: English (en-US) and Spanish (es) localization
- **Tooth Scoring Interface**: Interactive SVG charts for tooth selection and scoring
- **Data Persistence**: Local storage for settings and case data
- **File Operations**: Import/export case data as .dta files
- **PDF Export**: Print-friendly output via browser print dialog
- **REST API Integration**: Analysis performed via external API (configurable)

## Development

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:4321`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Configuration

### API Endpoint

The analysis API endpoint can be configured in `/public/js/app.js`:

```javascript
const API_ENDPOINT = '/api/analyze'; // Update this to your production API
```

### Localization

Language files are stored in `/public/locales/`:
- `en-US.json` - English translations
- `es.json` - Spanish translations

## Key Differences from Electron Version

1. **No R Integration**: Analysis is performed via REST API instead of local R execution
2. **Browser Storage**: Uses localStorage instead of electron-store
3. **File Handling**: Browser file upload/download instead of native file dialogs
4. **No Menus**: Web navigation instead of native application menus
5. **Print to PDF**: Uses browser print dialog instead of electron PDF generation

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

Same as the original Dental Age Estimation application.