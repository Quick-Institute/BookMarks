import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config/api';
import Navbar from './Navbar';
import Footer from './Footer';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      setMessage(data.message || 'Unable to process request.');
    } catch { setMessage('Unable to connect to the server.'); }
    finally { setBusy(false); }
  }
  return <><Navbar /><main className="account-page"><div className="account-container">
    <h1 className="account-title">Forgot Password</h1>
    <section className="account-box" style={{ maxWidth: 480, margin: 'auto' }}>
      <p>Enter your email address to receive a password reset link.</p>
      <form className="account-form" onSubmit={submit}>
        <div className="account-field"><label htmlFor="reset-email">Email address</label>
          <input id="reset-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
        <button className="account-submit-btn" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
      </form><p role="status">{message}</p><Link to="/account">Back to login</Link>
    </section></div></main><Footer /></>;
}
