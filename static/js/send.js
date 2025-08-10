// Simple toast
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

function showError(message) {
  const el = document.getElementById("error");
  el.textContent = message;
  el.style.display = "block";
}

function clearError() {
  const el = document.getElementById("error");
  el.textContent = "";
  el.style.display = "none";
}

function showSuccess(message) {
  const el = document.getElementById("success");
  el.textContent = message || "Success";
  el.style.display = "block";
  setTimeout(() => { el.style.display = "none"; }, 2500);
}

function isValidHttpUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function extractUuidFromContent(content) {
  // Accept "qrbridge:{uuid}" or direct uuid
  const prefix = "qrbridge:";
  if ((content || "").startsWith(prefix)) {
    return content.slice(prefix.length);
  }
  const m = (content || "").match(/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})/);
  return m ? m[1] : null;
}

let html5Qr = null;
let scanning = false;

function openScanner() {
  const modal = document.getElementById("scanner-modal");
  modal.setAttribute("aria-hidden", "false");

  const scannerEl = document.getElementById("scanner");
  if (!window.Html5Qrcode) {
    showError("QR scanner library failed to load.");
    return;
  }
  html5Qr = new window.Html5Qrcode(scannerEl.id);
  const config = { fps: 10, qrbox: { width: 280, height: 280 } };

  function onScanSuccess(decodedText) {
    if (scanning) return;
    scanning = true;
    html5Qr.stop().then(() => html5Qr.clear()).catch(() => {});
    const uuid = extractUuidFromContent(decodedText || "");
    if (!uuid) {
      showError("Invalid QR. Please try again.");
      scanning = false;
      return;
    }
    sendLink(uuid);
    closeScanner();
  }

  window.Html5Qrcode.getCameras().then(() => {
    const cameraConfig = { facingMode: "environment" };
    html5Qr.start(cameraConfig, config, onScanSuccess).catch((err) => {
      showError("Could not start camera. " + (err?.message || err));
    });
  }).catch((err) => {
    showError("No camera found. " + (err?.message || err));
  });
}

function closeScanner() {
  const modal = document.getElementById("scanner-modal");
  modal.setAttribute("aria-hidden", "true");
  if (html5Qr) {
    html5Qr.stop().then(() => html5Qr.clear()).catch(() => {});
  }
  scanning = false;
}

async function sendLink(uuid) {
  clearError();
  const input = document.getElementById("link-input");
  const url = (input.value || "").trim();

  if (!isValidHttpUrl(url)) {
    showError("Please enter a valid http(s) URL.");
    return;
  }

  try {
    const resp = await fetch("/api/send/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uuid, url }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      showError(text || "Failed to send link.");
      return;
    }
    showSuccess("Link sent! Check the receiver.");
    showToast("Sent ✅");
  } catch (e) {
    showError("Network error. Please try again.");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("scan-send-btn");
  const closeBtn = document.getElementById("close-modal");
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    clearError();
    const input = document.getElementById("link-input");
    if (!isValidHttpUrl((input.value || "").trim())) {
      showError("Please enter a valid http(s) URL first.");
      return;
    }
    openScanner();
  });
  closeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    closeScanner();
  });
});