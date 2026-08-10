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
    setSystemLog({ status: 'checking', message: 'Validation mechanism running: Checking for data redundancy...' });
    
    try {
      // 1. Validation Mechanism: Scan cloud database against all unique constraint identifiers
      const { data: existingUsers, error: fetchError } = await supabase
        .from('accounts')
        .select('username, email, phone')
        .or(`username.eq.${formData.username},email.eq.${formData.email},phone.eq.${formData.phone}`);

      if (fetchError) throw fetchError;

      // 2. Identification & Classification System
      if (existingUsers && existingUsers.length > 0) {
        const match = existingUsers[0];
        let redundantField = '';

        if (match.username.toLowerCase() === formData.username.toLowerCase()) redundantField = 'Username';
        else if (match.email.toLowerCase() === formData.email.toLowerCase()) redundantField = 'Email';
        else if (match.phone === formData.phone) redundantField = 'Phone';

        // Result: Classification = REDUNDANT DATA (Duplicate entry detected)
        setSystemLog({ 
          status: 'redundant', 
          message: `Classification: REDUNDANT DATA. Duplicate entry detected on field [${redundantField}]. Execution halted.` 
        });
        alert(`Redundancy Alert: The ${redundantField} is already registered. Please use a unique value.`);
        setLoading(false);
        return; 
      }

      // Result: Classification = FALSE POSITIVE (Data is confirmed unique and safe to write)
      setSystemLog({ 
        status: 'verified', 
        message: 'Classification: FALSE POSITIVE. No data redundancy detected. Safe to append.' 
      });

      // 3. Data Insertion: Append only unique, verified entries
      const { data, error: insertError } = await supabase
        .from('accounts')
        .insert([formData])
        .select()
        .single();

      if (insertError) throw insertError;

      setSystemLog({ status: 'success', message: 'Database accuracy maintained. Entry appended successfully.' });
      alert('Account registered successfully!');
      setUser(data);
    } catch (error) {
      setSystemLog({ status: 'error', message: `System error: ${error.message}` });
      alert(`Operation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSystemLog({ status: 'checking', message: 'Authenticating user...' });

    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('email', formData.email)
        .eq('password', formData.password)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setSystemLog({ status: 'error', message: 'Authentication failure: Record not found.' });
        alert('Invalid email or password configuration.');
      } else {
        setSystemLog({ status: 'success', message: 'User authenticated successfully.' });
        alert('Login successful!');
        setUser(data);
      }
    } catch (error) {
      setSystemLog({ status: 'error', message: error.message });
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getLogColor = () => {
    switch (systemLog.status) {
      case 'checking': return '#e67e22';
      case 'redundant': return '#e74c3c';
      case 'verified': return '#2ecc71';
      case 'success': return '#3498db';
      case 'error': return '#c0392b';
      default: return '#7f8c8d';
    }
  };

  if (user) {
    return (
      <div style={{ padding: '30px', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
        <h2>Session Established</h2>
        <div style={{ background: '#f4f6f7', padding: '15px', borderRadius: '8px', display: 'inline-block', minWidth: '250px' }}>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Phone:</strong> {user.phone}</p>
        </div>
        <br />
        <button 
          onClick={() => { setUser(null); setSystemLog({ status: 'idle', message: 'System ready.' }); }} 
          style={{ marginTop: '20px', padding: '10px 20px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Terminate Session (Logout)
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '450px', margin: '40px auto', fontFamily: 'system-ui, sans-serif', border: '1px solid #e1e4e6', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <h2 style={{ textAlign: 'center', marginTop: '0' }}>{isLogin ? 'Account Access' : 'Account Provisioning'}</h2>
      
      {/* Live System Log Output Container */}
      <div style={{ 
        background: '#1e272e', 
        color: '#dcdde1',
        padding: '12px', 
        borderRadius: '6px', 
        marginBottom: '20px', 
        fontSize: '12px', 
        borderLeft: `5px solid ${getLogColor()}`,
        fontFamily: 'monospace',
        transition: 'border-color 0.3s ease'
      }}>
        <strong style={{ color: getLogColor() }}>[SYSTEM LOG]:</strong> {systemLog.message}
      </div>

      <form onSubmit={isLogin ? handleLogin : handleSignUp}>
        {!isLogin && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '5px' }}>Username</label>
            <input type="text" name="username" onChange={handleChange} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} required />
          </div>
        )}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '5px' }}>Email Address</label>
          <input type="email" name="email" onChange={handleChange} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} required />
        </div>
        {!isLogin && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '5px' }}>Phone Number</label>
            <input type="tel" name="phone" onChange={handleChange} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} required />
          </div>
        )}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '5px' }}>Password</label>
          <input type="password" name="password" onChange={handleChange} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} required />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '12px', background: '#2c3e50', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Processing Execution...' : isLogin ? 'Authenticate' : 'Commit Registration'}
        </button>
      </form>

      <button 
        disabled={loading}
        style={{ marginTop: '12px', width: '100%', padding: '10px', background: 'transparent', border: '1px solid #bdc3c7', borderRadius: '4px', cursor: 'pointer' }} 
        onClick={() => { setIsLogin(!isLogin); setSystemLog({ status: 'idle', message: 'System view shifted.' }); }}
      >
        Toggle to {isLogin ? 'Registration Form' : 'Access Form'}
      </button>
    </div>
  );
}