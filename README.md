# Watermarkn't

🖼️ **AI-Powered Watermark Removal Tool**

A fast, intelligent watermark removal service that runs on Cloudflare's edge network using WebAssembly for high-performance image processing.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Test locally
npm run dev

# Deploy to production
npm run deploy
```

**Live at**: `https://watermarknt-worker.your-subdomain.workers.dev`

## ✨ Features

- 🌍 **Global Edge Deployment**: Runs on Cloudflare's network for low latency
- 🧠 **Enhanced Algorithms**: Multiple detection methods (text, edge, frequency domain)
- 📱 **Modern UI**: Clean, responsive interface with drag-and-drop
- ⚡ **Real-time Processing**: Fast WebAssembly-powered image manipulation
- 🔧 **Complete Solution**: Web interface with embedded processing

## 🛠️ Technology Stack

- **Frontend**: HTML5/CSS3/JavaScript with responsive design
- **Backend**: Cloudflare Workers + WebAssembly (Photon library)
- **Image Processing**: Advanced algorithms using Rust/WASM
- **Deployment**: Global edge computing for optimal performance

## 📊 Algorithm Comparison

| Algorithm | Speed | Quality | Best For |
|-----------|-------|---------|----------|
| Basic | ⚡⚡⚡ | ⭐⭐ | Simple watermarks |
| Edge-Preserving | ⚡⚡ | ⭐⭐⭐⭐ | Detailed images |
| Frequency Domain | ⚡ | ⭐⭐⭐⭐⭐ | Complex/transparent overlays |

## 📈 Performance

**Before Enhancement:**
- Basic text detection only
- Single inpainting algorithm
- Visible artifacts in results

**After Enhancement:**
- Multi-method watermark detection
- Advanced inpainting with post-processing
- Significantly improved quality

## 🔧 Usage

1. **Visit** your deployed Worker URL
2. **Upload** an image via drag-and-drop or file picker
3. **Configure** watermark text and algorithm (optional)
4. **Process** and download the cleaned image

## 📝 License

GNU General Public License v3.0 - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

This project focuses on defensive security and image processing research. Contributions for algorithm improvements and performance optimizations are welcome.