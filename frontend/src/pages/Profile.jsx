import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function Profile() {
  const { user, setUser } = useContext(AuthContext);
  const [form, setForm] = useState({ name: '', weight: '', height: '' });

  useEffect(() => { if (user) setForm({ name: user.name || '', weight: user.weight || '', height: user.height || '' }); }, [user]);

  const save = async () => {
    try {
      const res = await axios.put('/api/user/me', form);
      setUser(res.data);
      toast.success('Profile updated');
    } catch (err) { toast.error('Failed'); }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl mb-4">Profile</h2>
      <div className="grid grid-cols-1 gap-3">
        <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="p-2 border rounded" />
        <input value={form.weight} onChange={e=>setForm({...form, weight:e.target.value})} className="p-2 border rounded" />
        <input value={form.height} onChange={e=>setForm({...form, height:e.target.value})} className="p-2 border rounded" />
        <button onClick={save} className="bg-blue-600 text-white p-2 rounded">Save</button>
      </div>
    </div>
  );
}