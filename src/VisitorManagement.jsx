import { useMemo, useState } from "react";
import PublicVisitForm from "./PublicVisitForm.jsx";
import VisitorToolsModal from "./VisitorToolsModal.jsx";
import { readPublicVisits } from "./visitorStorage.js";
import "./visitor-management.css";

const initialVisitors = [
  { id: "V-24018", name: "Nadia Putri", initials: "NP", company: "PT Sagara Digital", host: "Dimas Arya", purpose: "Presentasi produk", time: "09:00", status: "Checked in", color: "coral", badge: "NP" },
  { id: "V-24019", name: "Arif Nugroho", initials: "AN", company: "Konsultan Independen", host: "Maya Sari", purpose: "Diskusi proyek", time: "09:30", status: "Expected", color: "blue", badge: "AN" },
  { id: "V-24020", name: "Clara Wijaya", initials: "CW", company: "Northstar Ventures", host: "Dimas Arya", purpose: "Pertemuan investor", time: "10:00", status: "Expected", color: "green", badge: "CW" },
  { id: "V-24021", name: "Bima Santoso", initials: "BS", company: "PT Karya Utama", host: "Raka Mahendra", purpose: "Wawancara kandidat", time: "10:30", status: "Checked in", color: "violet", badge: "BS" },
  { id: "V-24022", name: "Sofia Rahman", initials: "SR", company: "Studio Rupa", host: "Maya Sari", purpose: "Kolaborasi kreatif", time: "11:00", status: "Expected", color: "amber", badge: "SR" },
  { id: "V-24023", name: "Kevin Hartono", initials: "KH", company: "PT Lintas Niaga", host: "Raka Mahendra", purpose: "Pengiriman dokumen", time: "11:30", status: "Checked out", color: "teal", badge: "KH" },
];

const navItems = [
  { label: "Overview", icon: "grid" },
  { label: "Visitor log", icon: "users" },
  { label: "Pre-registrations", icon: "calendar" },
  { label: "Analytics", icon: "chart" },
];

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    chart: <><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-5 5"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    door: <><path d="M4 21h16M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M10 12h.01"/></>,
    filter: <><path d="M4 7h16M7 12h10m-7 5h4"/><circle cx="8" cy="7" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7.07 0l2-2A5 5 0 0 0 12 3.93l-1.14 1.14"/><path d="M14 11a5 5 0 0 0-7.07 0l-2 2A5 5 0 0 0 12 20.07l1.14-1.14"/></>,
  };
  return <svg {...common}>{paths[name] || paths.grid}</svg>;
}

function getDateLabel() {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date());
}

function statusClass(status) {
  return status.toLowerCase().replaceAll(" ", "-");
}

