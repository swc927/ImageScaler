// Image Scaler by SWC • script.js
(() => {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");
  const chooseBtn = document.getElementById("chooseBtn");
  const controls = document.getElementById("controls");
  const previewPanel = document.getElementById("previewPanel");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  const widthEl = document.getElementById("width");
  const heightEl = document.getElementById("height");
  const lockAspectEl = document.getElementById("lockAspect");
  const scaleEl = document.getElementById("scale");
  const scaleOut = document.getElementById("scaleOut");
  const formatEl = document.getElementById("format");
  const qualityEl = document.getElementById("quality");
  const qualityOut = document.getElementById("qualityOut");
  const downloadBtn = document.getElementById("downloadBtn");
  const resetBtn = document.getElementById("resetBtn");

  const origMeta = document.getElementById("origMeta");
  const outMeta = document.getElementById("outMeta");
  const sizeMeta = document.getElementById("sizeMeta");

  let original = { img: null, width: 0, height: 0, name: "image" };
  let aspect = 1;

  const clamp = (n, min, max) => Math.max(min, Math.min(n, max));

  function loadFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      original = {
        img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        name: file.name.replace(/\.[^.]+$/, ""),
      };
      aspect = img.naturalWidth / img.naturalHeight;
      widthEl.value = img.naturalWidth;
      heightEl.value = img.naturalHeight;
      controls.hidden = false;
      previewPanel.hidden = false;
      scaleEl.value = 100;
      scaleOut.textContent = "100%";
      draw();
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      alert("Could not load that image.");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function draw() {
    let w = parseInt(widthEl.value || 0, 10);
    let h = parseInt(heightEl.value || 0, 10);
    if (lockAspectEl.checked) {
      if (document.activeElement === widthEl) {
        h = Math.round(w / aspect);
        heightEl.value = h;
      } else if (document.activeElement === heightEl) {
        w = Math.round(h * aspect);
        widthEl.value = w;
      }
    }
    const scale = parseInt(scaleEl.value, 10) / 100;
    scaleOut.textContent = Math.round(scale * 100) + "%";

    const outW = clamp(Math.round(w * scale), 1, 20000);
    const outH = clamp(Math.round(h * scale), 1, 20000);

    canvas.width = outW;
    canvas.height = outH;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(original.img, 0, 0, outW, outH);

    origMeta.textContent = original.width + " × " + original.height;
    outMeta.textContent = outW + " × " + outH;

    // quick size estimate by sampling dataURL length without forcing download
    const q = clamp(parseInt(qualityEl.value, 10) / 100, 0.01, 1);
    const mime = formatEl.value;
    const dataURL = canvas.toDataURL(mime, q);
    const bytes = Math.ceil(
      ((dataURL.length - "data:image/png;base64,".length) * 3) / 4
    );
    sizeMeta.textContent = formatBytes(bytes);
    qualityOut.textContent = Math.round(q * 100);
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  }

  function download() {
    const q = clamp(parseInt(qualityEl.value, 10) / 100, 0.01, 1);
    const mime = formatEl.value;
    const ext = mime.split("/")[1].replace("jpeg", "jpg");
    canvas.toBlob(
      (blob) => {
        const a = document.createElement("a");
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = original.name + "-resized." + ext;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
      mime,
      q
    );
  }

  // Drag and drop handlers
  ["dragenter", "dragover"].forEach((ev) => {
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.add("focus");
    });
  });
  ["dragleave", "drop"].forEach((ev) => {
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.remove("focus");
    });
  });
  dropzone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    loadFile(file);
  });

  dropzone.addEventListener("click", () => fileInput.click());
  chooseBtn.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") fileInput.click();
  });
  fileInput.addEventListener("change", (e) => loadFile(e.target.files[0]));

  [widthEl, heightEl, scaleEl, formatEl, qualityEl, lockAspectEl].forEach(
    (el) => {
      el.addEventListener("input", () => {
        if (!original.img) return;
        draw();
      });
    }
  );

  resetBtn.addEventListener("click", () => {
    if (!original.img) return;
    widthEl.value = original.width;
    heightEl.value = original.height;
    lockAspectEl.checked = true;
    scaleEl.value = 100;
    qualityEl.value = 90;
    formatEl.value = "image/jpeg";
    draw();
  });

  downloadBtn.addEventListener("click", () => {
    if (!original.img) return;
    download();
  });
})();
