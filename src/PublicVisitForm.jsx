import { useState } from "react";
import { savePublicVisit } from "./visitorStorage.js";
import "./visitor-public.css";

function Icon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    door: <><path d="M4 21h16M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M10 12h.01" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

export default function PublicVisitForm({ mode, eventDetails }) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", position: "", phone: "", identityNo: "", host: "", purpose: "", email: "", visitDate: eventDetails.date || "", visitTime: "", attendees: "1", consent: false, invitationName: "" });
  const isEvent = mode === "event";
  const visitBuilding = eventDetails.building || new URLSearchParams(window.location.search).get("building") || "Kantor Wali Kota Baubau";

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submitVisit(submitEvent) {
    submitEvent.preventDefault();
    savePublicVisit({
      name: form.name.trim(),
      company: form.company.trim() || "Independent visitor",
      position: form.position.trim(),
      phone: form.phone.trim(),
      identityNo: form.identityNo.trim(),
      host: isEvent ? eventDetails.host : form.host.trim() || "Front desk",
      opd: isEvent ? eventDetails.opd : "Bagian Umum Setda",
      room: isEvent ? eventDetails.room : "Ruang Rapat Wali Kota",
      purpose: isEvent ? eventDetails.name : form.purpose.trim() || "Walk-in visit",
      status: isEvent ? "Scheduled" : "Waiting",
      visitType: isEvent ? "event-plan" : "walk-in",
      approvalStatus: isEvent ? "Pending" : "Approved",
      building: visitBuilding,
      visitDate: isEvent ? form.visitDate : new Intl.DateTimeFormat("en-CA").format(new Date()),
      visitTime: form.visitTime,
      attendees: form.attendees,
      email: form.email.trim(),
      location: eventDetails.location,
      agenda: isEvent ? eventDetails.name : form.purpose.trim(),
      consent: form.consent,
      invitationName: form.invitationName,
      idVerified: false,
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="public-visit-shell">
        <div className="public-visit-top"><a className="public-brand" href="/"><span className="public-brand-mark"><Icon name="door" size={18} /></span>e-TAMU<span>Baubau</span></a><span className="public-top-label">PEMKOT BAUBAU · FRONT OFFICE</span></div>
        <section className="public-success"><span className="success-mark"><Icon name="check" size={28} /></span><span className="public-eyebrow">{isEvent ? "RENCANA KUNJUNGAN TERCATAT" : "REGISTRASI BERHASIL"}</span><h1>{isEvent ? "Terima kasih telah merencanakan kunjungan." : "Selamat datang di Pemkot Baubau."}</h1><p>{isEvent ? `Rencana kunjungan untuk ${eventDetails.name} telah disimpan pada perangkat ini.` : `${form.name}, silakan menuju petugas front office untuk verifikasi identitas.`}</p><div className="success-details"><span>{isEvent ? "TANGGAL KUNJUNGAN" : "WAKTU REGISTRASI"}</span><strong>{isEvent ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(`${form.visitDate}T12:00:00`)) : new Intl.DateTimeFormat("id-ID", { hour: "numeric", minute: "2-digit" }).format(new Date())}</strong>{eventDetails.location && <small>{eventDetails.location}</small>}</div><p className="success-note">Data prototype ini tersimpan di browser dan belum tersinkron ke server kantor.</p></section>
        <footer className="public-footer"><span>E-TAMU BAUBAU</span><span>Pemerintah Kota Baubau</span></footer>
      </main>
    );
  }

  return (
    <main className="public-visit-shell">
      <div className="public-visit-top"><a className="public-brand" href="/"><span className="public-brand-mark"><Icon name="door" size={18} /></span>e-TAMU<span>Baubau</span></a><span className="public-top-label">PEMKOT BAUBAU · FRONT OFFICE</span></div>
      <section className="public-visit-content">
        <div className="public-visit-intro"><span className="public-eyebrow">{isEvent ? "RENCANA KUNJUNGAN KEGIATAN" : "REGISTRASI TAMU · PEMKOT BAUBAU"}</span><h1>{isEvent ? `Rencanakan kunjungan: ${eventDetails.name || "kegiatan kantor"}.` : "Selamat datang. Silakan registrasi."}</h1><p>{isEvent ? "Isi detail kedatangan agar OPD tujuan dapat menyiapkan penerimaan." : "Lengkapi data berikut. Petugas front office akan memverifikasi identitas Anda."}</p></div>
        {isEvent && <div className="event-summary"><span className="summary-calendar"><Icon name="door" size={17} /></span><div><strong>{eventDetails.name || "Kegiatan kantor"}</strong><span>{[eventDetails.date && new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(`${eventDetails.date}T12:00:00`)), visitBuilding, eventDetails.opd, eventDetails.host, eventDetails.room, eventDetails.location].filter(Boolean).join(" · ")}</span></div></div>}
        <form className="public-visit-form" onSubmit={submitVisit}>
          <div className="public-form-grid"><label>Nama lengkap<input autoComplete="name" required maxLength={90} value={form.name} onChange={(change) => updateField("name", change.target.value)} placeholder="Nama sesuai identitas" /></label><label>Instansi / perusahaan<input autoComplete="organization" maxLength={90} value={form.company} onChange={(change) => updateField("company", change.target.value)} placeholder="Asal instansi" /></label></div>
          <div className="public-form-grid"><label>Jabatan<input maxLength={90} value={form.position} onChange={(change) => updateField("position", change.target.value)} placeholder="Jabatan" /></label><label>Nomor kontak<input inputMode="tel" required value={form.phone} onChange={(change) => updateField("phone", change.target.value)} placeholder="08xx..." /></label></div>
          {isEvent ? <><label>Email untuk konfirmasi<input autoComplete="email" type="email" required maxLength={120} value={form.email} onChange={(change) => updateField("email", change.target.value)} placeholder="nama@instansi.go.id" /></label><label>Nomor identitas<input required value={form.identityNo} onChange={(change) => updateField("identityNo", change.target.value)} placeholder="NIK / paspor" /></label><div className="public-form-grid"><label>Tanggal kunjungan<input required type="date" min={new Intl.DateTimeFormat("en-CA").format(new Date())} value={form.visitDate} onChange={(change) => updateField("visitDate", change.target.value)} /></label><label>Waktu kedatangan<input required type="time" value={form.visitTime} onChange={(change) => updateField("visitTime", change.target.value)} /></label></div><label>Jumlah peserta<select value={form.attendees} onChange={(change) => updateField("attendees", change.target.value)}><option value="1">1 orang</option><option value="2">2 orang</option><option value="3">3 orang</option><option value="4">4 orang</option><option value="5+">5 orang atau lebih</option></select></label><label className="public-upload">Surat undangan / surat tugas<input type="file" accept="image/*,.pdf" onChange={(change) => { const invitationName = change.target.files?.[0]?.name || ""; updateField("invitationName", invitationName); }} /><small>{form.invitationName ? `Dipilih: ${form.invitationName}` : "Lampiran dicatat di prototype, tidak diunggah."}</small></label></> : <><label>Nomor identitas<input required value={form.identityNo} onChange={(change) => updateField("identityNo", change.target.value)} placeholder="NIK / paspor" /></label><div className="public-form-grid"><label>Pegawai / OPD tujuan<input maxLength={90} value={form.host} onChange={(change) => updateField("host", change.target.value)} placeholder="Nama pegawai atau OPD" /></label><label>Keperluan<input required maxLength={120} value={form.purpose} onChange={(change) => updateField("purpose", change.target.value)} placeholder="Maksud kunjungan" /></label></div></>}
          <label className="public-consent"><input type="checkbox" required checked={form.consent} onChange={(change) => updateField("consent", change.target.checked)} />Saya menyetujui penggunaan data untuk pencatatan kunjungan pada prototype ini.</label>
          <button className="public-submit" type="submit">{isEvent ? "Kirim rencana kunjungan" : "Lanjutkan registrasi"}<Icon name="arrow" size={17} /></button>
        </form>
        <p className="public-privacy">Jangan unggah data identitas sensitif pada sistem demo. Verifikasi fisik dilakukan petugas.</p>
      </section>
      <footer className="public-footer"><span>E-TAMU BAUBAU</span><span>Pemerintah Kota Baubau</span></footer>
    </main>
  );
}
