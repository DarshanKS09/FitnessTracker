import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import { AuthContext } from '../context/AuthContext';

export default function Profile() {
  const { notify } = useNotification();
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    profilePic: '',
    age: '',
    gender: 'Male',
    height: '',
    weight: '',
    goal: 'Maintenance',
    activityLevel: 'Moderate',
  });

  const [bmi, setBmi] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [initialProfilePic, setInitialProfilePic] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await getProfile();
      const user = res.data;

      setForm({
        name: user.name || '',
        profilePic: user.profilePic || '',
        age: user.age || '',
        gender: user.gender === 'Female' ? 'Female' : 'Male',
        height: user.height || '',
        weight: user.weight || '',
        goal: user.goal || 'Maintenance',
        activityLevel: user.activityLevel || 'Moderate',
      });
      setInitialProfilePic(user.profilePic || '');
    } catch {
      notify('Failed to load profile', 'error');
    } finally {
      setLoadingProfile(false);
    }
  }

  useEffect(() => {
    if (form.height && form.weight) {
      const h = Number(form.height) / 100;
      const bmiValue = (Number(form.weight) / (h * h)).toFixed(1);
      setBmi(bmiValue);
    } else {
      setBmi(null);
    }
  }, [form.height, form.weight]);

  const getExpectedSaveMs = () => {
    const stored = Number(sessionStorage.getItem('profileSaveAvgMs'));
    if (Number.isFinite(stored) && stored >= 600 && stored <= 15000) return stored;
    return 2200;
  };

  const updateExpectedSaveMs = (actualMs) => {
    const prev = getExpectedSaveMs();
    const next = Math.round((prev * 0.65) + (actualMs * 0.35));
    sessionStorage.setItem('profileSaveAvgMs', String(next));
  };

  const compressImageToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxSide = 720;
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Canvas not supported'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = () => reject(new Error('Invalid image'));
        img.src = String(reader.result || '');
      };
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.readAsDataURL(file);
    });

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('Please select an image file', 'error');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      notify('Image must be <= 8MB', 'error');
      return;
    }

    setUploading(true);
    try {
      const dataUrl =
        file.size > 300 * 1024
          ? await compressImageToDataUrl(file)
          : await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result || ''));
              reader.onerror = () => reject(new Error('Failed to read image'));
              reader.readAsDataURL(file);
            });
      setForm((prev) => ({ ...prev, profilePic: String(dataUrl) }));
    } catch {
      setUploading(false);
      notify('Failed to read image file', 'error');
      return;
    }
    setUploading(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving || uploading) return;
    setSaving(true);
    setSaveProgress(1);
    let progressTimer = null;

    try {
      const expectedMs = getExpectedSaveMs();
      const startTs = performance.now();
      let displayed = 1;
      let responseReady = false;
      let resolveProgressComplete;
      const progressComplete = new Promise((resolve) => {
        resolveProgressComplete = resolve;
      });

      progressTimer = setInterval(() => {
        const elapsed = performance.now() - startTs;
        let target;

        if (responseReady) {
          target = 100;
        } else if (elapsed <= expectedMs) {
          target = Math.min(99, (elapsed / expectedMs) * 100);
        } else {
          const overflow = elapsed - expectedMs;
          target = Math.min(99, 90 + (Math.log1p(overflow / 300) * 4));
        }

        if (displayed < target) {
          const gap = target - displayed;
          const step = responseReady
            ? Math.max(1.6, gap * 0.35)
            : Math.max(0.35, gap * 0.2);
          displayed = Math.min(target, displayed + step);
          setSaveProgress(displayed);
        }

        if (responseReady && displayed >= 100) {
          clearInterval(progressTimer);
          setSaveProgress(100);
          resolveProgressComplete();
        }
      }, 60);

      const payload = {
        ...form,
        age: form.age ? Number(form.age) : undefined,
        height: form.height ? Number(form.height) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
      };

      if (form.profilePic === initialProfilePic) {
        delete payload.profilePic;
      }

      const res = await updateProfile(payload);
      const updatedUser = res?.data || {};
      const nextUser = { ...user, ...updatedUser };
      setUser(nextUser);
      sessionStorage.setItem('user', JSON.stringify(nextUser));
      updateExpectedSaveMs(performance.now() - startTs);
      responseReady = true;
      await progressComplete;
      notify('Profile updated', 'success');
      navigate('/dashboard');
    } catch {
      if (progressTimer) clearInterval(progressTimer);
      setSaveProgress(0);
      notify('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-emerald-800 font-semibold">Loading profile...</p>
            </div>

            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-emerald-100 rounded-xl" />
              <div className="h-12 bg-emerald-100 rounded-lg" />
              <div className="grid md:grid-cols-2 gap-4">
                <div className="h-12 bg-emerald-100 rounded-lg" />
                <div className="h-12 bg-emerald-100 rounded-lg" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="h-12 bg-emerald-100 rounded-lg" />
                <div className="h-12 bg-emerald-100 rounded-lg" />
              </div>
              <div className="h-12 bg-emerald-100 rounded-lg" />
              <div className="h-12 bg-emerald-100 rounded-lg" />
              <div className="h-12 bg-emerald-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-emerald-800">
          Fitness Profile
        </h2>

        <form
          onSubmit={submit}
          className="bg-white rounded-3xl shadow-lg p-5 sm:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <img
              src={form.profilePic || 'https://placehold.co/96x96?text=Profile'}
              alt="Profile"
              className="h-20 w-20 rounded-full object-cover border border-emerald-200"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/96x96?text=Profile';
              }}
            />
            <div className="w-full flex-1">
              {form.profilePic ? (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-lg border border-emerald-200 hover:bg-emerald-200 transition"
                  >
                    Change picture
                  </button>
                </>
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-emerald-400"
                />
              )}
              <p className="text-xs text-gray-500 mt-1">
                Select an image from your device (max 8MB, auto-compressed)
              </p>
              {uploading && <p className="text-xs text-emerald-700 mt-1">Processing image...</p>}
            </div>
          </div>

          <input
            type="text"
            value={form.name}
            placeholder="Full Name"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-emerald-400"
          />

          <div className="grid md:grid-cols-2 gap-6">
            <input
              type="number"
              placeholder="Age"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400"
            />

            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400"
            >
              <option>Male</option>
              <option>Female</option>
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <input
              type="number"
              placeholder="Height (cm)"
              value={form.height}
              onChange={(e) => setForm({ ...form, height: e.target.value })}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400"
            />

            <input
              type="number"
              placeholder="Weight (kg)"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <select
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
            className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-emerald-400"
          >
            <option>Maintenance</option>
            <option>Cutting</option>
            <option>Bulking</option>
          </select>

          <select
            value={form.activityLevel}
            onChange={(e) =>
              setForm({ ...form, activityLevel: e.target.value })
            }
            className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-emerald-400"
          >
            <option>Sedentary</option>
            <option>Light</option>
            <option>Moderate</option>
            <option>Active</option>
          </select>

          {bmi && (
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <p className="text-emerald-800 font-semibold">
                BMI: {bmi}
              </p>
              <p className="text-sm text-gray-600">
                {bmi < 18.5
                  ? 'Underweight'
                  : bmi < 25
                    ? 'Normal'
                    : bmi < 30
                      ? 'Overweight'
                      : 'Obese'}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={saving || uploading}
            className="relative bg-emerald-600 disabled:bg-emerald-500 text-white rounded-lg py-3 w-full font-semibold hover:bg-emerald-700 disabled:hover:bg-emerald-500 transition overflow-hidden"
          >
            {saving ? (
              <>
                <div className="absolute inset-y-0 left-0 bg-emerald-300/70 transition-all duration-150" style={{ width: `${saveProgress}%` }} />
                <span className="relative z-10">{`Saving profile... ${Math.round(saveProgress)}%`}</span>
              </>
            ) : (
              'Save Profile'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
