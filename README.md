# Radioss 📻

A modern, cross-platform internet radio player built with Tauri, React, and TypeScript.

## 🌟 Features

- **🎵 Radio Player**: Stream internet radio stations in high quality
- **🌍 International Stations**: Pre-configured stations from Germany, UK, and other countries
- **⭐ Favorites**: Save your favorite stations in a personal library
- **➕ Custom Stations**: Add your own radio stations
- **🔍 Smart Search**: Search stations by name, country, or music genre
- **🎛️ Audio Controls**: Volume control, Play/Pause, Previous/Next
- **🖥️ Native Desktop App**: Runs natively on Windows, macOS, and Linux
- **📱 Modern UI**: Sleek, responsive design with dark theme
- **🔄 Auto-Updates**: Automatic updates for new features

## 🏷️ Supported Music Genres

- Pop, Rock, Electronic, Dance
- Hip-Hop, Metal, Classic Rock
- News, Culture, Information
- Local/Regional Stations

## 🚀 Installation

### Pre-built Releases (Recommended)

Download the latest version for your operating system:

📥 [Releases on GitHub](https://github.com/DasCanard/radioss/releases)

**Windows**: `.exe` or `.msi` installer
**macOS**: `.dmg` disk image  
**Linux**: `.AppImage`, `.deb`, or `.rpm`

### Building from Source

#### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Rust](https://rustup.rs/) (for Tauri)
- [Git](https://git-scm.com/)

#### Build Steps

```bash
# Clone repository
git clone https://github.com/DasCanard/radioss.git
cd radioss

# Install dependencies
npm install

# Start development version
npm run tauri dev

# Build production version
npm run tauri build
```

## 🎮 Usage

### Getting Started

1. **Browse Stations**: Use the "Browse" tab to see all available stations
2. **Play Station**: Click on a station to start playing
3. **Add Favorites**: Click the heart icon to add stations to your favorites
4. **Library**: Switch to the "Library" tab to manage your favorites

### Adding Custom Stations

1. Click the "Add Station" button
2. Enter the station details:
   - **Name**: Display name of the station
   - **Stream URL**: Direct URL to the audio stream
   - **Country**: Country of origin (optional)
   - **Language**: Station language (optional)
   - **Tags**: Music genres, separated by commas (optional)
3. Click "Add Station"

## 🛠️ Development

### Development Server

```bash
# Frontend + Backend together
npm run tauri dev

# Frontend only (for UI development)
npm run dev
```

### Build Commands

```bash
# Development version
npm run tauri dev

# Build production version
npm run tauri build

# Compile frontend
npm run build

# Preview compiled version
npm run preview
```

## 📝 License

This project is licensed under the [MIT License](LICENSE).

---

**Enjoy your favorite music with Radioss! 🎵**