function VisitorDashboard() {
  const [visitors, setVisitors] = useState(() => [...readPublicVisits(), ...initialVisitors]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All visitors");
  const [activeNav, setActiveNav] = useState("Overview");
  const [modalOpen, setModalOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({ name: "", company: "", host: "", purpose: "", time: "" });

  const filteredVisitors = useMemo(() => visitors.filter((visitor) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [visitor.name, visitor.company, visitor.host, visitor.purpose, visitor.id].some((value) => value.toLowerCase().includes(query));
    const matchesStatus = statusFilter === "All visitors" || visitor.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [visitors, search, statusFilter]);

  const checkedIn = visitors.filter((visitor) => visitor.status === "Checked in").length;
  const expected = visitors.filter((visitor) => visitor.status === "Expected").length;
  const checkedOut = visitors.filter((visitor) => visitor.status === "Checked out").length;

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function updateStatus(id) {
    const visitor = visitors.find((entry) => entry.id === id);
    if (!visitor || visitor.status === "Checked out") return;
    const status = visitor.status === "Expected" ? "Checked in" : "Checked out";
    setVisitors((current) => current.map((entry) => entry.id === id ? { ...entry, status } : entry));
    notify(`${visitor.name} ${status === "Checked in" ? "checked in" : "checked out"}`);
  }

  function addVisitor(event) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    setVisitors((current) => [{
      id: `V-${String(24024 + current.length - initialVisitors.length).padStart(5, "0")}`,
      name,
      initials,
      company: form.company.trim() || "Independent visitor",
      host: form.host.trim() || "Front desk",
      purpose: form.purpose.trim() || "General visit",
      time: form.time || new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
      status: "Expected",
      color: ["coral", "blue", "green", "violet", "amber", "teal"][current.length % 6],
      badge: initials,
    }, ...current]);
    setForm({ name: "", company: "", host: "", purpose: "", time: "" });
    setModalOpen(false);
    notify("Visitor added to today's log");
  }

  return (
    <div className="visitor-app">
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={() => setActiveNav("Overview")} aria-label="Visitorly home">
          <span className="brand-mark"><Icon name="door" size={20} /></span>
          <span>visitor<span className="brand-light">ly</span></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <button className="workspace-switcher" type="button">
          <span className="workspace-avatar">N</span>
          <span className="workspace-copy"><strong>Northstar Studio</strong><small>Jakarta, Indonesia</small></span>
          <span className="switch-chevron">⌄</span>
        </button>
        <div className="nav-label">MANAGE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => <button key={item.label} type="button" className={`nav-item ${activeNav === item.label ? "active" : ""}`} onClick={() => setActiveNav(item.label)}><Icon name={item.icon} /><span>{item.label}</span>{item.label === "Pre-registrations" && <span className="nav-count">3</span>}</button>)}
        </nav>
        <div className="nav-label tools-label">WORKSPACE</div>
        <button className="nav-item" type="button" onClick={() => notify("Settings are coming soon")}><span className="nav-symbol">⚙</span><span>Settings</span></button>
        <div className="sidebar-bottom">
          <div className="upgrade-panel"><span className="upgrade-spark">✳</span><strong>Make every visit count.</strong><p>Keep your team in the loop with a polished front desk.</p><button type="button" onClick={() => notify("Your team workspace is up to date")}>View workspace <Icon name="arrow" size={14} /></button></div>
          <button className="profile-button" type="button"><span className="profile-avatar">AS</span><span className="profile-copy"><strong>Aditya Saputra</strong><small>Office administrator</small></span><Icon name="more" /></button>
        </div>
      </aside>

      <main className="main-area" id="overview">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><Icon name="chevron" size={14} /><strong>{activeNav}</strong></div>
          <div className="topbar-actions"><span className="today-chip"><span className="live-dot" /> Front desk is open</span><button className="icon-button notification-button" type="button" aria-label="Notifications" onClick={() => notify("You're all caught up")}><Icon name="bell" /><i /></button><span className="topbar-divider" /><button className="top-avatar" type="button" aria-label="Account menu">AS</button></div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div><div className="eyebrow">{getDateLabel()}</div><h1>{activeNav === "Overview" ? "Good morning, Aditya" : activeNav}</h1><p className="heading-subtitle">Here’s what’s happening at your front desk today.</p></div>
            <div className="heading-actions"><button className="secondary-action" type="button" onClick={() => setToolsOpen(true)}><Icon name="link" size={15} /> Visitor tools</button><button className="primary-button" type="button" onClick={() => setModalOpen(true)}><Icon name="plus" size={17} /> Add visitor</button></div>
          </section>

          <section className="metric-grid" aria-label="Visitor summary">
            <article className="metric-card metric-primary"><div className="metric-top"><span className="metric-label">Currently on-site</span><span className="metric-icon green-icon"><Icon name="door" size={18} /></span></div><div className="metric-bottom"><strong>{String(checkedIn).padStart(2, "0")}</strong><span className="metric-note"><span className="tiny-trend">↗</span> +2 <span>vs yesterday</span></span></div><div className="metric-foot"><span className="metric-dot dot-green" /> Visitors checked in</div></article>
            <article className="metric-card"><div className="metric-top"><span className="metric-label">Expected today</span><span className="metric-icon orange-icon"><Icon name="calendar" size={18} /></span></div><div className="metric-bottom"><strong>{String(expected).padStart(2, "0")}</strong><span className="metric-note"><span>Next arrival</span> <b>09:30 AM</b></span></div><div className="metric-foot"><span className="metric-dot dot-orange" /> Across 4 host meetings</div></article>
            <article className="metric-card"><div className="metric-top"><span className="metric-label">Visits completed</span><span className="metric-icon blue-icon"><Icon name="check" size={18} /></span></div><div className="metric-bottom"><strong>{String(checkedOut).padStart(2, "0")}</strong><span className="metric-note"><span className="tiny-trend">↗</span> 12% <span>this week</span></span></div><div className="metric-foot"><span className="metric-dot dot-blue" /> Checked out today</div></article>
          </section>

          <section className="dashboard-grid">
            <div className="visitors-panel">
              <div className="panel-heading"><div><div className="panel-title-row"><h2>Today’s visitors</h2><span className="count-pill">{visitors.length}</span></div><p>Manage arrivals and keep your team in sync.</p></div><button className="text-button" type="button" onClick={() => setActiveNav("Visitor log")}>Full visitor log <Icon name="arrow" size={15} /></button></div>
              <div className="table-tools"><label className="search-field"><Icon name="search" size={17} /><input aria-label="Search visitors" placeholder="Search name, company, host..." value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ K</kbd></label><label className="filter-select"><Icon name="filter" size={16} /><select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All visitors</option><option>Expected</option><option>Checked in</option><option>Checked out</option></select></label></div>
              <div className="visitor-table-wrap"><table className="visitor-table"><thead><tr><th>VISITOR</th><th>HOST / PURPOSE</th><th>ARRIVAL</th><th>STATUS</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filteredVisitors.map((visitor) => <tr key={visitor.id}><td><div className="visitor-cell"><span className={`visitor-avatar avatar-${visitor.color}`}>{visitor.initials}</span><span className="visitor-details"><strong>{visitor.name}</strong><small>{visitor.company}</small></span></div></td><td><div className="host-details"><strong>{visitor.host}</strong><small>{visitor.purpose}</small></div></td><td><span className="arrival-time"><Icon name="clock" size={14} />{visitor.time}</span></td><td><span className={`status-badge status-${statusClass(visitor.status)}`}><i />{visitor.status}</span></td><td><button className="row-action" type="button" title={visitor.status === "Expected" ? "Check in visitor" : visitor.status === "Checked in" ? "Check out visitor" : "Visit complete"} aria-label={visitor.status === "Expected" ? "Check in visitor" : visitor.status === "Checked in" ? "Check out visitor" : "Visit complete"} disabled={visitor.status === "Checked out"} onClick={() => updateStatus(visitor.id)}>{visitor.status === "Expected" ? <><Icon name="door" size={14} /><span>Check in</span></> : visitor.status === "Checked in" ? <><Icon name="logout" size={14} /><span>Check out</span></> : <Icon name="check" size={16} />}</button></td></tr>)}</tbody></table>{filteredVisitors.length === 0 && <div className="empty-state"><span className="empty-icon"><Icon name="search" size={20} /></span><strong>No visitors found</strong><p>Try another search or adjust your status filter.</p></div>}</div>
              <div className="table-footer"><span>Showing <strong>{filteredVisitors.length}</strong> of <strong>{visitors.length}</strong> visitors</span><button type="button" onClick={() => { setSearch(""); setStatusFilter("All visitors"); }}>Clear filters <Icon name="arrow" size={14} /></button></div>
            </div>

            <aside className="right-rail">
              <section className="rail-section arrivals-section"><div className="rail-heading"><div><h2>Next arrivals</h2><p>Coming up at your office</p></div><button className="small-more" type="button" aria-label="More arrival options" onClick={() => setActiveNav("Pre-registrations")}><Icon name="more" /></button></div><div className="arrival-list">{visitors.filter((visitor) => visitor.status === "Expected").slice(0, 3).map((visitor, index) => <div className="arrival-item" key={visitor.id}><div className="arrival-track"><span className={`timeline-dot ${index === 0 ? "timeline-current" : ""}`} />{index < Math.min(expected, 3) - 1 && <span className="timeline-line" />}</div><span className={`visitor-avatar arrival-avatar avatar-${visitor.color}`}>{visitor.initials}</span><div className="arrival-copy"><strong>{visitor.name}</strong><small>Meeting with {visitor.host}</small></div><time>{visitor.time}</time></div>)}{expected === 0 && <div className="rail-empty">No more arrivals expected today.</div>}</div><button className="rail-link" type="button" onClick={() => setActiveNav("Pre-registrations")}>View schedule <Icon name="arrow" size={14} /></button></section>
              <section className="rail-section activity-section"><div className="rail-heading"><div><h2>Recent activity</h2><p>Latest front desk updates</p></div><button className="small-more" type="button" aria-label="More activity options" onClick={() => notify("Showing the latest activity")}><Icon name="more" /></button></div><div className="activity-list"><div className="activity-item"><span className="activity-icon activity-check"><Icon name="check" size={14} /></span><div><p><strong>Nadia Putri</strong> checked in</p><small>Front desk · 09:04 AM</small></div></div><div className="activity-item"><span className="activity-icon activity-invite"><Icon name="calendar" size={14} /></span><div><p><strong>Clara Wijaya</strong> was pre-registered</p><small>By Dimas Arya · 08:42 AM</small></div></div><div className="activity-item"><span className="activity-icon activity-exit"><Icon name="logout" size={14} /></span><div><p><strong>Kevin Hartono</strong> checked out</p><small>Front desk · 08:31 AM</small></div></div></div><button className="rail-link" type="button" onClick={() => setActiveNav("Visitor log")}>View all activity <Icon name="arrow" size={14} /></button></section>
              <div className="help-banner"><span className="help-spark">✳</span><div><strong>A warmer welcome starts here.</strong><p>Your front desk has greeted <b>{checkedIn + checkedOut}</b> visitors today.</p></div><span className="help-arrow"><Icon name="arrow" size={16} /></span></div>
            </aside>
          </section>
          <footer className="page-footer"><span>© 2026 Visitorly</span><span><span className="footer-live" /> All systems operational</span><button type="button" onClick={() => notify("Help center is coming soon")}>Help center</button></footer>
        </div>
      </main>

      {toast && <div className="toast-message" role="status"><span><Icon name="check" size={16} /></span>{toast}</div>}
      {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}><section className="visitor-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><span className="modal-icon"><Icon name="users" size={20} /></span><button className="modal-close" type="button" aria-label="Close" onClick={() => setModalOpen(false)}><Icon name="close" /></button><h2 id="modal-title">Add a visitor</h2><p>Create a visit record for someone arriving at your office.</p></div><form onSubmit={addVisitor}><label>Visitor name <input autoFocus required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Nadia Putri" /></label><label>Company <input value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} placeholder="Company or organization" /></label><div className="form-row"><label>Meeting host <input value={form.host} onChange={(event) => setForm({ ...form, host: event.target.value })} placeholder="Host name" /></label><label>Arrival time <input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} /></label></div><label>Visit purpose <input value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} placeholder="What brings them in?" /></label><div className="modal-actions"><button className="cancel-button" type="button" onClick={() => setModalOpen(false)}>Cancel</button><button className="primary-button" type="submit"><Icon name="plus" size={16} /> Add to visitor log</button></div></form></section></div>}
      {toolsOpen && <VisitorToolsModal onClose={() => setToolsOpen(false)} />}
    </div>
  );
}

export default function VisitorManagement() {
  const params = new URLSearchParams(window.location.search);
  const flow = params.get("flow");
  if (flow === "walk-in") return <PublicVisitForm mode="walk-in" eventDetails={{ name: "", date: "", location: "" }} />;
  if (flow === "event") return <PublicVisitForm mode="event" eventDetails={{ name: params.get("event") || "Office event", date: params.get("date") || "", location: params.get("location") || "" }} />;
  return <VisitorDashboard />;
}
