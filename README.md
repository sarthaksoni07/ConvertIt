<div align="center">

# ConvertIt.

**A privacy-first, 100% on-device file processing toolkit built with React 19.**

Your files never leave your browser. No uploads. No servers. No compromises.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite 7](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite)](https://vite.dev)

</div>

---

## Why ConvertIt?

Most file conversion tools upload your documents to remote servers — meaning your private PDFs, photos, and notes pass through infrastructure you don't control. **ConvertIt processes everything locally in your browser using Web Workers**, so your data never touches a network.

- **Zero server round-trips.** Every conversion, compression, and merge happens in-browser via JavaScript.
- **Offline-capable.** Once loaded, the app works without an internet connection.
- **No file size limits imposed by a backend.** You're limited only by your device's memory.

---

## Features

| Feature | What It Does | Under the Hood |
|---|---|---|
| **Image → PDF** | Converts one or many images into a single PDF | `pdf-lib` embeds raster images as full pages inside a Web Worker |
| **PDF → Images** | Extracts every page of a PDF as a high-res PNG | `pdfjs-dist` (Mozilla PDF.js) renders pages onto `OffscreenCanvas` in a Web Worker |
| **Image Compression** | Reduces image file size with a 5-level quality slider | `browser-image-compression` runs inside a dedicated Web Worker |
| **PDF Compression** | Shrinks PDFs by re-rasterising pages at a configurable quality | Each page is rendered → JPEG → re-embedded into a new PDF, all in a Web Worker |
| **PDF Merge** | Combines 2+ PDFs into one document, losslessly | `pdf-lib` copies pages across documents inside a Web Worker |
| **AI Text → PDF** | Converts Markdown / AI chat output into a beautifully formatted PDF | A custom 650-line `PdfBuilder` engine parses Markdown AST tokens and renders them with `pdf-lib` primitives — headings, code blocks, tables, blockquotes, lists, and more |

---

## Architecture at a Glance

```
┌──────────────────────────────────────────────────┐
│                   Browser Tab                     │
│                                                   │
│  ┌─────────────┐   Context    ┌───────────────┐  │
│  │  React UI   │◄────────────►│  Custom Hooks  │  │
│  │  (Views +   │              │  (useCompress, │  │
│  │  Components)│              │   useConvert,  │  │
│  └─────────────┘              │   useMerge)    │  │
│                               └───────┬────────┘  │
│                                       │            │
│                              Dynamic Import        │
│                                       │            │
│                               ┌───────▼────────┐  │
│                               │   Services     │  │
│                               │  (Promise API) │  │
│                               └───────┬────────┘  │
│                                       │            │
│                            postMessage / onmessage │
│                                       │            │
│  ┌────────────────────────────────────▼─────────┐ │
│  │              Web Workers (off main thread)    │ │
│  │  ┌────────────┐ ┌──────────┐ ┌────────────┐  │ │
│  │  │ img.worker │ │pdf.worker│ │merge.worker│  │ │
│  │  └────────────┘ └──────────┘ └────────────┘  │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│         ⚠ NOTHING leaves this box ⚠              │
└──────────────────────────────────────────────────┘
```

Every CPU-intensive operation is offloaded to a **disposable Web Worker** — created on demand and terminated after the result is returned. The main thread stays free for smooth UI interactions, even while processing a 50-page PDF.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| UI Framework | **React 19** | Latest concurrent features, functional components only |
| Routing | **React Router v7** | Nested layout routes for persistent header/results tray |
| Bundler | **Vite 7 + SWC** | Near-instant HMR, native ES module dev server |
| PDF Creation & Editing | **pdf-lib** | Pure JS, zero native dependencies, works in Workers |
| PDF Rendering | **pdfjs-dist** | Mozilla's battle-tested PDF engine, `OffscreenCanvas` support |
| Image Compression | **browser-image-compression** | Client-side, configurable quality, Web Worker compatible |
| Markdown Parsing | **marked** | GFM-compliant tokeniser, feeds the custom PDF renderer |
| Deployment | **Vercel** | Edge CDN, analytics, speed insights out of the box |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** or any package manager

### Installation

```bash
git clone https://github.com/sarthaksoni07/ConvertIt.git
cd ConvertIt
npm install
```

### Development

```bash
npm run dev
```

Opens on `http://localhost:5173` by default.

### Production Build

```bash
npm run build
npm run preview
```

---

## Project Structure

```
src/
├── App/
│   ├── App.jsx              # Route definitions
│   └── AppProviders.jsx     # Context composition root
├── components/
│   ├── Announcement.jsx     # Configurable banner
│   ├── DropZone.jsx         # Full-page drag overlay
│   ├── FileUploader.jsx     # File input + drag-and-drop handler
│   ├── Loading.jsx          # Animated spinner
│   ├── MarkdownInput.jsx    # Textarea + file import for Markdown
│   └── ResultsList.jsx      # Download tray for processed files
├── context/
│   └── AppContext.jsx       # Global state (files, status, results)
├── features/
│   ├── img-compression/     # Image compression service + worker
│   ├── img-to-pdf/          # Image → PDF service + worker
│   ├── mdToPdf/             # Markdown → PDF (custom PdfBuilder engine)
│   ├── merge-pdf/           # PDF merge service + worker
│   ├── pdf/                 # PDF compression service + worker
│   └── pdf-to-img/          # PDF → Image service + worker
├── hooks/
│   ├── useCompression.jsx   # Compression orchestration
│   ├── useConversion.jsx    # Conversion orchestration
│   └── useMerge.jsx         # Merge orchestration
└── views/
    ├── AiToPdf.jsx          # AI Text → PDF page
    ├── Compress.jsx         # Compression page
    ├── Convert.jsx          # Conversion page
    ├── Head.jsx             # Layout shell (header + results)
    ├── Home.jsx             # Feature navigation hub
    ├── Merge.jsx            # PDF merge page
    └── NotFound.jsx         # 404 page
```

---

## How It Works — The Privacy Guarantee

1. **File Selection** — Files are read into the browser's memory via the `File` API. They are stored as in-memory JavaScript objects, never serialised to a server.
2. **Processing** — A Web Worker is spawned with the file data via `postMessage`. The worker performs all heavy computation (parsing, rendering, compressing) using client-side libraries.
3. **Result** — The worker posts back a `Blob`. The UI creates a temporary `URL.createObjectURL` link for download.
4. **Cleanup** — The worker is terminated, the object URL is revoked, and no artefacts remain.

**At no point does any file data leave `window` scope or get written to disk (beyond the user's explicit download).**

---

## Detailed Technical Documentation

For a full architecture audit — component hierarchy, data flow diagrams, hook internals, worker message protocols, and design trade-off analysis — see **[TECHNICAL_AUDIT.md](./TECHNICAL_AUDIT.md)**.

---

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

---

## License

This project is open source. See the repository for license details.