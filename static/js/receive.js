function $(sel) { return document.querySelector(sel); }

function renderQr(uuid) {
  const el = document.getElementById("qrcode");
  el.innerHTML = "";
  if (!window.QRCode) {
    console.error("QRCode library not loaded");
    const status = document.getElementById("status");
    status.textContent = "QR library failed to load.";
    return;
  }
  const content = "qrbridge:" + uuid;
  new window.QRCode(el, {
    text: content,
    width: 260,
    height: 260,
    colorDark: "#0b1324",
    colorLight: "#ffffff",
    correctLevel: window.QRCode.CorrectLevel.M,
  });
}

function connectSocket(uuid) {
  const status = document.getElementById("status");
  const scheme = window.location.protocol === "https:" ? "wss" : "ws";
  const wsUrl = `${scheme}://${window.location.host}/ws/device/${uuid}/`;
  const ws = new WebSocket(wsUrl);

  ws.addEventListener("open", () => {
    status.textContent = "Ready. Waiting for link…";
    status.classList.remove("waiting");
    status.classList.add("connected");
  });

  ws.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "redirect") {
        const url = data.url;
        status.textContent = "Redirecting…";
        status.classList.add("redirecting");
        const overlay = document.getElementById("redirect-overlay");
        overlay.style.display = "grid";
        setTimeout(() => { window.location.href = url; }, 700);
      }
    } catch (e) {
      console.error("Invalid message", e);
    }
  });

  ws.addEventListener("close", () => {
    status.textContent = "Disconnected. Refresh to retry.";
    status.classList.remove("connected");
    status.classList.add("waiting");
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const uuid = window.__DEVICE_UUID__;
  renderQr(uuid);
  connectSocket(uuid);
});