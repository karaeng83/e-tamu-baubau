import { useState } from "react";
import { authenticateAccount } from "./userAccounts.js";
import "./superadmin-login.css";

export default function SuperadminLogin({ accounts, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submitLogin(event) {
    event.preventDefault();
    const account = authenticateAccount(accounts, email, password);
    if (!account) {
      setError("Email atau kata sandi tidak sesuai.");
      return;
    }
    onLogin(account);
  }

  return <main className="superadmin-login">
    <section className="login-identity" aria-label="e-TAMU Pemerintah Kota Baubau">
      <a className="login-brand" href="/" aria-label="e-TAMU Baubau">
        <span className="login-brand-mark"><span /></span>
        <span><strong>e-TAMU</strong><small>PEMKOT BAUBAU</small></span>
      </a>
      <div className="login-identity-copy">
        <span className="login-overline">PEMERINTAH KOTA BAUBAU</span>
        <h1>Ruang kendali<br />kunjungan.</h1>
        <p>Kelola penerimaan tamu dan aktivitas kunjungan dalam satu tempat.</p>
      </div>
      <div className="login-identity-footer"><span />SISTEM MANAJEMEN KUNJUNGAN</div>
    </section>

    <section className="login-form-side">
      <div className="login-form-wrap">
        <div className="login-mobile-brand"><strong>e-TAMU</strong><span>BAUBAU</span></div>
        <span className="login-overline">AKSES ADMINISTRATOR</span>
        <h2>Masuk ke akun Anda</h2>
        <p className="login-description">Masuk sesuai akun dan hak akses yang diberikan.</p>
        <form className="login-form" onSubmit={submitLogin}>
          <label htmlFor="superadmin-email">Email</label>
          <input id="superadmin-email" type="email" autoComplete="username" required value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="nama@instansi.go.id" />
          <label htmlFor="superadmin-password">Kata sandi</label>
          <input id="superadmin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} placeholder="Masukkan kata sandi" />
          {error && <p className="login-error" role="alert">{error}</p>}
          <button type="submit">Masuk <span aria-hidden="true">→</span></button>
        </form>
        <p className="login-security-note">Akses demo ini tersimpan pada sesi tab browser.</p>
      </div>
      <footer className="login-page-footer"><span>e-TAMU Baubau</span><span>Prototype · akses lokal</span></footer>
    </section>
  </main>;
}