# ConvertIt — Technical Audit Report

> A comprehensive architecture review and data-flow analysis of the ConvertIt codebase.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [The Lifecycle of a Request](#2-the-lifecycle-of-a-request)
3. [Component Hierarchy & Interaction](#3-component-hierarchy--interaction)
4. [Data Flow Analysis](#4-data-flow-analysis)
5. [Hook & Logic Breakdown](#5-hook--logic-breakdown)
6. [Summary of Architectural Trade-Offs](#6-summary-of-architectural-trade-offs)

---

## 1. Architecture Overview

### Design Pattern: Feature-Sliced Component-Based Architecture with a Service/Worker Offloading Model

ConvertIt does not follow a classical MVC or Flux pattern. Instead, it employs a pragmatic three-tier design:

| Tier | Role | Examples |
|---|---|---|
| **Presentation** (Views + Components) | Route-level pages and reusable UI primitives. Stateless where possible; delegates all processing logic. | `Convert`, `Compress`, `FileUploader`, `Loading` |
| **Orchestration** (Custom Hooks) | Encapsulate multi-step workflows, read/write global state, and dynamically import the correct service. Act as the *controller* between UI and processing. | `useConversion`, `useCompression`, `useMerge` |
| **Processing** (Services + Web Workers) | CPU-intensive work (PDF parsing, image compression, merging) is wrapped in a **Service → Worker** pair. The service creates a disposable `Worker`, posts a message, and returns a `Promise`. | `img.service → img.worker`, `pdf.service → pdf.worker` |

### Why This Architecture?

- **Thread isolation via Web Workers.** Every heavy operation (image compression via `browser-image-compression`, PDF rasterisation via `pdfjs-dist`, PDF assembly via `pdf-lib`) runs off the main thread. This keeps the UI responsive — the "100% on-device processing" promise would be meaningless if the UI froze during a 20-page PDF compression.
- **Dynamic imports at the hook level.** Feature modules are lazily loaded (`await import(...)`) only when the user actually triggers a conversion/compression, keeping the initial bundle lean.
- **Single-context global state.** A lightweight React Context replaces heavier state libraries. Given the app's scope (no auth, no server state, no caching layer), Context + `useState` is the appropriate weight class; Redux or Zustand would be over-engineering.

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 (functional components, hooks only) |
| Router | React Router v7 (nested layout routes) |
| Bundler | Vite 7 with `@vitejs/plugin-react-swc` (SWC for fast JSX transforms) |
| PDF Generation | `pdf-lib` (creating/modifying PDFs in pure JS, no server) |
| PDF Parsing | `pdfjs-dist` (Mozilla's PDF.js — renders existing PDFs to canvas) |
| Image Compression | `browser-image-compression` (client-side lossy/lossless compression) |
| Markdown Parsing | `marked` (GFM tokeniser — feeds the custom `PdfBuilder` renderer) |
| Deployment | Vercel (with `@vercel/analytics` and `@vercel/speed-insights`) |
| Styling | Vanilla CSS with CSS custom properties (dark-theme, Sora/Inter font stack) |

---

## 2. The Lifecycle of a Request

Below is a traced walkthrough of the **"Compress an image"** flow, representative of every feature in the app.

```
User clicks "Browse Files"
        │
        ▼
┌─── FileUploader ────────────────────────────┐
│  handleFiles(fileList)                       │
│    → setFiles([...])          (context)      │
│    → setStatus("ready")       (context)      │
└──────────────────────────────────────────────┘
        │
        ▼
  Compress view re-renders (status === "ready")
  → Shows compression slider + "Start Compression" button
        │
        ▼
  User clicks "Start Compression"
        │
        ▼
┌─── useCompression hook ─────────────────────┐
│ 1. Validate files (image? pdf?)             │
│ 2. Dynamic import: img.service or           │
│    pdf.service (only loads the needed module)│
│ 3. setStatus("compressing"); setProgress(0) │
│ 4. Loop over files:                         │
│    ┌───────────────────────────────────┐     │
│    │  compressImage(file, level)       │     │
│    │    → spawns img.worker            │     │
│    │    → worker receives File +       │     │
│    │      compression opts             │     │
│    │    → runs browser-image-          │     │
│    │      compression inside worker    │     │
│    │    → posts back { blob, sizes }   │     │
│    │    → service resolves Promise     │     │
│    └───────────────────────────────────┘     │
│ 5. setResults(prev => [...prev, result])    │
│ 6. setProgress(percent)                     │
│ 7. After all files: setStatus("done")       │
└─────────────────────────────────────────────┘
        │
        ▼
  Context update triggers re-render cascade:
  • Compress view: shows "✅ Compression Complete!"
  • ResultsList (in Header layout): renders download links
        │
        ▼
  User clicks "Download" on a result
        │
        ▼
┌─── ResultsList ──────────────────────────────┐
│  downloadFile(blob, name)                    │
│    → URL.createObjectURL(blob)               │
│    → programmatic <a> click                  │
│    → revokeObjectURL after 100ms             │
└──────────────────────────────────────────────┘
```

### Key Design Decisions in This Flow

- **Workers are disposable.** Each call creates a fresh `new Worker(...)` and `terminate()`s it after the result arrives. This avoids worker lifecycle management complexity and memory leaks, at the cost of a small per-invocation setup overhead — an acceptable trade-off for a tool that processes files in batches, not continuously.
- **Progress is file-granular (hook level) or page-granular (worker level).** The hooks compute `Math.round(((i+1)/total)*100)` per file, while PDF workers emit per-page progress. These are unified through the shared `setProgress` setter.
- **Cleanup on unmount.** Every view's `useEffect` return resets `status`, `convert`, and `files` to `"idle"` / `[]`. This prevents stale state from bleeding across route navigations.

---

## 3. Component Hierarchy & Interaction

### Tree

```
<React.StrictMode>
└── <AppProviders>                         ← Context boundary
    └── <BrowserRouter>                    ← Routing boundary
        └── <App>                          ← Route definitions
            ├── <Header>    (layout route) ← Persistent chrome
            │   ├── <Announcement>         ← Banner from context
            │   ├── <Outlet />             ← Renders child route ↓
            │   │   ├── <Home />
            │   │   ├── <Convert />
            │   │   │   ├── <DropZone />
            │   │   │   ├── <FileUploader />
            │   │   │   └── <Loading />
            │   │   ├── <Compress />
            │   │   │   ├── <DropZone />
            │   │   │   ├── <FileUploader />
            │   │   │   └── <Loading />
            │   │   ├── <AiToPdf />
            │   │   │   ├── <DropZone />
            │   │   │   └── <MarkdownInput />
            │   │   │       └── <Loading />
            │   │   └── <Merge />
            │   │       ├── <DropZone />
            │   │       ├── <FileUploader />
            │   │       └── <Loading />
            │   └── <ResultsList />         ← Persistent, below Outlet
            ├── <Analytics />               ← Vercel telemetry (invisible)
            └── <SpeedInsights />           ← Vercel perf (invisible)
```

### Per-Component Breakdown

#### `AppProviders`

- **Responsibility:** Composition root for all context providers. Currently wraps only `AppProvider`, but the indirection exists as an extension point for future providers (e.g., theme, auth).
- **Props:** `children` (React node tree).
- **State:** None (pure passthrough).
- **Side Effects:** None.

#### `Header` (Head.jsx)

- **Responsibility:** Persistent layout shell — branding, announcement toggle, and the `<ResultsList />` download area. Uses React Router's `<Outlet />` to render the active child route.
- **Props:** None (layout route).
- **State:** `show` (`boolean`) — toggles announcement visibility.
- **Side Effects:** None. The `show` state is purely local; no `useEffect`.
- **Why here?** Placing `<ResultsList />` in the layout rather than individual views means processed files persist across route navigations within a session, giving users a consistent download tray.

#### `Home` (Home.jsx)

- **Responsibility:** Navigation hub. Four cards routing to the four features.
- **Props:** None.
- **State:** None.
- **Side Effects:** None. Uses `useNavigate()` imperatively on click.

#### `Convert` (Convert.jsx)

- **Responsibility:** Orchestrates the image→PDF / PDF→image conversion workflow.
- **Props:** None.
- **State (from context):** `files`, `status`, `progress`, `convert`.
- **Side Effects:** `useEffect` cleanup on unmount resets `status → "idle"`, `convert → "idle"`, `files → []`. This ensures navigating away mid-operation doesn't leave stale global state.
- **Hooks used:** `useConversion()` → exposes `startConversion`.

#### `Compress` (Compress.jsx)

- **Responsibility:** Image and PDF compression with a quality slider.
- **Props:** None.
- **State (from context):** `files`, `status`, `progress`, `convert`, `compressionLevel`.
- **Side Effects:** Same unmount cleanup pattern as `Convert`.
- **Hooks used:** `useCompression()` → exposes `startCompression`.
- **Notable:** Uses `compressionLevel` (1–5 range slider) which is passed down to the workers to control output quality/size trade-off.

#### `AiToPdf` (AiToPdf.jsx)

- **Responsibility:** Markdown/AI-text to PDF conversion entry point.
- **Props:** None.
- **State (from context):** `setConvert`, `setFiles` (for cleanup only).
- **Side Effects:** Unmount cleanup resets `convert` and `files`.
- **Why no custom hook?** The conversion logic is entirely self-contained inside `<MarkdownInput />`, which calls `convertMdToPdf()` directly. The operation runs on the main thread via `pdf-lib` and doesn't need a worker.

#### `Merge` (Merge.jsx)

- **Responsibility:** PDF merge workflow (≥2 PDFs → 1 merged PDF).
- **Props:** None.
- **State (from context):** `files`, `status`, `progress`, `convert`.
- **Side Effects:** Unmount cleanup.
- **Hooks used:** `useMerge()` → exposes `startMerge`.

#### `FileUploader` (FileUploader.jsx)

- **Responsibility:** File input + global drag-and-drop handler. Converts `FileList` into a state array.
- **Props:** `accept` (string — file type filter, e.g., `".pdf,.jpg,.jpeg,.png"`).
- **State:** None (writes directly to context).
- **Side Effects:** `useEffect` registers `dragover` and `drop` listeners on `document` (global). Cleaned up on unmount.

#### `DropZone` (DropZone.jsx)

- **Responsibility:** Full-page drag overlay. Purely visual — shows "Drop Files Here" when files are dragged over the window.
- **Props:** None.
- **State:** `isDragging` (local `boolean`) backed by a `dragCounter` ref pattern to handle nested `dragenter`/`dragleave` events correctly.
- **Side Effects:** `useEffect` registers four drag event listeners on `document`. Returns `null` when not dragging (conditional rendering).

#### `MarkdownInput` (MarkdownInput.jsx)

- **Responsibility:** Textarea for pasting markdown, file import for `.md`/`.txt`, and direct invocation of `convertMdToPdf`.
- **Props:** None.
- **State (local):** `markdown` (string), `fileName` (string).
- **State (from context):** `status`, `setStatus`, `setResults`.
- **Side Effects:** `useEffect` for drag-and-drop of `.md`/`.txt` files. `handleConvert` is an async event handler (not a `useEffect`).

#### `ResultsList` (ResultsList.jsx)

- **Responsibility:** Renders the list of processed files with download buttons. Displays original→compressed sizes when available.
- **Props:** None.
- **State (from context):** `results` (read-only).
- **Side Effects:** None. Download triggered imperatively via `downloadFile()` using `URL.createObjectURL` + programmatic anchor click.

#### `Announcement` (Announcement.jsx)

- **Responsibility:** Displays configurable banner messages from context.
- **Props:** None.
- **State (from context):** `announcement` (read-only).
- **Side Effects:** None.

#### `Loading` (Loading.jsx)

- **Responsibility:** Pure presentational spinner (three animated ring divs).
- **Props:** None.
- **State:** None.
- **Side Effects:** None.

---

## 4. Data Flow Analysis

### Global State Shape (single `AppContext`)

```javascript
{
  files:             File[],        // Selected files for current operation
  status:            string,        // "idle" | "ready" | "compressing" | "converting" | "done" | "failed"
  progress:          number,        // 0–100 percentage
  convert:           string,        // "idle" | "converting" | "done" | "failed"  (parallel status track)
  results:           ResultObject[],// Accumulated processed outputs
  compressionLevel:  number,        // 1–5 slider value
  announcement:      object,        // { message, message1, enabled }
}
```

### Flow Topology

```
AppProvider (single source of truth)
     │
     ├──→ Header
     │       └──→ Announcement   (reads: announcement)
     │       └──→ ResultsList    (reads: results)
     │
     ├──→ Convert / Compress / Merge views
     │       ├── reads: files, status, progress, convert, compressionLevel
     │       ├── writes: setStatus, setConvert, setFiles, setCompressionLevel
     │       └── via hooks → writes: setProgress, setResults
     │
     ├──→ FileUploader           (writes: setFiles, setStatus)
     │
     └──→ MarkdownInput          (reads: status; writes: setStatus, setResults)
```

**No prop-drilling exists.** Every component that needs shared state accesses it directly through `useAppContext()`. This is a conscious trade-off:

- **Advantage:** Adding a new view or component requires zero plumbing — just call the hook.
- **Risk:** All consumers re-render on *any* context value change, because the provider exposes a single object. At the current scale (~6 consumers, low-frequency updates), this is negligible. If the app grew significantly, splitting the context (e.g., `FilesContext`, `StatusContext`, `ResultsContext`) or adopting `useSyncExternalStore` would mitigate unnecessary re-renders.

**Dual-status pattern (`status` vs `convert`):** Two separate status strings exist because `Compress` uses `status` while `Convert`/`Merge` use `convert`. This is a pragmatic but inconsistent design — both represent the same finite state machine. A unified status enum or a reducer would be more maintainable.

---

## 5. Hook & Logic Breakdown

### `useConversion()` — `src/hooks/useConversion.jsx`

**Purpose:** Orchestrates bidirectional file conversion — images→PDF and PDF→images — in a single workflow.

**Logic:**

1. **File classification:** Iterates all files, tagging each as `image/*` or `application/pdf`. Rejects anything else immediately (`setConvert("failed")`).
2. **Conditional dynamic imports:** Only loads the service module actually needed:
   - `hasImages → import("../features/img-to-pdf/imgToPdf.service")`
   - `hasPdfs → import("../features/pdf-to-img/pdfToImg.service")`
   
   These modules pull in heavy dependencies (`pdf-lib`, `pdfjs-dist`). Lazy loading keeps the initial bundle under control.
3. **Image batch → single PDF:** All images are sent to `convertImgToPdf` as an array. The worker creates one `PDFDocument`, adds each image as a full-page, and returns a combined PDF.
4. **PDF batch → per-file images:** Each PDF is individually sent to `convertPdfToImg`, which returns an array of per-page image blobs. These are normalized into the results format.
5. **Progress:** Reported per-PDF (not per-page) at the hook level.

**Return value:** `{ startConversion }` — a single async function bound to context state.

---

### `useCompression()` — `src/hooks/useCompression.jsx`

**Purpose:** Compresses images and PDFs in a unified sequential loop.

**Logic:**

1. **Same validation + dynamic import pattern** as `useConversion`.
2. **Sequential per-file processing:** Files are compressed one at a time in a `for` loop. This is intentional — Web Workers already parallelize internally, and spawning N workers simultaneously could overwhelm memory for large files.
3. **`compressionLevel` pass-through:** The context value (1–5) is forwarded to the service, which translates it into library-specific options:
   - **Images:** `maxSizeMB = level`, `maxWidthOrHeight = level * 860`, `initialQuality = level` (via `browser-image-compression`).
   - **PDFs:** Mapped to `{ scale, quality }` pairs (e.g., level 1 → scale 1.5 / quality 0.5, level 5 → scale 2.0 / quality 1.0). The PDF worker rasterizes each page to JPEG at the given scale, then re-embeds into a new PDF — a "lossy recompression" that trades text fidelity for dramatic size reduction.

**Return value:** `{ startCompression }`.

---

### `useMerge()` — `src/hooks/useMerge.jsx`

**Purpose:** Merges two or more PDFs into a single document.

**Logic:**

1. **Validation:** Requires ≥2 valid PDFs; fails immediately otherwise.
2. **Single worker call:** Unlike compression/conversion, all files are sent in one `worker.postMessage({ files })`. The worker uses `PDFDocument.load()` + `copyPages()` from `pdf-lib` to losslessly combine pages.
3. **Result normalization:** Returns a single result with `originalSize` as the sum of inputs and `compressedSize` as the merged output size.

**Return value:** `{ startMerge }`.

---

### Service/Worker Contracts

All service files follow an identical messaging pattern:

```
service.jsx                          worker.jsx
┌────────────────────────┐           ┌────────────────────────────┐
│ export function doX()  │           │ self.onmessage = async (e) │
│   new Worker(url)      │──post──▶  │   // heavy computation     │
│   return new Promise() │◀──msg───  │   self.postMessage(result) │
│   worker.terminate()   │           └────────────────────────────┘
└────────────────────────┘
```

**Message protocol:**

- Workers emit `{ type: "progress", value: number }` for incremental updates.
- Workers emit `{ type: "done", result: {...} }` on success.
- Workers emit `{ type: "error", message: string }` on failure.
- The service's Promise resolves/rejects accordingly and terminates the worker.

### `mdToPdf.service.jsx` — The Exception

This is the most complex module (~650 lines) and the **only feature that runs on the main thread** (no worker). It implements a custom `PdfBuilder` class that:

1. Lexes markdown via `marked.lexer()` into AST tokens.
2. Walks the token tree with block-level renderers (`rHeading`, `rPara`, `rCode`, `rList`, `rBlockquote`, `rTable`, `rHr`).
3. Flattens inline tokens (bold, italic, code spans, links) into measured segments.
4. Word-wraps segments against content width using font metrics from `pdf-lib`'s `widthOfTextAtSize`.
5. Draws directly onto `PDFDocument` pages using `pdf-lib` primitives (`drawText`, `drawRectangle`, `drawCircle`, `drawLine`).
6. Handles page breaks mid-content (code blocks, tables, blockquotes span across pages).

**Why no worker?** `pdf-lib` operates on `ArrayBuffer`s and doesn't require DOM or `OffscreenCanvas`. The `marked` tokenizer and `PdfBuilder`'s text measurement are inherently sequential and fast enough for typical AI-output-length texts. A worker would add serialization complexity without meaningful UX benefit.

---

## 6. Summary of Architectural Trade-Offs

| Decision | Benefit | Risk / Cost |
|---|---|---|
| Single React Context for all state | Simple, zero boilerplate | All consumers re-render on any change |
| Disposable workers per operation | No lifecycle management; clean memory | Small worker instantiation overhead per call |
| Dynamic imports in hooks | Smaller initial bundle | Slight delay on first feature use |
| `mdToPdf` on main thread | Simpler code; avoids serialization | Could block UI on very large documents |
| Dual `status`/`convert` state strings | Works for current feature set | Inconsistent; begs for a unified state machine |
| CSS custom properties (no CSS-in-JS) | Zero runtime cost; fast theming | Less component-scoped; global namespace |
