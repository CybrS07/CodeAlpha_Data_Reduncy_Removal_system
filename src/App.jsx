import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', phone: '', password: '' });
  const [user, setUser] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    // Task 1: Validation mechanism to prevent redundant/duplicate entries
    const { data: existingUsers, error: fetchError } = await supabase
      .from('accounts')
      .select('username, email, phone')
      .or(`username.eq.${formData.username},email.eq.${formData.email},phone.eq.${formData.phone}`);

    if (fetchError) {
      alert('Error verifying data redundancy.');
      return;
    }

    if (existingUsers && existingUsers.length > 0) {
      const match = existingUsers[0];
      if (match.username === formData.username) alert('Redundancy Alert: Username already exists!');
      if (match.email === formData.email) alert('Redundancy Alert: Email already exists!');
      if (match.phone === formData.phone) alert('Redundancy Alert: Phone number already exists!');
      return;
    }

    // Append only unique and verified entries
    const { data, error } = await supabase
      .from('accounts')
      .insert([formData])
      .select();

    if (error) {
      alert(error.message);
    } else {
      alert('Account created successfully!');
      setUser(data[0]);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('email', formData.email)
      .eq('password', formData.password)
      .single();

    if (error || !data) {
      alert('Invalid email or password.');
    } else {
      alert('Login successful!');
      setUser(data);
    }
  };

  if (user) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Welcome, {user.username}!</h2>
        <button onClick={() => setUser(null)}>Logout</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>{isLogin ? 'Login' : 'Create Account'}</h2>
      <form onSubmit={isLogin ? handleLogin : handleSignUp}>
        {!isLogin && (
          <div style={{ marginBottom: '10px' }}>
            <label>Username: </label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required />
          </div>
        )}
        <div style={{ marginBottom: '10px' }}>
          <label>Email: </label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        {!isLogin && (
          <div style={{ marginBottom: '10px' }}>
            <label>Phone: </label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} required />
          </div>
        )}
        <div style={{ marginBottom: '10px' }}>
          <label>Password: </label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>
        <button type="submit">{isLogin ? 'Login' : 'Sign Up'}</button>
      </form>
      <button style={{ marginTop: '10px' }} onClick={() => setIsLogin(!isLogin)}>
        Switch to {isLogin ? 'Create Account' : 'Login'}
      </button>
    </div>
  );
}