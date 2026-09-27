import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import "./visitor-tools.css";

const OFFICE_OPDS = ["Bagian Umum Setda", "Dinas Komunikasi dan Informatika", "Dinas Kesehatan", "Dinas Pendidikan", "DPMPTSP", "BKPSDM"];
const OFFICE_BUILDINGS = ["Kantor Wali Kota Baubau", "Mal Pelayanan Publik", "Gedung Maedani"];
const OFFICE_HOSTS = ["Aisyah Rahman", "Rizal Hidayat", "Nurul Safitri", "Fajar Maulana", "Dewi Kartika"];
const OFFICE_ROOMS = ["Ruang Rapat Wali Kota", "Ruang Rapat Palagimata", "Aula Kantor Wali Kota", "Ruang Rapat Kominfo"];

function buildFlowUrl(params, baseAddress) {
  const url = new URL(baseAddress);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Public app address must use HTTP or HTTPS");
  url.search = new URLSearchParams(params).toString();
  url.hash = "";
  return url.toString();
}

function localDateValue() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function Icon({ name, size = 16 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.07 0l2-2A5 5 0 0 0 12 3.93l-1.14 1.14" /><path d="M14 11a5 5 0 0 0-7.07 0l-2 2A5 5 0 0 0 12 20.07l1.14-1.14" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    qr: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v2M17 20h4M20 18v3" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

export default function VisitorToolsModal({ onClose, activeBuilding = OFFICE_BUILDINGS[0] }) {
  const [activeTab, setActiveTab] = useState("walk-in");
  const [event, setEvent] = useState({ name: "", date: localDateValue(), location: "", building: activeBuilding, opd: OFFICE_OPDS[0], host: OFFICE_HOSTS[0], room: OFFICE_ROOMS[0] });
  const [eventUrl, setEventUrl] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [publicBaseUrl, setPublicBaseUrl] = useState(() => {
    try {
      return localStorage.getItem("visitorly.public-base-url") || `${window.location.origin}${window.location.pathname}`;
    } catch {
      return `${window.location.origin}${window.location.pathname}`;
    }
  });
  let walkInUrl = "";
  let validPublicBaseUrl = false;
  try {
    const parsedBaseUrl = new URL(publicBaseUrl);
    validPublicBaseUrl = ["http:", "https:"].includes(parsedBaseUrl.protocol);
    if (validPublicBaseUrl) walkInUrl = buildFlowUrl({ flow: "walk-in", building: activeBuilding }, publicBaseUrl);
  } catch {
    validPublicBaseUrl = false;
  }

  function updatePublicBaseUrl(value) {
    setPublicBaseUrl(value);
    setEventUrl("");
    setCopyMessage("");
    try {
      localStorage.setItem("visitorly.public-base-url", value);
    } catch {
      setCopyMessage("This address will not be saved after this session.");
    }
  }

  function generateEventUrl(submitEvent) {
    submitEvent.preventDefault();
    if (!validPublicBaseUrl) return;
    const params = { flow: "event", event: event.name.trim(), date: event.date, building: event.building, opd: event.opd, host: event.host, room: event.room };
    if (event.location.trim()) params.location = event.location.trim();
    setEventUrl(buildFlowUrl(params, publicBaseUrl));
    setCopyMessage("");
  }

  async function copyUrl(url) {
    try {
      await navigator.clipboard.writeText(url);
      setCopyMessage("Link copied to clipboard");
    } catch {
      setCopyMessage("Select the link above to copy it");
    }
  }

  function downloadQr() {
    const svg = document.querySelector(".qr-frame svg");
    if (!svg || !walkInUrl) return;
    const image = new XMLSerializer().serializeToString(svg);
    const objectUrl = URL.createObjectURL(new Blob([image], { type: "image/svg+xml;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "visitorly-walk-in-qr.svg";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  return (
    <div className="modal-backdrop tools-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="tools-modal" role="dialog" aria-modal="true" aria-labelledby="tools-title">
        <header className="tools-header">
          <div><span className="tools-kicker">AKSES TAMU · PEMKOT BAUBAU</span><h2 id="tools-title">Bagikan akses kunjungan</h2><p>Buat QR check-in walk-in atau tautan rencana kegiatan.</p></div>
          <button className="modal-close" type="button" aria-label="Close visitor tools" onClick={onClose}><Icon name="close" /></button>
        </header>
        <div className="tools-tabs" role="tablist" aria-label="Visitor link type">
          <button type="button" role="tab" aria-selected={activeTab === "walk-in"} className={activeTab === "walk-in" ? "selected" : ""} onClick={() => { setActiveTab("walk-in"); setCopyMessage(""); }}><Icon name="qr" size={15} /> QR walk-in</button>
          <button type="button" role="tab" aria-selected={activeTab === "event"} className={activeTab === "event" ? "selected" : ""} onClick={() => { setActiveTab("event"); setCopyMessage(""); }}><Icon name="calendar" size={15} /> Rencana kegiatan</button>
        </div>
        <div className="public-base-field"><label htmlFor="public-base-url">Alamat aplikasi publik</label><input id="public-base-url" type="url" required value={publicBaseUrl} aria-invalid={!validPublicBaseUrl} onChange={(change) => updatePublicBaseUrl(change.target.value)} placeholder="https://domain-kantor.go.id" /><p>{validPublicBaseUrl ? "Untuk uji coba lokal dari HP, gunakan alamat LAN komputer ini." : "Masukkan alamat HTTP atau HTTPS yang valid."}</p></div>

        {activeTab === "walk-in" ? (
          <div className="walkin-tool" role="tabpanel">
            <div className="qr-frame">{walkInUrl ? <QRCodeSVG value={walkInUrl} title="Walk-in visitor check-in QR code" size={192} level="M" includeMargin /> : <span className="qr-invalid">Enter a valid public app address.</span>}</div>
            <div className="tool-copy"><span className="tool-overline">TANPA JANJI KUNJUNGAN</span><h3>Registrasi mandiri di lobby</h3><p>Tempatkan QR di meja resepsionis. Tamu mengisi data, lalu petugas memverifikasi identitas.</p></div>
            <div className="generated-link-row"><input aria-label="Tautan check-in walk-in" readOnly value={walkInUrl} onFocus={(event) => event.target.select()} /><button className="copy-button" type="button" disabled={!walkInUrl} onClick={() => copyUrl(walkInUrl)}><Icon name="copy" size={15} /> Salin tautan</button><button className="copy-button download-qr-button" type="button" title="Unduh QR walk-in" aria-label="Unduh QR walk-in" disabled={!walkInUrl} onClick={downloadQr}><Icon name="download" size={15} /> Unduh QR</button></div>
            <div className="tool-footer"><span>{copyMessage || "QR membuka form registrasi tamu walk-in."}</span>{walkInUrl && <a href={walkInUrl} target="_blank" rel="noreferrer">Pratinjau <Icon name="arrow" size={14} /></a>}</div>
          </div>
        ) : (
          <div className="event-tool" role="tabpanel">
            <div className="event-intro"><span className="event-icon"><Icon name="link" size={18} /></span><div><h3>Buat tautan rencana kunjungan</h3><p>Isi kegiatan dan unit tujuan, lalu bagikan form kepada tamu.</p></div></div>
            <form className="event-link-form" onSubmit={generateEventUrl}>
              <label>Nama event / kegiatan<input required maxLength={90} value={event.name} onChange={(change) => { setEvent({ ...event, name: change.target.value }); setEventUrl(""); }} placeholder="Contoh: Forum koordinasi triwulan" /></label>
              <div className="event-form-row"><label>Tanggal kegiatan<input required type="date" min={localDateValue()} value={event.date} onChange={(change) => { setEvent({ ...event, date: change.target.value }); setEventUrl(""); }} /></label><label>Gedung / lokasi<input maxLength={90} value={event.location} onChange={(change) => { setEvent({ ...event, location: change.target.value }); setEventUrl(""); }} placeholder="Kantor Wali Kota Baubau" /></label></div>
              <label>Gedung tujuan<select value={event.building} onChange={(change) => { setEvent({ ...event, building: change.target.value }); setEventUrl(""); }}>{OFFICE_BUILDINGS.map((building) => <option key={building}>{building}</option>)}</select></label>
              <label>OPD / unit tujuan<select value={event.opd} onChange={(change) => { setEvent({ ...event, opd: change.target.value }); setEventUrl(""); }}>{OFFICE_OPDS.map((opd) => <option key={opd}>{opd}</option>)}</select></label>
              <div className="event-form-row"><label>Pegawai / host<select value={event.host} onChange={(change) => { setEvent({ ...event, host: change.target.value }); setEventUrl(""); }}>{OFFICE_HOSTS.map((host) => <option key={host}>{host}</option>)}</select></label><label>Ruang pertemuan<select value={event.room} onChange={(change) => { setEvent({ ...event, room: change.target.value }); setEventUrl(""); }}>{OFFICE_ROOMS.map((room) => <option key={room}>{room}</option>)}</select></label></div>
              <button className="primary-button event-generate" type="submit"><Icon name="link" size={15} /> Buat tautan event</button>
            </form>
            {eventUrl && <div className="event-result"><label htmlFor="event-link-output">TAUTAN FORM EVENT</label><div className="generated-link-row"><input id="event-link-output" readOnly value={eventUrl} onFocus={(focus) => focus.target.select()} /><button className="copy-button" type="button" onClick={() => copyUrl(eventUrl)}><Icon name="copy" size={15} /> Salin</button></div><div className="tool-footer"><span>{copyMessage || "Tamu dapat mengirim rencana kedatangan melalui tautan ini."}</span><a href={eventUrl} target="_blank" rel="noreferrer">Pratinjau <Icon name="arrow" size={14} /></a></div></div>}
          </div>
        )}
      </section>
    </div>
  );
}
