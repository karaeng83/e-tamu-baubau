import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ACCOUNTS_KEY, readUserAccounts, SESSION_KEY, USER_ROLES } from "./userAccounts.js";
import SuperadminLogin from "./SuperadminLogin.jsx";
import PublicVisitForm from "./PublicVisitForm.jsx";
import VisitorToolsModal from "./VisitorToolsModal.jsx";
import { readEventPlans, readPublicVisits } from "./visitorStorage.js";
import "./baubau-visitor.css";

const OPDS = ["Bagian Umum Setda", "Dinas Komunikasi dan Informatika", "Dinas Kesehatan", "Dinas Pendidikan", "DPMPTSP", "BKPSDM"];
const BUILDINGS = ["Kantor Wali Kota Baubau", "Mal Pelayanan Publik", "Gedung Maedani"];
const EMPLOYEES = ["Aisyah Rahman", "Rizal Hidayat", "Nurul Safitri", "Fajar Maulana", "Dewi Kartika"];
const ROOMS = ["Ruang Rapat Wali Kota", "Ruang Rapat Palagimata", "Aula Kantor Wali Kota", "Ruang Rapat Kominfo"];
const PURPOSES = ["Koordinasi", "Konsultasi layanan", "Audiensi", "Pengiriman dokumen", "Wawancara", "Kegiatan / acara", "Lainnya"];
const STATUS_LABELS = { Scheduled: "Terjadwal", Waiting: "Menunggu", "Checked-in": "Sudah check-in", "In Meeting": "Sedang bertemu", "Checked-out": "Sudah check-out", Cancelled: "Dibatalkan", Rejected: "Ditolak" };
const APPROVAL_LABELS = { Pending: "Menunggu", Approved: "Disetujui", Rejected: "Ditolak" };
const VISITS_KEY = "baubau.visits.v1";
const MASTERS_KEY = "baubau.masters.v1";
const BLACKLIST_KEY = "baubau.watchlist.v1";
const AUDIT_KEY = "baubau.audit.v1";
const PREFERENCES_KEY = "baubau.preferences.v1";

function localDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function readStored(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizePublicVisit(visit) {
  const oldStatus = { Expected: "Scheduled", "Checked in": "Checked-in", "Checked out": "Checked-out" };
  const status = oldStatus[visit.status] || visit.status || "Scheduled";
  return {
    position: visit.position || "",
    building: visit.building || BUILDINGS[0],
    phone: visit.phone || "",
    identityNo: visit.identityNo || "",
      opd: visit.opd || "Bagian Umum Setda",
    room: visit.room || "Ruang Rapat Wali Kota",
    agenda: visit.agenda || visit.purpose || "Kunjungan kantor",
    date: visit.visitDate || visit.date || localDate(),
    groupSize: Number(visit.attendees) || 1,
    escort: visit.escort || "",
    approvalStatus: visit.approvalStatus || (visit.visitType === "walk-in" ? "Approved" : "Pending"),
    idVerified: Boolean(visit.idVerified),
    ...visit,
    status,
  };
}

function initialVisitData() {
  const stored = readStored(VISITS_KEY, []);
  const publicEntries = [...readPublicVisits(), ...readEventPlans()].map(normalizePublicVisit);
  const base = Array.isArray(stored) && stored.length ? stored : [
    { id: "BT-26001", name: "Nadia Putri", company: "PT Sagara Digital", position: "Account Director", phone: "0812 4400 8821", identityNo: "7472••••••••0012", opd: "Dinas Komunikasi dan Informatika", host: "Aisyah Rahman", room: "Ruang Rapat Kominfo", purpose: "Koordinasi", agenda: "Pemaparan layanan jaringan", date: localDate(), time: "09:00", status: "Checked-in", approvalStatus: "Approved", visitType: "appointment", groupSize: 1, escort: "", idVerified: true, checkedInAt: new Date(Date.now() - 35 * 60000).toISOString() },
    { id: "BT-26002", name: "Arif Nugroho", company: "Konsultan Independen", position: "Konsultan", phone: "0813 2211 9033", identityNo: "7472••••••••0091", opd: "DPMPTSP", host: "Rizal Hidayat", room: "Ruang Rapat Wali Kota", purpose: "Konsultasi layanan", agenda: "Konsultasi perizinan usaha", date: localDate(), time: "09:30", status: "Scheduled", approvalStatus: "Pending", visitType: "appointment", groupSize: 1, escort: "", idVerified: false },
    { id: "BT-26003", name: "Clara Wijaya", company: "Northstar Ventures", position: "Investment Associate", phone: "0811 5612 8001", identityNo: "7472••••••••0044", opd: "Bagian Umum Setda", host: "Dewi Kartika", room: "Ruang Rapat Wali Kota", purpose: "Audiensi", agenda: "Diskusi kemitraan", date: localDate(), time: "10:00", status: "Scheduled", approvalStatus: "Approved", visitType: "appointment", groupSize: 2, escort: "Satria, Protokol", idVerified: false },
    { id: "BT-26004", name: "Bima Santoso", company: "PT Karya Utama", position: "Pelamar", phone: "0812 7811 4550", identityNo: "7472••••••••0020", opd: "BKPSDM", host: "Nurul Safitri", room: "Ruang Rapat Palagimata", purpose: "Wawancara", agenda: "Wawancara tahap akhir", date: localDate(), time: "10:30", status: "In Meeting", approvalStatus: "Approved", visitType: "appointment", groupSize: 1, escort: "", idVerified: true, checkedInAt: new Date(Date.now() - 55 * 60000).toISOString() },
    { id: "BT-26005", name: "Sofia Rahman", company: "Studio Rupa", position: "Creative Lead", phone: "0813 7720 1162", identityNo: "7472••••••••0067", opd: "Dinas Pendidikan", host: "Fajar Maulana", room: "Aula Kantor Wali Kota", purpose: "Kegiatan / acara", agenda: "Lokakarya literasi digital", date: localDate(), time: "11:00", status: "Waiting", approvalStatus: "Approved", visitType: "walk-in", groupSize: 1, escort: "", idVerified: false },
    { id: "BT-26006", name: "Kevin Hartono", company: "PT Lintas Niaga", position: "Kurir", phone: "0821 4419 3038", identityNo: "7472••••••••0084", opd: "Bagian Umum Setda", host: "Aisyah Rahman", room: "Ruang Rapat Wali Kota", purpose: "Pengiriman dokumen", agenda: "Pengiriman berkas kerja sama", date: localDate(), time: "08:30", status: "Checked-out", approvalStatus: "Approved", visitType: "walk-in", groupSize: 1, escort: "", idVerified: true, checkedInAt: new Date(Date.now() - 120 * 60000).toISOString(), checkedOutAt: new Date(Date.now() - 75 * 60000).toISOString() },
  ];
  const ids = new Set(base.map((visit) => visit.id));
  return [...publicEntries.filter((visit) => !ids.has(visit.id)), ...base].map((visit) => ({ building: BUILDINGS[0], ...visit }));
}

const seedMasters = { buildings: BUILDINGS, opds: OPDS, employees: EMPLOYEES, rooms: ROOMS, visitTypes: PURPOSES };
const navGroups = [
  { title: "OPERASIONAL", items: [{ id: "overview", label: "Ringkasan", icon: "grid" }, { id: "visitors", label: "Database tamu", icon: "users" }, { id: "history", label: "Riwayat kunjungan", icon: "clock" }, { id: "appointments", label: "Janji kunjungan", icon: "calendar" }, { id: "approvals", label: "Persetujuan", icon: "check" }, { id: "frontdesk", label: "Front desk & kiosk", icon: "door" }] },
  { title: "KESELAMATAN", items: [{ id: "evacuation", label: "Daftar evakuasi", icon: "shield" }, { id: "reports", label: "Laporan & analitik", icon: "chart" }, { id: "feedback", label: "Feedback & aduan", icon: "check" }] },
  { title: "PENGELOLAAN", items: [{ id: "masters", label: "Master data", icon: "building" }, { id: "users", label: "Admin & akses", icon: "key" }, { id: "integrations", label: "Integrasi sistem", icon: "plug" }] },
];
function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    chart: <><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-5 5"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    door: <><path d="M4 21h16M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M10 12h.01"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    building: <><path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h.01M15 10h.01M9 14h.01M15 14h.01M10 21v-4h4v4"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11"/><path d="m9 12 2 2 4-4"/></>,
    key: <><circle cx="8" cy="15" r="4"/><path d="m10.9 12.1 9-9M17 6l2 2M14 9l2 2"/></>,
    plug: <><path d="M9 7V3M15 7V3M6 7h12v5a6 6 0 0 1-12 0V7ZM12 18v3"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
  };
  return <svg {...common}>{paths[name] || paths.grid}</svg>;
}

function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = readStored(key, null);
    if (stored !== null) {
      if (initialValue && typeof initialValue === "object" && !Array.isArray(initialValue) && stored && typeof stored === "object" && !Array.isArray(stored)) return { ...initialValue, ...stored };
      return stored;
    }
    return typeof initialValue === "function" ? initialValue() : initialValue;
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Local-only prototype storage may be unavailable. */ }
  }, [key, value]);
  return [value, setValue];
}

