import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', phone: '', password: '' });
  const [user, setUser] = useState(null);
  const [systemLog, setSystemLog] = useState({ status: 'idle', message: 'System ready.' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value.trim() });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSystemLog({ status: 'checking', message: 'Invoking database RPC verification mechanism...' });

    try {
      // Execute the remote procedure call (RPC) on the cloud server
      const { data, error } = await supabase.rpc('manage_account_provisioning', {
        p_username: formData.username,
        p_email: formData.email,
        p_phone: formData.phone,
        p_password: formData.password
      });

      if (error) throw error;

      if (data.status === 'redundant') {
        setSystemLog({ status: 'redundant', message: data.message });
        alert(`Redundancy Alert: The ${data.field} already exists inside the database!`);
      } else if (data.status === 'verified') {
        setSystemLog({ status: 'success', message: data.message });
        alert('Account created successfully via RPC!');
        setUser(data.user);
      }
    } catch (error) {
      setSystemLog({ status: 'error', message: `RPC Execution Failed: ${error.message}` });
      alert(`Signup failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSystemLog({ status: 'checking', message: 'Querying database for user record matches...' });

    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, username, email, phone')
        .eq('email', formData.email)
        .eq('password', formData.password)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setSystemLog({ status: 'error', message: 'Authentication mismatch. Access denied.' });
        alert('Invalid credentials.');
      } else {
        setSystemLog({ status: 'success', message: 'Match confirmed. Session authorized.' });
        alert('Login successful!');
        setUser(data);
      }
    } catch (error) {
      setSystemLog({ status: 'error', message: error.message });
      alert(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getLogColor = () => {
    switch (systemLog.status) {
      case 'checking': return '#e67e22';
      case 'redundant': return '#e74c3c';
      case 'success': return '#2ecc71';
      case 'error': return '#c0392b';
      default: return '#7f8c8d';
    }
  };

  if (user) {
    return (
      <div style={{ padding: '30px', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
        <h2>Session Authenticated</h2>
        <div style={{ background: '#f4f6f7', padding: '15px', borderRadius: '8px', display: 'inline-block', textAlign: 'left' }}>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
        <br />
        <button onClick={() => { setUser(null); setSystemLog({ status: 'idle', message: 'System ready.' }); }} style={{ marginTop: '20px', padding: '10px 20px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '450px', margin: '40px auto', fontFamily: 'system-ui, sans-serif', border: '1px solid #e1e4e6', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>{isLogin ? 'Login' : 'Create Account'}</h2>
      
      <div style={{ background: '#1e272e', color: '#dcdde1', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '12px', borderLeft: `5px solid ${getLogColor()}`, fontFamily: 'monospace' }}>
        <strong style={{ color: getLogColor() }}>[SYSTEM LOG]:</strong> {systemLog.message}
      </div>

      <form onSubmit={isLogin ? handleLogin : handleSignUp}>
        {!isLogin && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Username</label>
            <input type="text" name="username" onChange={handleChange} style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} required />
          </div>
        )}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Email</label>
          <input type="email" name="email" onChange={handleChange} style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} required />
        </div>
        {!isLogin && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Phone</label>
            <input type="text" name="phone" onChange={handleChange} style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} required />
          </div>
        )}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Password</label>
          <input type="password" name="password" onChange={handleChange} style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} required />
        </div>
        
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#2c3e50', color: '#fff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Executing Cloud RPC...' : isLogin ? 'Login' : 'Register'}
        </button>
      </form>

      <button disabled={loading} style={{ marginTop: '12px', width: '100%', padding: '10px', background: 'transparent', border: '1px solid #bdc3c7', borderRadius: '4px', cursor: 'pointer' }} onClick={() => { setIsLogin(!isLogin); setSystemLog({ status: 'idle', message: 'Form toggled.' }); }}>
        Switch to {isLogin ? 'Create Account' : 'Login'}
      </button>
    </div>
  );
}