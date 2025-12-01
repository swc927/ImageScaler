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
  const downloadAllBtn = document.getElementById("downloadAllBtn");
  const resetBtn = document.getElementById("resetBtn");

  const origMeta = document.getElementById("origMeta");
  const outMeta = document.getElementById("outMeta");
  const sizeMeta = document.getElementById("sizeMeta");

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const imageIndexLabel = document.getElementById("imageIndexLabel");

  let original = { img: null, width: 0, height: 0, name: "image" };
  let aspect = 1;

  let files = [];
  let currentIndex = 0;

  const clamp = (n, min, max) => Math.max(min, Math.min(n, max));

  function updateImageIndexLabel() {
    if (!imageIndexLabel) return;
    if (!files.length) {
      imageIndexLabel.textContent = "";
      return;
    }
    imageIndexLabel.textContent =
      "Image " + (currentIndex + 1) + " of " + files.length;
  }

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not load image"));
      };

      img.src = url;
    });
  }

  async function showFile(file) {
    try {
      const img = await loadImageFromFile(file);

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
      updateImageIndexLabel();
    } catch (err) {
      alert("Could not load that image.");
    }
  }

  function setFiles(fileList) {
    if (!fileList || !fileList.length) return;

    files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));

    if (!files.length) {
      alert("No image files found.");
      return;
    }

    currentIndex = 0;
    showFile(files[currentIndex]);
  }

  function draw() {
    if (!original.img) return;

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

  function downloadCanvasAs(nameBase) {
    const q = clamp(parseInt(qualityEl.value, 10) / 100, 0.01, 1);
    const mime = formatEl.value;
    const ext = mime.split("/")[1].replace("jpeg", "jpg");

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const a = document.createElement("a");
        const url = URL.createObjectURL(blob);

        a.href = url;
        a.download = nameBase + "-resized." + ext;
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(url);
      },
      mime,
      q
    );
  }

  function getCurrentSettings() {
    const baseWidth =
      parseInt(widthEl.value || original.width || 0, 10) || original.width;
    const baseHeight =
      parseInt(heightEl.value || original.height || 0, 10) || original.height;

    return {
      baseWidth,
      baseHeight,
      lockAspect: lockAspectEl.checked,
      scale: clamp(parseInt(scaleEl.value, 10) / 100, 0.1, 2),
      mime: formatEl.value,
      quality: clamp(parseInt(qualityEl.value, 10) / 100, 0.01, 1),
    };
  }

  async function processFileToCanvas(file, settings) {
    const img = await loadImageFromFile(file);
    const nameBase = file.name.replace(/\.[^.]+$/, "");
    const aspectLocal = img.naturalWidth / img.naturalHeight;

    let w = settings.baseWidth;
    let h = settings.baseHeight;

    if (settings.lockAspect) {
      h = Math.round(w / aspectLocal);
    }

    const outW = clamp(Math.round(w * settings.scale), 1, 20000);
    const outH = clamp(Math.round(h * settings.scale), 1, 20000);

    canvas.width = outW;
    canvas.height = outH;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, outW, outH);

    return nameBase;
  }

  // Drag and drop

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
    const fileList = e.dataTransfer.files;
    if (!fileList || !fileList.length) return;
    setFiles(fileList);
  });

  // Open file picker

  dropzone.addEventListener("click", () => fileInput.click());
  chooseBtn.addEventListener("click", () => fileInput.click());

  // Handle file input

  fileInput.addEventListener("change", (e) => {
    const fileList = e.target.files;
    if (!fileList || !fileList.length) return;
    setFiles(fileList);
  });

  // Control changes

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
    draw();
    downloadCanvasAs(original.name);
  });

  downloadAllBtn.addEventListener("click", async () => {
    if (!files.length) return;
    const settings = getCurrentSettings();

    for (const file of files) {
      const nameBase = await processFileToCanvas(file, settings);
      downloadCanvasAs(nameBase);
    }
  });

  // Navigation between images

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (!files.length) return;
      currentIndex = (currentIndex - 1 + files.length) % files.length;
      showFile(files[currentIndex]);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (!files.length) return;
      currentIndex = (currentIndex + 1) % files.length;
      showFile(files[currentIndex]);
    });
  }

  document.addEventListener("keydown", (e) => {
    if (!files.length) return;
    if (e.key === "ArrowLeft") {
      currentIndex = (currentIndex - 1 + files.length) % files.length;
      showFile(files[currentIndex]);
    } else if (e.key === "ArrowRight") {
      currentIndex = (currentIndex + 1) % files.length;
      showFile(files[currentIndex]);
    }
  });
})();