function formatDate(dateValue, options = { day: "numeric", month: "short", year: "numeric" }) {
  if (!dateValue) return "—";
  const date = new Date(`${dateValue}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("id-ID", options).format(date);
}

function personKey(visit) {
  return visit.identityNo || visit.phone || visit.name.toLowerCase().trim();
}

function getDuration(visit) {
  if (!visit.checkedInAt) return "—";
  const end = visit.checkedOutAt ? new Date(visit.checkedOutAt) : new Date();
  const minutes = Math.max(0, Math.floor((end - new Date(visit.checkedInAt)) / 60000));
  return minutes < 60 ? `${minutes} mnt` : `${Math.floor(minutes / 60)}j ${minutes % 60}m`;
}

function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status;
  const className = status.toLowerCase().replaceAll(" ", "-");
  return <span className={`gov-status gov-status-${className}`}><i />{label}</span>;
}

function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  function draw(event) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext("2d");
    const x = (event.clientX - rect.left) * canvas.width / rect.width;
    const y = (event.clientY - rect.top) * canvas.height / rect.height;
    context.lineWidth = 3;
    context.lineCap = "round";
    context.strokeStyle = "#285b49";
    context.lineTo(x, y);
    context.stroke();
    context.beginPath();
    context.moveTo(x, y);
    onChange(true);
  }
  function clear() {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    onChange(false);
  }
  return <div className="signature-wrap"><div className="signature-label"><span>Tanda tangan digital tamu</span><button type="button" onClick={clear}>Hapus</button></div><canvas ref={canvasRef} width="600" height="120" onPointerDown={(event) => { drawing.current = true; event.currentTarget.setPointerCapture(event.pointerId); draw(event); }} onPointerMove={draw} onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }} /><small>Konfirmasi kunjungan pada perangkat ini. Bukan tanda tangan tersertifikasi.</small></div>;
}

function VisitTable({ visits, onInspect, onPass, onTransition, onReschedule, onCancel, showBookingActions = false, showApproval = false, onApprove, onReject, blacklist, onBlacklist }) {
  if (!visits.length) return <div className="gov-empty"><Icon name="search" size={21}/><strong>Belum ada data kunjungan</strong><span>Ubah filter atau tambahkan kunjungan baru.</span></div>;
  return <div className="gov-table-wrap"><table className="gov-table"><thead><tr><th>TAMU</th><th>OPD / TUJUAN</th><th>JADWAL</th><th>STATUS</th>{showApproval && <th>PERSETUJUAN</th>}<th>DURASI</th><th><span className="sr-only">Aksi</span></th></tr></thead><tbody>{visits.map((visit) => {
    const nextAction = visit.status === "Scheduled" || visit.status === "Waiting" ? "Check-in" : visit.status === "Checked-in" ? "Mulai bertemu" : visit.status === "In Meeting" ? "Check-out" : "Selesai";
    const isBlacklisted = blacklist.includes(personKey(visit));
    return <tr key={visit.id}>
      <td><button className="gov-visitor-cell" type="button" onClick={() => onInspect(visit.id)}><span className={`gov-initials tone-${visit.color || "green"}`}>{visit.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><span><strong>{visit.name}</strong><small>{visit.company || "Instansi tidak dicantumkan"}{isBlacklisted && <b className="watch-flag"> · Watchlist</b>}</small></span></button></td>
      <td><span className="gov-secondary-cell"><strong>{visit.opd || "—"}</strong><small>{visit.host || "Belum ada host"} · {visit.purpose || "Kunjungan"}</small></span></td>
      <td><span className="gov-secondary-cell"><strong>{formatDate(visit.date, { day: "2-digit", month: "short" })} · {visit.time || "—"}</strong><small>{visit.room || "Lokasi belum ditetapkan"}</small></span></td>
      <td><StatusBadge status={visit.status}/></td>
      {showApproval && <td><span className={`approval-state approval-${(visit.approvalStatus || "Approved").toLowerCase()}`}>{APPROVAL_LABELS[visit.approvalStatus] || "Disetujui"}</span></td>}
      <td><span className="duration-cell">{getDuration(visit)}</span></td>
      <td><div className="gov-row-actions">{showApproval && visit.approvalStatus === "Pending" ? <><button className="mini-action approve" type="button" onClick={() => onApprove(visit.id)}>Setujui</button><button className="mini-icon reject" type="button" aria-label={`Tolak ${visit.name}`} title="Tolak" onClick={() => onReject(visit.id)}>×</button></> : <button className="mini-action" type="button" disabled={nextAction === "Selesai"} onClick={() => onTransition(visit.id)}>{nextAction}</button>}{showBookingActions && <><button className="mini-icon" type="button" aria-label={`Jadwalkan ulang ${visit.name}`} title="Jadwalkan ulang" onClick={() => onReschedule(visit.id)}>↻</button><button className="mini-icon reject" type="button" aria-label={`Batalkan ${visit.name}`} title="Batalkan" onClick={() => onCancel(visit.id)}>×</button></>}{onPass && <button className="mini-icon" type="button" aria-label={`Visitor pass ${visit.name}`} title="Visitor pass QR" onClick={() => onPass(visit.id)}><Icon name="door" size={15}/></button>}{onBlacklist && <button className={`mini-icon ${isBlacklisted ? "reject" : ""}`} type="button" aria-label={isBlacklisted ? "Keluarkan dari watchlist" : "Masukkan watchlist"} title={isBlacklisted ? "Keluarkan dari watchlist" : "Masukkan watchlist"} onClick={() => onBlacklist(visit.id)}>{isBlacklisted ? "!" : "○"}</button>}</div></td>
    </tr>;
  })}</tbody></table></div>;
}

function SummaryCard({ label, value, note, color, icon }) {
  return <article className="gov-summary-card"><div className="summary-card-top"><span>{label}</span><span className={`summary-card-icon ${color}`}><Icon name={icon} size={17}/></span></div><strong>{value}</strong><small>{note}</small></article>;
}

function YearTrend({ visits, year }) {
  const months = Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");
    return { label: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(new Date(`${year}-${month}-01T12:00:00`)), count: visits.filter((visit) => visit.date?.startsWith(`${year}-${month}`) && !["Cancelled", "Rejected"].includes(visit.status)).length };
  });
  const maxCount = Math.max(1, ...months.map((month) => month.count));
  return <section className="gov-panel annual-trend"><div className="gov-panel-heading"><div><span className="section-kicker">TREN TAHUNAN · {year}</span><h2>Kunjungan per bulan</h2><p>Rekap bulanan pada tahun yang dipilih.</p></div></div><div className="annual-bars">{months.map((month) => <div className="annual-month" key={month.label}><strong>{month.count}</strong><div className="annual-track"><i style={{ height: `${month.count ? Math.max(8, month.count / maxCount * 100) : 3}%` }}/></div><span>{month.label}</span></div>)}</div></section>;
}

function GovernmentVisitorApp({ currentUser, accounts, setAccounts, onLogout }) {
  const [visits, setVisits] = useStoredState(VISITS_KEY, initialVisitData);
  const [blacklist, setBlacklist] = useStoredState(BLACKLIST_KEY, []);
  const [audit, setAudit] = useStoredState(AUDIT_KEY, []);
  const [masters, setMasters] = useStoredState(MASTERS_KEY, seedMasters);
  const [activeBuilding, setActiveBuilding] = useState(() => ["location_admin", "user"].includes(currentUser.role) ? currentUser.building || BUILDINGS[0] : readStored("baubau.active-building.v1", currentUser.building || BUILDINGS[0]));
  const [preferences, setPreferences] = useStoredState(PREFERENCES_KEY, { email: false, whatsapp: false, reminders: true, autoCheckout: false });
  const [feedback] = useStoredState("baubau.feedback.v1", []);
  const [activePage, setActivePage] = useState("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua status");
  const [opdFilter, setOpdFilter] = useState("Semua OPD");
  const [period, setPeriod] = useState(localDate().slice(0, 7));
  const [modal, setModal] = useState("");
  const [draft, setDraft] = useState({});
  const [editingId, setEditingId] = useState("");
  const [selectedVisitId, setSelectedVisitId] = useState("");
  const [passVisitId, setPassVisitId] = useState("");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [kioskId, setKioskId] = useState("");
  const [masterDraft, setMasterDraft] = useState("");
  const [reportTab, setReportTab] = useState("ringkasan");
  const [accountDraft, setAccountDraft] = useState({ name: "", email: "", password: "", role: "user", building: BUILDINGS[0] });
  const [editingAccountId, setEditingAccountId] = useState("");
  const role = currentUser.role;
  const roleDefinition = USER_ROLES[role] || USER_ROLES.user;
  const allowedPages = roleDefinition.pages;
  const canManageUsers = role === "superadmin";
  const canChangeBuilding = role === "superadmin" || role === "settings_admin";
  const currentDate = localDate();

  useEffect(() => {
    if (role === "location_admin" || role === "user") setActiveBuilding(currentUser.building || BUILDINGS[0]);
    else {
      try { localStorage.setItem("baubau.active-building.v1", JSON.stringify(activeBuilding)); } catch { return; }
    }
  }, [activeBuilding, currentUser.building, role]);

  const buildingVisits = useMemo(() => visits.filter((visit) => {
    const matchesBuilding = (visit.building || BUILDINGS[0]) === activeBuilding;
    const matchesOwner = role !== "user" || visit.createdBy === currentUser.email;
    return matchesBuilding && matchesOwner;
  }), [visits, activeBuilding, currentUser.email, role]);
  const todayVisits = useMemo(() => buildingVisits.filter((visit) => visit.date === currentDate && !["Cancelled", "Rejected"].includes(visit.status)), [buildingVisits, currentDate]);
  const onSiteVisits = useMemo(() => buildingVisits.filter((visit) => ["Waiting", "Checked-in", "In Meeting"].includes(visit.status)), [buildingVisits]);
  const pendingApprovals = useMemo(() => buildingVisits.filter((visit) => visit.approvalStatus === "Pending" && visit.status !== "Cancelled"), [buildingVisits]);
  const filteredVisits = useMemo(() => buildingVisits.filter((visit) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [visit.name, visit.company, visit.host, visit.opd, visit.purpose, visit.id, visit.identityNo].some((value) => String(value || "").toLowerCase().includes(query));
    const matchesStatus = statusFilter === "Semua status" || visit.status === statusFilter;
    const matchesOpd = opdFilter === "Semua OPD" || visit.opd === opdFilter;
    const matchesPage = activePage !== "appointments" || visit.visitType !== "walk-in";
    return matchesSearch && matchesStatus && matchesOpd && matchesPage;
  }), [buildingVisits, search, statusFilter, opdFilter, activePage]);
  const profiles = useMemo(() => {
    const profileMap = new Map();
    buildingVisits.forEach((visit) => {
      const key = personKey(visit);
      const current = profileMap.get(key);
      if (!current || `${visit.date} ${visit.time}` > `${current.date} ${current.time}`) profileMap.set(key, { ...visit, visitCount: (current?.visitCount || 0) + 1 });
      else current.visitCount += 1;
    });
    return [...profileMap.values()].sort((left, right) => left.name.localeCompare(right.name));
  }, [buildingVisits]);
  const selectedVisit = visits.find((visit) => visit.id === selectedVisitId);
  const passVisit = visits.find((visit) => visit.id === passVisitId);

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  function recordAudit(action, detail) {
    setAudit((current) => [{ id: `AUD-${Date.now()}`, time: new Date().toISOString(), actor: currentUser.name, action, detail }, ...current].slice(0, 150));
  }

  function openForm(kind, visit = null) {
    const base = { name: "", company: "", position: "", phone: "", identityNo: "", building: activeBuilding, opd: masters.opds[0], host: masters.employees[0], room: masters.rooms[0], purpose: masters.visitTypes[0], agenda: "", date: currentDate, time: "09:00", groupSize: 1, escort: "", consent: false, signed: false, photoName: "", invitationName: "" };
    if (visit) {
      setDraft({ ...base, ...visit });
      setEditingId(visit.id);
    } else {
      setDraft(base);
      setEditingId("");
    }
    setModal(kind);
  }

  function saveVisit(event) {
    event.preventDefault();
    if (!draft.name.trim()) return;
    if (editingId) {
      setVisits((current) => current.map((visit) => visit.id === editingId ? { ...visit, ...draft, name: draft.name.trim(), approvalStatus: "Pending", status: "Scheduled" } : visit));
      recordAudit("Jadwal diubah", `${draft.name} · ${formatDate(draft.date)}`);
      notify("Jadwal diperbarui dan menunggu persetujuan ulang");
    } else {
      const walkIn = modal === "walk-in";
      const visit = { ...draft, id: `BT-${Date.now().toString(36).toUpperCase()}`, name: draft.name.trim(), createdBy: currentUser.email, status: walkIn ? "Waiting" : "Scheduled", approvalStatus: walkIn ? "Approved" : "Pending", visitType: walkIn ? "walk-in" : "appointment", idVerified: false, createdAt: new Date().toISOString() };
      setVisits((current) => [visit, ...current]);
      recordAudit(walkIn ? "Tamu walk-in didaftarkan" : "Appointment dibuat", `${visit.name} · ${visit.opd}`);
      notify(walkIn ? "Tamu walk-in masuk antrean verifikasi" : "Appointment tercatat dan dikirim untuk persetujuan");
    }
    setModal("");
  }

  function updateVisit(id, changes, action, message) {
    const visit = visits.find((entry) => entry.id === id);
    if (!visit) return;
    setVisits((current) => current.map((entry) => entry.id === id ? { ...entry, ...changes } : entry));
    recordAudit(action, `${visit.name} · ${visit.id}`);
    if (message) notify(message);
  }

  function transitionVisit(id) {
    const visit = visits.find((entry) => entry.id === id);
    if (!visit) return;
    if (visit.status === "Scheduled" && visit.visitType !== "walk-in" && visit.approvalStatus !== "Approved") {
      notify("Appointment harus disetujui host sebelum check-in");
      return;
    }
    const next = { Waiting: "Checked-in", Scheduled: "Checked-in", "Checked-in": "In Meeting", "In Meeting": "Checked-out" }[visit.status];
    if (!next) return;
    const now = new Date().toISOString();
    const changes = { status: next, idVerified: next === "Checked-in" ? true : visit.idVerified };
    if (next === "Checked-in") changes.checkedInAt = now;
    if (next === "Checked-out") changes.checkedOutAt = now;
    updateVisit(id, changes, next === "Checked-in" ? "Identitas diverifikasi dan check-in" : next === "In Meeting" ? "Tamu bertemu host" : "Tamu check-out", `${visit.name}: ${STATUS_LABELS[next]}`);
  }

  function decideApproval(id, decision) {
    const visit = visits.find((entry) => entry.id === id);
    if (!visit) return;
    const changes = { approvalStatus: decision, status: decision === "Rejected" ? "Rejected" : "Scheduled", approvalAt: new Date().toISOString() };
    updateVisit(id, changes, decision === "Approved" ? "Appointment disetujui" : "Appointment ditolak", `${visit.name}: ${APPROVAL_LABELS[decision]}`);
  }

  function cancelVisit(id) {
    const visit = visits.find((entry) => entry.id === id);
    if (!visit) return;
    updateVisit(id, { status: "Cancelled", approvalStatus: "Rejected" }, "Kunjungan dibatalkan", `${visit.name} dibatalkan`);
  }

  function toggleWatchlist(id) {
    const visit = visits.find((entry) => entry.id === id);
    if (!visit) return;
    const key = personKey(visit);
    const exists = blacklist.includes(key);
    setBlacklist((current) => exists ? current.filter((entry) => entry !== key) : [key, ...current]);
    recordAudit(exists ? "Tamu dikeluarkan dari watchlist" : "Tamu ditambahkan ke watchlist", visit.name);
    notify(exists ? "Tamu dikeluarkan dari watchlist" : "Tamu masuk watchlist");
  }

  function submitKiosk(event) {
    event.preventDefault();
    const found = buildingVisits.find((visit) => visit.id.toLowerCase() === kioskId.trim().toLowerCase() || visit.identityNo === kioskId.trim());
    if (!found) {
      notify("Nomor appointment atau identitas tidak ditemukan");
      return;
    }
    if (blacklist.includes(personKey(found))) {
      notify("Perlu verifikasi petugas: tamu ada di watchlist");
      return;
    }
    if (found.approvalStatus !== "Approved") {
      notify("Appointment belum disetujui host");
      return;
    }
    transitionVisit(found.id);
    setKioskId("");
  }

  function exportCsv(rows = filteredVisits) {
    const fields = ["id", "name", "company", "position", "phone", "identityNo", "opd", "host", "room", "purpose", "agenda", "date", "time", "status", "approvalStatus", "groupSize", "escort"];
    const csv = [fields.join(","), ...rows.map((visit) => fields.map((field) => `"${String(visit[field] ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
    const objectUrl = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `laporan-kunjungan-${currentDate}.csv`;
    link.click();
    URL.revokeObjectURL(objectUrl);
    recordAudit("Laporan CSV diekspor", `${rows.length} record`);
  }

  function downloadBackup() {
    const backup = { app: "e-TAMU Baubau", version: 1, createdAt: new Date().toISOString(), visits, masters, blacklist, audit, preferences, feedback };
    const objectUrl = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `backup-etamu-${currentDate}.json`;
    link.click();
    URL.revokeObjectURL(objectUrl);
    recordAudit("Backup lokal diunduh", `${visits.length} record kunjungan`);
  }

  async function restoreBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      if (backup.app !== "e-TAMU Baubau" || !Array.isArray(backup.visits) || !backup.masters) throw new Error("Format backup tidak valid");
      setVisits(backup.visits);
      setMasters({ ...seedMasters, ...backup.masters });
      setBlacklist(Array.isArray(backup.blacklist) ? backup.blacklist : []);
      setAudit(Array.isArray(backup.audit) ? backup.audit : []);
      setPreferences(backup.preferences || { email: false, whatsapp: false, reminders: true, autoCheckout: false });
      recordAudit("Backup lokal dipulihkan", file.name);
      notify("Data backup berhasil dipulihkan pada browser ini");
    } catch {
      notify("File backup tidak valid atau tidak dapat dibaca");
    }
    event.target.value = "";
  }

  function addMasterItem(group) {
    const value = masterDraft.trim();
    if (!value) return;
    setMasters((current) => ({ ...current, [group]: [...current[group], value] }));
    recordAudit("Master data ditambah", value);
    setMasterDraft("");
    notify("Data master ditambahkan");
  }

  function removeMasterItem(group, value) {
    setMasters((current) => ({ ...current, [group]: current[group].filter((entry) => entry !== value) }));
    recordAudit("Master data dihapus", value);
  }

  function resetAccountForm() {
    setAccountDraft({ name: "", email: "", password: "", role: "user", building: masters.buildings[0] || BUILDINGS[0] });
    setEditingAccountId("");
  }

  function saveAccount(event) {
    event.preventDefault();
    const name = accountDraft.name.trim();
    const email = accountDraft.email.trim().toLowerCase();
    const existing = accounts.find((account) => account.id === editingAccountId);
    if (!name || !email || (!existing && !accountDraft.password)) return;
    if (accounts.some((account) => account.email.toLowerCase() === email && account.id !== editingAccountId)) {
      notify("Email sudah digunakan akun lain");
      return;
    }
    const updated = {
      id: existing?.id || `USR-${Date.now().toString(36).toUpperCase()}`,
      name,
      email,
      password: accountDraft.password || existing?.password,
      role: accountDraft.role,
      building: accountDraft.building || masters.buildings[0] || BUILDINGS[0],
      active: existing?.active !== false,
    };
    setAccounts((current) => existing ? current.map((account) => account.id === existing.id ? updated : account) : [...current, updated]);
    recordAudit(existing ? "Akun pengguna diperbarui" : "Akun pengguna dibuat", `${name} · ${roleDefinitionLabel(updated.role)}`);
    notify(existing ? "Perubahan akun disimpan" : "Akun pengguna dibuat");
    resetAccountForm();
  }

  function editAccount(account) {
    setAccountDraft({ name: account.name, email: account.email, password: "", role: account.role, building: account.building || masters.buildings[0] || BUILDINGS[0] });
    setEditingAccountId(account.id);
  }

  function toggleAccountActive(account) {
    if (account.id === "root-admin") return;
    setAccounts((current) => current.map((entry) => entry.id === account.id ? { ...entry, active: entry.active === false } : entry));
    recordAudit(account.active === false ? "Akun pengguna diaktifkan" : "Akun pengguna dinonaktifkan", account.email);
  }

  function deleteAccount(account) {
    if (account.id === "root-admin" || !window.confirm(`Hapus akun ${account.email}?`)) return;
    setAccounts((current) => current.filter((entry) => entry.id !== account.id));
    recordAudit("Akun pengguna dihapus", account.email);
    if (editingAccountId === account.id) resetAccountForm();
    notify("Akun pengguna dihapus");
  }

  function roleDefinitionLabel(roleId) {
    return USER_ROLES[roleId]?.label || "User Biasa";
  }

  const activeItem = navGroups.flatMap((group) => group.items).find((item) => item.id === activePage && allowedPages.includes(item.id)) || navGroups[0].items[0];
  const visibleNav = navGroups.map((group) => ({ ...group, items: group.items.filter((item) => allowedPages.includes(item.id)) })).filter((group) => group.items.length);
  const currentMonthVisits = buildingVisits.filter((visit) => visit.date?.startsWith(period) && !["Cancelled", "Rejected"].includes(visit.status));
  const opdsByCount = masters.opds.map((opd) => ({ label: opd, count: currentMonthVisits.filter((visit) => visit.opd === opd).length })).sort((a, b) => b.count - a.count);
  const maxOpdCount = Math.max(1, ...opdsByCount.map((item) => item.count));
  const activeDateLabel = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

  function renderOverview() {
    if (role === "user") {
      const ownRequests = buildingVisits.filter((visit) => visit.visitType !== "walk-in").sort((left, right) => `${right.date} ${right.time}`.localeCompare(`${left.date} ${left.time}`));
      return <>
        <section className="gov-summary-grid"><SummaryCard label="Permohonan saya" value={ownRequests.length} note="Janji kunjungan tercatat" color="mint" icon="calendar"/><SummaryCard label="Menunggu persetujuan" value={ownRequests.filter((visit) => visit.approvalStatus === "Pending").length} note="Sedang ditinjau host" color="amber" icon="clock"/><SummaryCard label="Disetujui" value={ownRequests.filter((visit) => visit.approvalStatus === "Approved").length} note="Siap untuk kunjungan" color="blue" icon="check"/><SummaryCard label="Lokasi tugas" value="1" note={activeBuilding} color="rose" icon="building"/></section>
        <section className="gov-panel"><div className="gov-panel-heading"><div><span className="section-kicker">PORTAL KUNJUNGAN</span><h2>Permohonan kunjungan saya</h2><p>Status janji yang dibuat oleh akun {currentUser.email}.</p></div><button className="primary-button" type="button" onClick={() => openForm("appointment")}><Icon name="plus" size={16}/> Buat janji</button></div><div className="my-request-list">{ownRequests.slice(0, 8).map((visit) => <div className="my-request-row" key={visit.id}><span className="request-date"><strong>{formatDate(visit.date, { day: "2-digit", month: "short" })}</strong><small>{visit.time || "—"}</small></span><span className="request-copy"><strong>{visit.name}</strong><small>{visit.opd} · {visit.purpose}</small></span><StatusBadge status={visit.status}/><span className={`approval-state approval-${(visit.approvalStatus || "Pending").toLowerCase()}`}>{APPROVAL_LABELS[visit.approvalStatus] || "Menunggu"}</span></div>)}{ownRequests.length === 0 && <div className="gov-empty"><Icon name="calendar" size={21}/><strong>Belum ada permohonan</strong><span>Janji kunjungan yang Anda buat akan tampil di sini.</span></div>}</div></section>
      </>;
    }
    if (role === "settings_admin") {
      return <>
        <section className="gov-summary-grid"><SummaryCard label="Akun aktif" value={accounts.filter((account) => account.active !== false).length} note="Semua role terdaftar" color="mint" icon="users"/><SummaryCard label="Gedung terkelola" value={masters.buildings.length} note="Master lokasi e-TAMU" color="amber" icon="building"/><SummaryCard label="OPD terdaftar" value={masters.opds.length} note="Data referensi" color="blue" icon="grid"/><SummaryCard label="Koneksi aktif" value={Number(preferences.email) + Number(preferences.whatsapp)} note="Integrasi notifikasi demo" color="rose" icon="plug"/></section>
        <section className="gov-panel role-home-panel"><div className="gov-panel-heading"><div><span className="section-kicker">PENGELOLAAN SISTEM</span><h2>Pengaturan e-TAMU</h2><p>Pilih area konfigurasi yang ingin dikelola.</p></div></div><div className="role-home-actions"><button type="button" onClick={() => setActivePage("masters")}><Icon name="building" size={18}/><span><strong>Master data</strong><small>Gedung, OPD, host, dan ruang</small></span><Icon name="arrow" size={15}/></button><button type="button" onClick={() => setActivePage("integrations")}><Icon name="plug" size={18}/><span><strong>Integrasi sistem</strong><small>Notifikasi dan preferensi</small></span><Icon name="arrow" size={15}/></button><button type="button" onClick={() => setActivePage("reports")}><Icon name="chart" size={18}/><span><strong>Laporan & analitik</strong><small>Ringkasan kunjungan per lokasi</small></span><Icon name="arrow" size={15}/></button></div></section>
      </>;
    }
    const awaiting = todayVisits.filter((visit) => ["Scheduled", "Waiting"].includes(visit.status)).slice(0, 4);
    return <>
      <section className="gov-summary-grid"><SummaryCard label="Sedang berada di kantor" value={onSiteVisits.length} note={`${onSiteVisits.filter((visit) => visit.status === "In Meeting").length} sedang bertemu host`} color="mint" icon="door"/><SummaryCard label="Janji hari ini" value={todayVisits.filter((visit) => visit.visitType !== "walk-in").length} note={`${pendingApprovals.length} menunggu persetujuan`} color="amber" icon="calendar"/><SummaryCard label="Menunggu check-in" value={todayVisits.filter((visit) => visit.status === "Waiting").length} note="Termasuk registrasi walk-in" color="blue" icon="clock"/><SummaryCard label="Kunjungan selesai" value={todayVisits.filter((visit) => visit.status === "Checked-out").length} note="Check-out hari ini" color="rose" icon="check"/></section>
      <div className="gov-dashboard-grid"><section className="gov-panel gov-main-panel"><div className="gov-panel-heading"><div><span className="section-kicker">FRONT OFFICE</span><h2>Tamu hari ini</h2><p>Daftar kedatangan dan status kunjungan di lingkungan Pemkot Baubau.</p></div><button className="outline-action" type="button" onClick={() => setActivePage("history")}>Lihat riwayat <Icon name="arrow" size={14}/></button></div><VisitTable visits={awaiting.length ? awaiting : todayVisits.slice(0, 4)} onInspect={setSelectedVisitId} onPass={setPassVisitId} onTransition={transitionVisit} blacklist={blacklist}/></section>
      <aside className="gov-side-stack"><section className="gov-panel compact-panel"><div className="gov-panel-heading"><div><span className="section-kicker">PERLU TINDAKAN</span><h2>Persetujuan</h2></div><span className="gov-count">{pendingApprovals.length}</span></div>{pendingApprovals.slice(0, 3).map((visit) => <div className="approval-preview" key={visit.id}><span className="approval-avatar">{visit.name.slice(0, 1)}</span><span className="preview-copy"><strong>{visit.name}</strong><small>{visit.opd} · {visit.time}</small></span><button className="mini-approve" type="button" aria-label={`Setujui ${visit.name}`} onClick={() => decideApproval(visit.id, "Approved")}>✓</button></div>)}{pendingApprovals.length === 0 && <p className="empty-inline">Semua janji sudah ditinjau.</p>}<button className="panel-footer-link" type="button" onClick={() => setActivePage("approvals")}>Buka antrean persetujuan <Icon name="arrow" size={14}/></button></section>
      <section className="gov-panel compact-panel"><div className="gov-panel-heading"><div><span className="section-kicker">DI LOKASI</span><h2>Sedang berkunjung</h2></div><span className="live-pulse"/></div>{onSiteVisits.slice(0, 4).map((visit) => <div className="onsite-preview" key={visit.id}><span className="presence-dot"/><span className="preview-copy"><strong>{visit.name}</strong><small>{visit.host} · {getDuration(visit)}</small></span><StatusBadge status={visit.status}/></div>)}{onSiteVisits.length === 0 && <p className="empty-inline">Tidak ada tamu di lokasi.</p>}<button className="panel-footer-link" type="button" onClick={() => setActivePage("evacuation")}>Buka daftar evakuasi <Icon name="arrow" size={14}/></button></section></aside></div>
    </>;
  }

  function renderVisitorDatabase() {
    return <section className="gov-panel"><div className="gov-panel-heading"><div><span className="section-kicker">PROFIL & RIWAYAT</span><h2>Database tamu</h2><p>{profiles.length} profil unik · {visits.length} catatan kunjungan tersimpan di perangkat ini.</p></div><button className="primary-button" type="button" onClick={() => openForm("walk-in")}><Icon name="plus" size={16}/> Registrasi tamu</button></div><div className="gov-toolbar"><label className="gov-search"><Icon name="search" size={16}/><input aria-label="Cari profil tamu" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, instansi, nomor identitas..."/></label><label className="gov-select-label"><span>OPD tujuan</span><select value={opdFilter} onChange={(event) => setOpdFilter(event.target.value)}><option>Semua OPD</option>{masters.opds.map((opd) => <option key={opd}>{opd}</option>)}</select></label></div><div className="gov-table-wrap"><table className="gov-table"><thead><tr><th>PROFIL TAMU</th><th>KONTAK / IDENTITAS</th><th>OPD TERAKHIR</th><th>JUMLAH KUNJUNGAN</th><th>STATUS</th><th>AKSI</th></tr></thead><tbody>{profiles.filter((profile) => `${profile.name} ${profile.company} ${profile.identityNo} ${profile.opd}`.toLowerCase().includes(search.trim().toLowerCase()) && (opdFilter === "Semua OPD" || profile.opd === opdFilter)).map((profile) => { const watchlisted = blacklist.includes(personKey(profile)); return <tr key={personKey(profile)}><td><button className="gov-visitor-cell" type="button" onClick={() => setSelectedVisitId(profile.id)}><span className="gov-initials tone-green">{profile.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><span><strong>{profile.name}</strong><small>{profile.position || "Jabatan tidak dicantumkan"} · {profile.company}</small></span></button></td><td><span className="gov-secondary-cell"><strong>{profile.phone || "Kontak belum ada"}</strong><small>{profile.identityNo || "Identitas belum diverifikasi"}</small></span></td><td>{profile.opd}</td><td>{profile.visitCount}</td><td>{watchlisted ? <span className="watch-status">Watchlist</span> : <span className="approval-state approval-approved">Aktif</span>}</td><td><button className="mini-action" type="button" onClick={() => toggleWatchlist(profile.id)}>{watchlisted ? "Pulihkan" : "Tandai"}</button></td></tr>; })}</tbody></table></div></section>;
  }

  function renderHistory() {
    const rows = buildingVisits.filter((visit) => (statusFilter === "Semua status" || visit.status === statusFilter) && (opdFilter === "Semua OPD" || visit.opd === opdFilter) && `${visit.name} ${visit.company} ${visit.id} ${visit.host}`.toLowerCase().includes(search.trim().toLowerCase()));
    return <section className="gov-panel"><div className="gov-panel-heading"><div><span className="section-kicker">DATABASE KUNJUNGAN</span><h2>Riwayat kunjungan</h2><p>Telusuri seluruh registrasi, check-in, appointment, dan check-out.</p></div><button className="outline-action" type="button" onClick={() => exportCsv(rows)}><Icon name="download" size={15}/> Ekspor CSV</button></div><div className="gov-toolbar"><label className="gov-search"><Icon name="search" size={16}/><input aria-label="Cari riwayat" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari tamu, ID, host, instansi..."/></label><select aria-label="Filter status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Semua status</option>{Object.keys(STATUS_LABELS).map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select><select aria-label="Filter OPD" value={opdFilter} onChange={(event) => setOpdFilter(event.target.value)}><option>Semua OPD</option>{masters.opds.map((opd) => <option key={opd}>{opd}</option>)}</select></div><VisitTable visits={rows} onInspect={setSelectedVisitId} onPass={setPassVisitId} onTransition={transitionVisit} blacklist={blacklist}/></section>;
  }

  function renderAppointments() {
    return <section className="gov-panel"><div className="gov-panel-heading"><div><span className="section-kicker">BOOKING KUNJUNGAN</span><h2>Janji kunjungan</h2><p>Atur jadwal, host, ruang, agenda, rombongan, dan perubahan kunjungan.</p></div><button className="primary-button" type="button" onClick={() => openForm("appointment")}><Icon name="plus" size={16}/> Buat janji</button></div><div className="gov-toolbar"><label className="gov-search"><Icon name="search" size={16}/><input aria-label="Cari janji kunjungan" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, host, agenda..."/></label><select aria-label="Filter status janji" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Semua status</option>{Object.keys(STATUS_LABELS).map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select><label className="gov-select-label"><span>OPD tujuan</span><select value={opdFilter} onChange={(event) => setOpdFilter(event.target.value)}><option>Semua OPD</option>{masters.opds.map((opd) => <option key={opd}>{opd}</option>)}</select></label></div><VisitTable visits={filteredVisits} onInspect={setSelectedVisitId} onPass={setPassVisitId} onTransition={transitionVisit} onReschedule={(id) => { const visit = visits.find((entry) => entry.id === id); if (visit) openForm("reschedule", visit); }} onCancel={cancelVisit} showBookingActions showApproval blacklist={blacklist}/></section>;
  }

  function renderApprovals() {
    return <section className="gov-panel"><div className="gov-panel-heading"><div><span className="section-kicker">TINJAUAN HOST / PEJABAT</span><h2>Persetujuan kunjungan</h2><p>Setujui atau tolak appointment, termasuk catatan alasan untuk audit.</p></div><span className="approval-counter">{pendingApprovals.length} antrean</span></div><VisitTable visits={pendingApprovals} onInspect={setSelectedVisitId} onPass={setPassVisitId} onTransition={transitionVisit} showApproval onApprove={(id) => decideApproval(id, "Approved")} onReject={(id) => decideApproval(id, "Rejected")} blacklist={blacklist}/><div className="gov-note"><Icon name="shield" size={16}/><span>Persetujuan dicatat di audit trail lokal. Notifikasi email/WhatsApp belum terhubung.</span></div></section>;
  }

  function renderFrontDesk() {
    const waiting = buildingVisits.filter((visit) => ["Waiting", "Scheduled"].includes(visit.status) && visit.date === currentDate && visit.approvalStatus === "Approved");
    return <div className="frontdesk-layout"><section className="gov-panel kiosk-panel"><div className="kiosk-emblem"><Icon name="door" size={27}/></div><span className="section-kicker">KIOSK MODE</span><h2>Check-in mandiri di lobby</h2><p>Tamu dapat memasukkan ID appointment atau nomor identitas. Petugas tetap perlu memverifikasi dokumen fisik.</p><form className="kiosk-form" onSubmit={submitKiosk}><label htmlFor="kiosk-id">ID janji / nomor identitas</label><input id="kiosk-id" value={kioskId} onChange={(event) => setKioskId(event.target.value)} placeholder="Contoh: BT-26002" required/><button className="primary-button" type="submit"><Icon name="check" size={16}/> Verifikasi & check-in</button></form><div className="kiosk-secondary-actions"><button className="outline-action" type="button" onClick={() => openForm("walk-in")}><Icon name="plus" size={15}/> Registrasi walk-in</button><button className="outline-action" type="button" onClick={() => setToolsOpen(true)}><Icon name="qr" size={15}/> QR check-in</button></div><p className="privacy-inline">Mode kiosk demo ini tidak mengunci perangkat. Gunakan perangkat terkelola pada produksi.</p></section><section className="gov-panel waiting-panel"><div className="gov-panel-heading"><div><span className="section-kicker">ANTREAN LOBI</span><h2>Siap check-in</h2><p>{waiting.length} appointment disetujui menunggu kedatangan.</p></div></div><VisitTable visits={waiting} onInspect={setSelectedVisitId} onPass={setPassVisitId} onTransition={transitionVisit} blacklist={blacklist}/></section></div>;
  }

  function renderEvacuation() {
    return <section className="gov-panel evacuation-panel"><div className="evacuation-banner"><span className="evacuation-icon"><Icon name="shield" size={21}/></span><div><span className="section-kicker">STATUS SAAT INI</span><h2>Daftar evakuasi</h2><p>Daftar tamu dengan status menunggu, check-in, atau sedang bertemu.</p></div><strong>{onSiteVisits.length}<small>orang</small></strong></div><div className="evacuation-warning"><span className="live-pulse"/>Data lokal perangkat ini · verifikasi dengan petugas keamanan sebelum digunakan pada keadaan darurat.</div><VisitTable visits={onSiteVisits} onInspect={setSelectedVisitId} onPass={setPassVisitId} onTransition={transitionVisit} blacklist={blacklist}/><div className="gov-panel-bottom"><button className="outline-action" type="button" onClick={() => exportCsv(onSiteVisits)}><Icon name="download" size={15}/> Ekspor daftar</button><button className="print-action" type="button" onClick={() => window.print()}>Cetak daftar evakuasi</button></div></section>;
  }

  function renderReports() {
    const purposeCounts = PURPOSES.map((purpose) => ({ label: purpose, count: currentMonthVisits.filter((visit) => visit.purpose === purpose).length })).filter((item) => item.count).sort((a, b) => b.count - a.count);
    const companyCounts = Object.entries(currentMonthVisits.reduce((counts, visit) => { const key = visit.company || "Tidak diketahui"; counts[key] = (counts[key] || 0) + 1; return counts; }, {})).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    return <><section className="gov-summary-grid report-summary"><SummaryCard label="Total kunjungan periode" value={currentMonthVisits.length} note={formatDate(`${period}-01`, { month: "long", year: "numeric" })} color="mint" icon="users"/><SummaryCard label="Appointment disetujui" value={currentMonthVisits.filter((visit) => visit.approvalStatus === "Approved").length} note="Termasuk kunjungan terjadwal" color="blue" icon="check"/><SummaryCard label="Total tamu di lokasi" value={onSiteVisits.length} note="Status live dari perangkat" color="amber" icon="door"/><SummaryCard label="OPD aktif" value={new Set(currentMonthVisits.map((visit) => visit.opd)).size} note="OPD dengan catatan periode ini" color="rose" icon="building"/></section><section className="gov-panel report-panel"><div className="gov-panel-heading"><div><span className="section-kicker">ANALITIK KUNJUNGAN</span><h2>Laporan kunjungan</h2><p>Statistik per OPD, instansi, dan tujuan kunjungan.</p></div><div className="report-actions"><input aria-label="Pilih periode laporan" type="month" value={period} onChange={(event) => setPeriod(event.target.value)}/><button className="outline-action" type="button" onClick={() => exportCsv(currentMonthVisits)}><Icon name="download" size={15}/> Excel / CSV</button><button className="outline-action" type="button" onClick={() => window.print()}>Cetak / PDF</button></div></div><div className="report-tabs"><button className={reportTab === "ringkasan" ? "selected" : ""} type="button" onClick={() => setReportTab("ringkasan")}>Per OPD</button><button className={reportTab === "instansi" ? "selected" : ""} type="button" onClick={() => setReportTab("instansi")}>Per instansi</button><button className={reportTab === "tujuan" ? "selected" : ""} type="button" onClick={() => setReportTab("tujuan")}>Tujuan kunjungan</button></div><div className="bar-report">{(reportTab === "ringkasan" ? opdsByCount : reportTab === "instansi" ? companyCounts : purposeCounts).map((item) => <div className="bar-row" key={item.label}><span title={item.label}>{item.label}</span><div className="bar-track"><i style={{ width: `${Math.max(5, item.count / maxOpdCount * 100)}%` }}/></div><strong>{item.count}</strong></div>)}{currentMonthVisits.length === 0 && <p className="empty-inline">Belum ada data untuk periode ini.</p>}</div><div className="report-footnote">Laporan dihitung dari record pada perangkat ini. PDF menggunakan dialog cetak browser.</div></section></>;
  }

  function renderFeedback() {
    const average = feedback.length ? (feedback.reduce((total, item) => total + item.rating, 0) / feedback.length).toFixed(1) : "—";
    return <><section className="gov-summary-grid"><SummaryCard label="Masukan diterima" value={feedback.length} note="Tersimpan di browser ini" color="mint" icon="check"/><SummaryCard label="Rata-rata kepuasan" value={average} note="Skala 1–5" color="amber" icon="chart"/><SummaryCard label="Perlu tindak lanjut" value={feedback.filter((item) => item.category === "Pengaduan").length} note="Kategori pengaduan" color="rose" icon="shield"/><SummaryCard label="Watchlist" value={blacklist.length} note="Identitas pada daftar pengawasan" color="blue" icon="users"/></section><section className="gov-panel feedback-panel"><div className="gov-panel-heading"><div><span className="section-kicker">PENGALAMAN PENGUNJUNG</span><h2>Feedback & pengaduan</h2><p>Masukan dari form publik pada perangkat ini.</p></div><a className="outline-action" href={`${window.location.origin}${window.location.pathname}?flow=feedback`} target="_blank" rel="noreferrer">Buka form feedback</a></div><div className="feedback-list">{feedback.map((item) => <article className="feedback-row" key={item.id}><div className="feedback-row-top"><strong>{item.name || "Tamu"}</strong><span>{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</span><small>{item.category} · {formatDate(item.date)}</small></div><p>{item.message || "Tidak ada catatan tambahan."}</p><small>{item.visitId ? `Kunjungan ${item.visitId}` : "Masukan umum"}</small></article>)}{feedback.length === 0 && <div className="gov-empty"><Icon name="check" size={21}/><strong>Belum ada masukan</strong><span>Feedback akan tampil setelah pengunjung mengirim form publik.</span></div>}</div></section></>;
  }

  function renderBackupPanel() {
    return <section className="gov-panel backup-panel"><div><span className="section-kicker">PORTABILITAS DATA DEMO</span><h2>Backup & pemulihan lokal</h2><p>Ekspor record, master data, watchlist, audit, dan preferensi menjadi satu file JSON. File pemulihan akan menggantikan data prototype pada browser ini.</p></div><div className="backup-actions"><button className="outline-action" type="button" onClick={downloadBackup}><Icon name="download" size={15}/> Unduh backup JSON</button><label className="outline-action">Pulihkan backup<input type="file" accept="application/json,.json" onChange={restoreBackup}/></label></div></section>;
  }

  function renderMasters() {
    const groups = [{ id: "buildings", label: "Master gedung" }, { id: "opds", label: "Master OPD" }, { id: "employees", label: "Pegawai / host" }, { id: "rooms", label: "Ruang pertemuan" }, { id: "visitTypes", label: "Jenis kunjungan" }];
    return <div className="master-grid">{groups.map((group) => <section className="gov-panel master-panel" key={group.id}><div className="gov-panel-heading"><div><span className="section-kicker">DATA REFERENSI</span><h2>{group.label}</h2><p>{masters[group.id].length} item terdaftar.</p></div></div><form className="master-add" onSubmit={(event) => { event.preventDefault(); addMasterItem(group.id); }}><input aria-label={`Tambah ${group.label}`} value={masterDraft} onChange={(event) => setMasterDraft(event.target.value)} placeholder={`Nama ${group.label.toLowerCase()}`} required/><button type="submit" aria-label={`Tambah ke ${group.label}`}><Icon name="plus" size={16}/></button></form><ul className="master-list">{masters[group.id].map((item) => <li key={item}><span>{item}</span><button type="button" aria-label={`Hapus ${item}`} onClick={() => removeMasterItem(group.id, item)}>×</button></li>)}</ul></section>)}</div>;
  }

  function renderUsers() {
    return <div className="admin-layout user-admin-layout">
      <section className="gov-panel account-panel">
        <div className="gov-panel-heading"><div><span className="section-kicker">AKSES PENGGUNA</span><h2>Manajemen akun</h2><p>{accounts.length} akun terdaftar · perubahan disimpan pada browser ini.</p></div></div>
        <div className="access-level-list">{Object.entries(USER_ROLES).map(([roleId, definition]) => <div className="access-level-row" key={roleId}><strong>{definition.label}</strong><span>{roleId === "superadmin" ? "Seluruh fitur dan akun" : roleId === "settings_admin" ? "Ringkasan, laporan, master data, dan integrasi" : roleId === "location_admin" ? "Operasional dan laporan pada satu gedung" : "Ajukan serta pantau janji kunjungan sendiri"}</span></div>)}</div>
        <form className="account-form" onSubmit={saveAccount}>
          <div className="account-form-heading"><strong>{editingAccountId ? "Ubah akun" : "Tambah akun"}</strong>{editingAccountId && <button type="button" onClick={resetAccountForm}>Batal</button>}</div>
          <div className="account-form-grid">
            <label>Nama pengguna<input required maxLength={90} value={accountDraft.name} onChange={(event) => setAccountDraft({ ...accountDraft, name: event.target.value })} placeholder="Nama lengkap" /></label>
            <label>Email<input required type="email" autoComplete="off" value={accountDraft.email} onChange={(event) => setAccountDraft({ ...accountDraft, email: event.target.value })} placeholder="nama@instansi.go.id" /></label>
            <label>Kata sandi<input type="password" autoComplete="new-password" required={!editingAccountId} value={accountDraft.password} onChange={(event) => setAccountDraft({ ...accountDraft, password: event.target.value })} placeholder={editingAccountId ? "Kosongkan untuk tetap memakai sandi lama" : "Buat kata sandi"} /></label>
            <label>Level akses<select value={accountDraft.role} onChange={(event) => setAccountDraft({ ...accountDraft, role: event.target.value })}>{Object.entries(USER_ROLES).filter(([roleId]) => roleId !== "superadmin").map(([roleId, definition]) => <option key={roleId} value={roleId}>{definition.label}</option>)}</select></label>
            {accountDraft.role !== "settings_admin" && <label>Gedung / lokasi<select value={accountDraft.building} onChange={(event) => setAccountDraft({ ...accountDraft, building: event.target.value })}>{masters.buildings.map((building) => <option key={building}>{building}</option>)}</select></label>}
          </div>
          <button className="primary-button" type="submit"><Icon name="plus" size={15}/>{editingAccountId ? "Simpan perubahan" : "Buat akun"}</button>
        </form>
        <div className="gov-table-wrap"><table className="gov-table account-table"><thead><tr><th>PENGGUNA</th><th>LEVEL AKSES</th><th>LOKASI</th><th>STATUS</th><th>AKSI</th></tr></thead><tbody>{accounts.map((account) => <tr key={account.id}><td><span className="account-person"><strong>{account.name}</strong><small>{account.email}</small></span></td><td><span className={`role-badge role-${account.role}`}>{roleDefinitionLabel(account.role)}</span></td><td>{account.role === "settings_admin" || account.role === "superadmin" ? "Semua lokasi" : account.building}</td><td><span className={`approval-state ${account.active === false ? "approval-rejected" : "approval-approved"}`}>{account.active === false ? "Nonaktif" : "Aktif"}</span></td><td><div className="account-actions"><button className="mini-action" type="button" disabled={account.id === "root-admin"} onClick={() => editAccount(account)}>Ubah</button><button className="mini-action" type="button" disabled={account.id === "root-admin"} onClick={() => toggleAccountActive(account)}>{account.active === false ? "Aktifkan" : "Nonaktifkan"}</button><button className="mini-icon reject" type="button" aria-label={`Hapus akun ${account.email}`} title="Hapus akun" disabled={account.id === "root-admin"} onClick={() => deleteAccount(account)}>×</button></div></td></tr>)}</tbody></table></div>
      </section>
      <section className="gov-panel audit-panel"><div className="gov-panel-heading"><div><span className="section-kicker">AUDIT TRAIL</span><h2>Aktivitas administrator</h2><p>{audit.length} aksi terakhir tersimpan lokal.</p></div></div><div className="audit-list">{audit.slice(0, 12).map((entry) => <div className="audit-row" key={entry.id}><span className="audit-marker"/><span><strong>{entry.action}</strong><small>{entry.actor} · {entry.detail}</small></span><time>{new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(entry.time))}</time></div>)}{audit.length === 0 && <p className="empty-inline">Aksi administratif akan tercatat di sini.</p>}</div></section>
    </div>;
  }

  function renderIntegrations() {
    const integrations = [{ label: "Email transaksional", detail: "Undangan, approval, dan reminder appointment", state: preferences.email }, { label: "WhatsApp Business", detail: "Notifikasi host dan pengingat kunjungan", state: preferences.whatsapp }, { label: "OCR KTP", detail: "Ekstraksi field identitas setelah verifikasi legal", state: false }, { label: "Face photo matching", detail: "Belum aktif · memerlukan kajian privasi dan persetujuan", state: false }, { label: "API SIMPEG / agenda", detail: "Integrasi pegawai dan kalender Pemkot", state: false }, { label: "Backup database", detail: "Belum tersedia pada mode localStorage", state: false }];
    return <section className="gov-panel integrations-panel"><div className="gov-panel-heading"><div><span className="section-kicker">KONFIGURASI KONEKTOR</span><h2>Integrasi sistem</h2><p>Status koneksi nyata memerlukan endpoint, kredensial, dan persetujuan keamanan.</p></div></div><div className="integration-list">{integrations.map((integration) => <div className="integration-row" key={integration.label}><span className={`integration-icon ${integration.state ? "connected" : ""}`}><Icon name="plug" size={17}/></span><span className="integration-copy"><strong>{integration.label}</strong><small>{integration.detail}</small></span><span className={`integration-state ${integration.state ? "connected" : ""}`}>{integration.state ? "Aktif (demo)" : "Belum terhubung"}</span></div>)}</div><div className="notification-settings"><h3>Preferensi notifikasi (prototype)</h3><label><input type="checkbox" checked={preferences.email} onChange={(event) => setPreferences((current) => ({ ...current, email: event.target.checked }))}/> Email</label><label><input type="checkbox" checked={preferences.whatsapp} onChange={(event) => setPreferences((current) => ({ ...current, whatsapp: event.target.checked }))}/> WhatsApp</label><label><input type="checkbox" checked={preferences.reminders} onChange={(event) => setPreferences((current) => ({ ...current, reminders: event.target.checked }))}/> Reminder</label><label><input type="checkbox" checked={preferences.autoCheckout} onChange={(event) => setPreferences((current) => ({ ...current, autoCheckout: event.target.checked }))}/> Auto check-out (simulasi)</label></div><div className="gov-note"><Icon name="shield" size={16}/><span>Jangan simpan foto KTP atau data sensitif pada localStorage untuk penggunaan produksi. Terapkan kontrol akses, enkripsi, retensi, dan persetujuan privasi.</span></div></section>;
  }

  function renderPage() {
    if (!allowedPages.includes(activePage)) return renderOverview();
    if (activePage === "overview") return renderOverview();
    if (activePage === "visitors") return renderVisitorDatabase();
    if (activePage === "history") return renderHistory();
    if (activePage === "appointments") return renderAppointments();
    if (activePage === "approvals") return renderApprovals();
    if (activePage === "frontdesk") return renderFrontDesk();
    if (activePage === "evacuation") return renderEvacuation();
    if (activePage === "reports") return renderReports();
    if (activePage === "feedback") return renderFeedback();
    if (activePage === "masters") return renderMasters();
    if (activePage === "users" && canManageUsers) return renderUsers();
    return renderIntegrations();
  }

  const activePersonHistory = selectedVisit ? buildingVisits.filter((visit) => personKey(visit) === personKey(selectedVisit)) : [];

  return <div className="baubau-app">
    <aside className="gov-sidebar"><a className="gov-brand" href="#beranda" onClick={() => setActivePage("overview")}><span className="gov-brand-emblem"><Icon name="building" size={20}/></span><span><strong>e-TAMU</strong><small>PEMKOT BAUBAU</small></span></a><div className="gov-workspace"><span className="city-seal">B</span><span><strong>Pemerintah Kota Baubau</strong><small>Sistem manajemen kunjungan</small></span></div>{visibleNav.map((group) => <div className="gov-nav-group" key={group.title}><span className="gov-nav-title">{group.title}</span>{group.items.map((item) => <button className={`gov-nav-item ${activePage === item.id ? "active" : ""}`} type="button" key={item.id} aria-label={item.label} title={item.label} onClick={() => { setActivePage(item.id); setSearch(""); }}><Icon name={item.icon} size={16}/><span>{item.label}</span>{item.id === "approvals" && pendingApprovals.length > 0 && <b>{pendingApprovals.length}</b>}</button>)}</div>)}<div className="gov-sidebar-footer"><span className="connection-mark"/><span>Mode prototype · data lokal</span><small>v0.2.0</small></div></aside>
    <main className="gov-main"><header className="gov-topbar"><div className="gov-breadcrumb"><span>Baubau</span><span>/</span><strong>{activeItem.label}</strong></div><div className="gov-top-actions"><span className="today-date">{activeDateLabel}</span>
  {canChangeBuilding ? <label className="building-switch"><span>Gedung</span><select aria-label="Gedung aktif" value={activeBuilding} onChange={(event) => setActiveBuilding(event.target.value)}>{masters.buildings.map((building) => <option key={building}>{building}</option>)}</select></label> : <span className="building-current"><small>Lokasi akses</small><strong>{activeBuilding}</strong></span>}
  <span className={`role-chip role-${role}`}>{roleDefinition.label}</span><button className="gov-user-avatar" type="button" title={currentUser.email}>{currentUser.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</button><button className="logout-button" type="button" onClick={onLogout}>Keluar</button></div></header>
      <div className="gov-page-content"><section className="gov-page-heading"><div><span className="gov-eyebrow">PEMERINTAH KOTA BAUBAU · {activeDateLabel.toUpperCase()}</span><h1>{activePage === "overview" ? role === "user" ? `Selamat datang, ${currentUser.name}` : role === "settings_admin" ? "Pengaturan e-TAMU" : role === "location_admin" ? "Operasional lokasi" : "Pusat kendali kunjungan" : activeItem.label}</h1><p>{activePage === "overview" ? role === "user" ? "Ajukan janji kunjungan dan pantau status permohonan Anda." : role === "settings_admin" ? "Kelola konfigurasi, data referensi, dan laporan seluruh lokasi." : role === "location_admin" ? `Pantau dan kelola kunjungan di ${activeBuilding}.` : "Pantau kedatangan tamu, jadwal OPD, dan kondisi gedung hari ini." : `Kelola ${activeItem.label.toLowerCase()}${role === "user" ? " Anda" : ` untuk ${activeBuilding}`}.`}</p></div><div className="gov-heading-actions">{["superadmin", "location_admin"].includes(role) && <button className="outline-action" type="button" onClick={() => setToolsOpen(true)}><Icon name="qr" size={15}/> QR & tautan</button>}{["superadmin", "location_admin"].includes(role) && ["overview", "visitors", "frontdesk"].includes(activePage) && <button className="primary-button" type="button" onClick={() => openForm(activePage === "frontdesk" ? "walk-in" : "appointment")}><Icon name="plus" size={16}/>{activePage === "frontdesk" ? "Daftarkan walk-in" : "Buat kunjungan"}</button>}</div></section>
      {renderPage()}
      {activePage === "reports" && <YearTrend visits={buildingVisits} year={period.slice(0, 4)}/>} 
      {activePage === "integrations" && renderBackupPanel()}
      <footer className="gov-footer"><span>e-TAMU Baubau · Prototype interaktif</span><span>Data pada perangkat ini · bukan sistem produksi</span></footer></div></main>

    {modal && <div className="gov-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(""); }}><section className="gov-modal" role="dialog" aria-modal="true" aria-labelledby="visit-modal-title"><header className="gov-modal-header"><div><span className="section-kicker">{modal === "walk-in" ? "REGISTRASI FRONT OFFICE" : modal === "reschedule" ? "PERUBAHAN JADWAL" : "PRE-REGISTRATION"}</span><h2 id="visit-modal-title">{editingId ? "Jadwalkan ulang kunjungan" : modal === "walk-in" ? "Registrasi tamu walk-in" : "Buat janji kunjungan"}</h2><p>Data demo disimpan pada browser ini. Verifikasi fisik tetap dilakukan petugas.</p></div><button className="modal-close" type="button" aria-label="Tutup" onClick={() => setModal("")}><Icon name="close"/></button></header><form className="gov-visit-form" onSubmit={saveVisit}><div className="gov-form-grid"><label>Nama lengkap tamu<input required maxLength={90} autoFocus value={draft.name || ""} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Nama sesuai identitas"/></label><label>Instansi / perusahaan<input value={draft.company || ""} onChange={(event) => setDraft({ ...draft, company: event.target.value })} placeholder="Asal instansi"/></label><label>Jabatan<input value={draft.position || ""} onChange={(event) => setDraft({ ...draft, position: event.target.value })} placeholder="Jabatan tamu"/></label><label>Nomor kontak<input inputMode="tel" value={draft.phone || ""} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} placeholder="08xx..."/></label><label>Nomor identitas<input value={draft.identityNo || ""} onChange={(event) => setDraft({ ...draft, identityNo: event.target.value })} placeholder="NIK / paspor"/></label><label>OPD tujuan<select value={draft.opd || ""} onChange={(event) => setDraft({ ...draft, opd: event.target.value })}>{masters.opds.map((opd) => <option key={opd}>{opd}</option>)}</select></label><label>Pegawai / host<select value={draft.host || ""} onChange={(event) => setDraft({ ...draft, host: event.target.value })}>{masters.employees.map((employee) => <option key={employee}>{employee}</option>)}</select></label><label>Ruang / lokasi<select value={draft.room || ""} onChange={(event) => setDraft({ ...draft, room: event.target.value })}>{masters.rooms.map((room) => <option key={room}>{room}</option>)}</select></label><label>Jenis keperluan<select value={draft.purpose || ""} onChange={(event) => setDraft({ ...draft, purpose: event.target.value })}>{masters.visitTypes.map((purpose) => <option key={purpose}>{purpose}</option>)}</select></label><label>Tanggal kunjungan<input required type="date" min={currentDate} value={draft.date || currentDate} onChange={(event) => setDraft({ ...draft, date: event.target.value })}/></label><label>Waktu kedatangan<input required type="time" value={draft.time || "09:00"} onChange={(event) => setDraft({ ...draft, time: event.target.value })}/></label><label>Jumlah rombongan<input type="number" min="1" max="100" value={draft.groupSize || 1} onChange={(event) => setDraft({ ...draft, groupSize: Number(event.target.value) })}/></label><label>Pendamping<input value={draft.escort || ""} onChange={(event) => setDraft({ ...draft, escort: event.target.value })} placeholder="Nama petugas pendamping"/></label><label className="form-span-two">Agenda / maksud kunjungan<textarea rows="2" value={draft.agenda || ""} onChange={(event) => setDraft({ ...draft, agenda: event.target.value })} placeholder="Ringkasan kegiatan atau hal yang akan dibahas"/></label><label className="form-span-two upload-field">Surat undangan / foto tamu<input type="file" accept="image/*,.pdf" capture="user" onChange={(event) => setDraft({ ...draft, photoName: event.target.files?.[0]?.name || "" })}/><small>{draft.photoName ? `Berkas dipilih: ${draft.photoName}` : "Lampiran hanya dicatat di UI prototype, tidak diunggah ke server."}</small></label></div><div className="verification-row"><label><input type="checkbox" checked={Boolean(draft.idVerified)} onChange={(event) => setDraft({ ...draft, idVerified: event.target.checked })}/> Identitas fisik telah diperiksa</label><label><input type="checkbox" checked={Boolean(draft.consent)} onChange={(event) => setDraft({ ...draft, consent: event.target.checked })}/> Tamu menyetujui kebijakan data kunjungan</label></div><SignaturePad onChange={(signed) => setDraft((current) => ({ ...current, signed }))}/><div className="gov-modal-actions"><button className="cancel-button" type="button" onClick={() => setModal("")}>Batal</button><button className="primary-button" type="submit"><Icon name="check" size={15}/>{editingId ? "Simpan perubahan" : modal === "walk-in" ? "Daftarkan tamu" : "Kirim untuk persetujuan"}</button></div></form></section></div>}

    {selectedVisit && <div className="gov-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedVisitId(""); }}><section className="gov-modal detail-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title"><header className="gov-modal-header"><div><span className="section-kicker">PROFIL TAMU · {selectedVisit.id}</span><h2 id="profile-title">{selectedVisit.name}</h2><p>{selectedVisit.position || "Jabatan tidak dicantumkan"} · {selectedVisit.company || "Instansi tidak dicantumkan"}</p></div><button className="modal-close" type="button" aria-label="Tutup profil" onClick={() => setSelectedVisitId("")}><Icon name="close"/></button></header><div className="profile-detail-grid"><div><span>NOMOR KONTAK</span><strong>{selectedVisit.phone || "Belum dicatat"}</strong></div><div><span>IDENTITAS</span><strong>{selectedVisit.identityNo || "Belum dicatat"} {selectedVisit.idVerified ? "· Terverifikasi" : "· Belum diverifikasi"}</strong></div><div><span>OPD / PEGAWAI TUJUAN</span><strong>{selectedVisit.opd} · {selectedVisit.host}</strong></div><div><span>KEPERLUAN / LOKASI</span><strong>{selectedVisit.purpose} · {selectedVisit.room}</strong></div></div><h3 className="history-heading">Riwayat tamu ({activePersonHistory.length})</h3><div className="profile-history">{activePersonHistory.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)).map((visit) => <div key={visit.id}><span><strong>{formatDate(visit.date)} · {visit.time}</strong><small>{visit.opd} · {visit.agenda || visit.purpose}</small></span><StatusBadge status={visit.status}/></div>)}</div><div className="gov-modal-actions"><button className="outline-action" type="button" onClick={() => { toggleWatchlist(selectedVisit.id); }}> {blacklist.includes(personKey(selectedVisit)) ? "Keluarkan dari watchlist" : "Tandai watchlist"}</button><button className="primary-button" type="button" onClick={() => { openForm("reschedule", selectedVisit); setSelectedVisitId(""); }}>Ubah appointment</button></div></section></div>}

    {passVisit && <div className="gov-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPassVisitId(""); }}><section className="gov-modal pass-modal" role="dialog" aria-modal="true" aria-labelledby="pass-title"><header className="gov-modal-header"><div><span className="section-kicker">VISITOR PASS DIGITAL</span><h2 id="pass-title">Kartu kunjungan</h2><p>QR demo untuk identifikasi/check-out. Tidak menggantikan kartu akses gedung.</p></div><button className="modal-close" type="button" aria-label="Tutup pass" onClick={() => setPassVisitId("")}><Icon name="close"/></button></header><div className="visitor-pass-card"><span className="pass-city">PEMKOT BAUBAU · E-TAMU</span><strong>{passVisit.name}</strong><span>{passVisit.opd} · {passVisit.host}</span><span>{passVisit.id} · {formatDate(passVisit.date)} · {passVisit.time}</span><QRCodeSVG value={`${window.location.origin}/?flow=checkout&id=${encodeURIComponent(passVisit.id)}`} size={176} level="M" includeMargin/><small>Pindai saat keluar untuk check-out demo</small></div><div className="gov-modal-actions"><button className="outline-action" type="button" onClick={() => window.print()}>Cetak pass</button><button className="primary-button" type="button" onClick={() => setPassVisitId("")}>Selesai</button></div></section></div>}

    {toolsOpen && <VisitorToolsModal activeBuilding={activeBuilding} onClose={() => setToolsOpen(false)}/>} {toast && <div className="gov-toast" role="status"><Icon name="check" size={16}/>{toast}</div>}
  </div>;
}

function PublicActionPage({ visitId }) {
  const [done, setDone] = useState(false);
  const visit = [...readPublicVisits(), ...readEventPlans(), ...readStored(VISITS_KEY, [])].find((entry) => entry.id === visitId);
  function checkOut() {
    const update = (key) => {
      const entries = readStored(key, []);
      localStorage.setItem(key, JSON.stringify(entries.map((entry) => entry.id === visitId ? { ...entry, status: "Checked-out", checkedOutAt: new Date().toISOString() } : entry)));
    };
    update(VISITS_KEY);
    update("visitorly.public-visits");
    setDone(true);
  }
  return <main className="public-result-page"><div className="public-result-brand">e-TAMU <span>PEMKOT BAUBAU</span></div><section><span className="section-kicker">EXIT VERIFICATION</span><h1>{done ? "Check-out tercatat" : "Konfirmasi keluar gedung"}</h1><p>{visit ? `${visit.name} · ${visit.id}` : "ID kunjungan tidak ditemukan pada perangkat ini."}</p>{visit && !done && <button className="primary-button" type="button" onClick={checkOut}>Konfirmasi check-out</button>}{done && <><span className="approval-state approval-approved">Terima kasih telah berkunjung</span><a className="feedback-next-link" href={`/?flow=feedback&id=${encodeURIComponent(visitId)}`}>Beri penilaian layanan</a></>}</section></main>;
}

function PublicFeedbackPage({ visitId }) {
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState("Pelayanan");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const visit = [...readPublicVisits(), ...readEventPlans(), ...readStored(VISITS_KEY, [])].find((entry) => entry.id === visitId);
  function submitFeedback(event) {
    event.preventDefault();
    const entries = readStored("baubau.feedback.v1", []);
    const item = { id: `FDB-${Date.now().toString(36).toUpperCase()}`, visitId, name: visit?.name || "Tamu", rating, category, message: message.trim(), date: localDate(), createdAt: new Date().toISOString() };
    localStorage.setItem("baubau.feedback.v1", JSON.stringify([item, ...entries]));
    setSubmitted(true);
  }
  return <main className="public-result-page"><div className="public-result-brand">e-TAMU <span>PEMKOT BAUBAU</span></div><section><span className="section-kicker">UMPAN BALIK PENGUNJUNG</span><h1>{submitted ? "Terima kasih atas masukan Anda." : "Bagaimana pengalaman layanan Anda?"}</h1><p>{visit ? `${visit.name} · ${visit.id}` : "Masukan ini tersimpan lokal pada perangkat demo."}</p>{!submitted && <form className="public-feedback-form" onSubmit={submitFeedback}><label>Jenis masukan<select value={category} onChange={(event) => setCategory(event.target.value)}><option>Pelayanan</option><option>Pengaduan</option><option>Saran</option></select></label><label>Nilai layanan<div className="rating-control">{[1, 2, 3, 4, 5].map((value) => <button className={value <= rating ? "selected" : ""} type="button" key={value} aria-label={`${value} dari 5`} onClick={() => setRating(value)}>★</button>)}</div></label><label>Catatan<textarea rows="4" maxLength={600} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ceritakan pengalaman atau pengaduan Anda"/></label><button className="primary-button" type="submit">Kirim masukan</button></form>}{submitted && <span className="approval-state approval-approved">Feedback tersimpan pada perangkat ini</span>}</section></main>;
}

export default function BaubauVisitorApp() {
  const [accounts, setAccounts] = useState(readUserAccounts);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const email = sessionStorage.getItem(SESSION_KEY);
      return email ? readUserAccounts().find((account) => account.email.toLowerCase() === email.toLowerCase() && account.active !== false) || null : null;
    } catch { return null; }
  });
  useEffect(() => {
    try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)); } catch { return; }
  }, [accounts]);
  const params = new URLSearchParams(window.location.search);
  const flow = params.get("flow");
  if (flow === "walk-in" || flow === "event") return <PublicVisitForm mode={flow} eventDetails={{ name: params.get("event") || "", date: params.get("date") || "", location: params.get("location") || "", opd: params.get("opd") || "Bagian Umum Setda", host: params.get("host") || "", room: params.get("room") || "" }}/>;
  if (flow === "checkout") return <PublicActionPage visitId={params.get("id") || ""}/>;
  if (flow === "feedback") return <PublicFeedbackPage visitId={params.get("id") || ""}/>;
  if (!currentUser) return <SuperadminLogin accounts={accounts} onLogin={(account) => {
    try { sessionStorage.setItem(SESSION_KEY, account.email); } catch { /* Keep this prototype usable when browser storage is unavailable. */ }
    setCurrentUser(account);
  }}/>;
  return <GovernmentVisitorApp currentUser={currentUser} accounts={accounts} setAccounts={setAccounts} onLogout={() => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* The in-memory session still ends. */ }
    setCurrentUser(null);
  }}/>;
}
