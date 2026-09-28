# e-Tamu Baubau

Standalone municipal visitor-management prototype for Pemerintah Kota Baubau. It includes visitor profiles/history, appointment requests and approvals, front desk and kiosk flows, QR visitor passes, check-in/out, evacuation list, multi-building/OPD masters, reports, feedback, local audit trail, and JSON backup/restore.

## Run

```sh
npm install
npm run dev
```

Use the URL printed by Vite for the dashboard. From the Bangkom workspace root, the app can also be run with `npm run dev:etamu`.

The admin dashboard opens behind a prototype login. The initial superadmin is `admin@admin.com` with password `admin5678`; the login lasts for the current browser tab session. Superadmin can create accounts with `Admin Pengaturan`, `Admin Gedung/Lokasi`, or `User Biasa` access. Location admins and regular users are assigned to one building; regular users only see their own appointment records. This is a client-side demo gate: passwords and accounts are stored in browser local storage, not securely authenticated.

For QR check-in on another device during local development, set **Public app address** in Visitor tools to this computer's LAN URL. For deployed use, set it to the public application URL.

The prototype stores data in browser local storage. It does not provide server-side authentication, cross-device synchronization, real-time updates, or production backup. Email, WhatsApp, OCR, face matching, SIMPEG/API connectors, kiosk lockdown, and auto check-out are placeholders/settings only. Do not use real NIK or other sensitive personal data in this demo. Connect an API/database and apply security, privacy, retention, and access-control policies before operational use.
