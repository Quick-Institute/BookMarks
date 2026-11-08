import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_URL } from '../config/api';
import Navbar from './Navbar';
import Footer from './Footer';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (password !== confirm) return setMessage('Passwords do not match.');
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await response.json();
      setMessage(data.message || 'Unable to reset password.');
      if (response.ok) setSuccess(true);
    } catch { setMessage('Unable to connect to the server.'); }
    finally { setBusy(false); }
  }
  return <><Navbar /><main className="account-page"><div className="account-container">
    <h1 className="account-title">Reset Password</h1>
    <section className="account-box" style={{ maxWidth: 480, margin: 'auto' }}>
      {!token ? <p>Invalid reset link. Please request another.</p> : !success ?
      <form className="account-form" onSubmit={submit}>
        <div className="account-field"><label htmlFor="new-password">New password</label>
          <input id="new-password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={password} onChange={e => setPassword(e.target.value)} /></div>
        <div className="account-field"><label htmlFor="confirm-password">Confirm new password</label>
          <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={confirm} onChange={e => setConfirm(e.target.value)} /></div>
        <button className="account-submit-btn" disabled={busy}>{busy ? 'Saving…' : 'Reset password'}</button>
      </form> : null}
      <p role="status">{message}</p><Link to="/account">Back to login</Link>
    </section></div></main><Footer /></>;
}
