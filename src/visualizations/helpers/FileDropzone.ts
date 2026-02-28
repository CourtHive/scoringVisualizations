/**
 * FileDropzone — Vanilla-TS drag/drop component for .ptf and .json files
 *
 * HTML5 Drag and Drop API with visual feedback and click-to-browse fallback.
 * Reads .ptf files as ArrayBuffer (UTF-16 LE), .json files as parsed objects.
 */

export interface FileDropzoneOptions {
  onPTFFile?: (buffer: ArrayBuffer, fileName: string) => void;
  onJSONFile?: (data: any, fileName: string) => void;
  onError?: (message: string) => void;
}

export function createFileDropzone(options: FileDropzoneOptions): HTMLElement {
  const { onPTFFile, onJSONFile, onError } = options;

  // ── Root container ────────────────────────────────────────────
  const root = document.createElement("div");
  root.style.cssText =
    "display:flex; flex-direction:column; align-items:center; gap:8px; padding:12px; margin-bottom:12px; font-family:system-ui,sans-serif; font-size:13px;";

  // ── Dropzone area ─────────────────────────────────────────────
  const dropzone = document.createElement("div");
  dropzone.style.cssText =
    "width:100%; min-height:80px; border:2px dashed #ccc; border-radius:8px; background:#fafafa; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:border-color 0.15s, background-color 0.15s;";

  const label = document.createElement("span");
  label.style.cssText = "color:#888; pointer-events:none;";
  label.textContent = "Drop .ptf file here (or click to browse)";
  dropzone.appendChild(label);

  // ── Hidden file input ─────────────────────────────────────────
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".ptf,.json";
  input.style.display = "none";

  // ── Status line ───────────────────────────────────────────────
  const status = document.createElement("div");
  status.style.cssText =
    "width:100%; color:#555; font-size:12px; min-height:18px;";

  root.appendChild(dropzone);
  root.appendChild(input);
  root.appendChild(status);

  // ── Visual feedback ───────────────────────────────────────────
  function setDragOver(active: boolean) {
    dropzone.style.borderColor = active ? "#4a90d9" : "#ccc";
    dropzone.style.backgroundColor = active ? "#e8f0fe" : "#fafafa";
  }

  // ── File processing ───────────────────────────────────────────
  function processFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "ptf") {
      status.textContent = `Reading ${file.name}...`;
      file
        .arrayBuffer()
        .then((buffer) => {
          status.textContent = `Loaded ${file.name} (${buffer.byteLength} bytes)`;
          onPTFFile?.(buffer, file.name);
        })
        .catch(() => {
          const msg = `Failed to read ${file.name}`;
          status.textContent = msg;
          onError?.(msg);
        });
    } else if (ext === "json") {
      status.textContent = `Reading ${file.name}...`;
      file.text()
        .then((text) => {
          try {
            const data = JSON.parse(text);
            status.textContent = `Loaded ${file.name}`;
            onJSONFile?.(data, file.name);
          } catch {
            const msg = `Invalid JSON in ${file.name}`;
            status.textContent = msg;
            onError?.(msg);
          }
        })
        .catch(() => {
          const msg = `Failed to read ${file.name}`;
          status.textContent = msg;
          onError?.(msg);
        });
    } else {
      const msg = `Unsupported file type: .${ext}. Expected .ptf or .json`;
      status.textContent = msg;
      onError?.(msg);
    }
  }

  // ── Drag events ───────────────────────────────────────────────
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  });

  dropzone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  });

  // ── Click-to-browse ───────────────────────────────────────────
  dropzone.addEventListener("click", () => input.click());

  input.addEventListener("change", () => {
    if (input.files && input.files.length > 0) {
      processFile(input.files[0]);
      input.value = ""; // Reset for re-upload
    }
  });

  return root;
}
