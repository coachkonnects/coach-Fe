import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { Search, MapPin, Filter, Mail, Phone, Calendar, User, CheckCircle2, FileText, Settings, LogOut, ChevronRight, Download, Activity, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { LayoutDashboard, Users, UserCheck, MessageSquare, Target, Star, ShieldAlert, Lock, Grid } from 'lucide-react';

export const Route = createFileRoute('/SAMRAHUL')({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(() => typeof window !== 'undefined' ? (localStorage.getItem('adminActiveTab') || 'dashboard') : 'dashboard');
  const [coaches, setCoaches] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetch('/api/admin/reviews', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      })
      .then(res => res.json())
      .then(data => setReviews(data))
      .catch(console.error);
    }
  }, [activeTab]);

  const changeReviewStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if(res.ok) {
        setReviews(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      }
    } catch(err) {
      console.error(err);
    }
  };

  const deleteReview = async (id: number) => {
    if(!confirm("Are you sure you want to delete this review?")) return;
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if(res.ok) {
        setReviews(prev => prev.filter(r => r.id !== id));
      }
    } catch(err) {
      console.error(err);
    }
  };

  const [categories, setCategories] = useState<any[]>([]);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryExpertises, setNewCategoryExpertises] = useState('');
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingCategoryExpertises, setEditingCategoryExpertises] = useState('');
  const [selectedCoach, setSelectedCoach] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [banConfirm, setBanConfirm] = useState<{ type: 'student' | 'coach', id: any } | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [studentSortConfig, setStudentSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);


  const handleCategoryChange = async (e: any) => {
    const newCategory = e.target.value;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/coaches/${selectedCoach.id}/category`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ category: newCategory })
      });
      if (res.ok) {
        setSelectedCoach({ ...selectedCoach, category: newCategory });
        setCoaches(coaches.map((c: any) => c.id === selectedCoach.id ? { ...c, category: newCategory } : c));
      } else {
        alert('Failed to update category.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating category.');
    }
  };

  const handleExpertiseChange = async (newExpertise: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/coaches/${selectedCoach.id}/expertise`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ expertise: newExpertise })
      });
      if (res.ok) {
        setSelectedCoach({ ...selectedCoach, expertise: newExpertise });
        setCoaches(coaches.map((c: any) => c.id === selectedCoach.id ? { ...c, expertise: newExpertise } : c));
      } else {
        alert('Failed to update expertise.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // Always push sentinel first so Back never immediately exits
    window.history.pushState({ adminDashboard: true }, '');
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      // Always immediately push a new sentinel so the NEXT back press is also guarded
      window.history.pushState({ adminDashboard: true }, '');

      if (selectedCoach || selectedStudent) {
        setSelectedCoach(null);
        setSelectedStudent(null);
        setIsFlagging(false);
      } else {
        // Show beautiful leave warning
        setShowLeaveWarning(true);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedCoach, selectedStudent]);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate({ to: "/SAMRAHUL-login" });
    }
  }, [navigate]);


  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);


  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data: any[], config: typeof sortConfig) => {
    if (!config) return data;
    return [...data].sort((a, b) => {
      let aVal = a[config.key];
      let bVal = b[config.key];

      if (config.key === 'email') {
        aVal = a.user?.email || '';
        bVal = b.user?.email || '';
      }

      if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleStudentSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (studentSortConfig && studentSortConfig.key === key && studentSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setStudentSortConfig({ key, direction });
  };


  const [classesList, setClassesList] = useState<any[]>([]);

  const [isFlagging, setIsFlagging] = useState(false);
  const [flagField, setFlagField] = useState('description');
  const [flagReason, setFlagReason] = useState('');
  const [stats, setStats] = useState({ totalCoaches: 0, pending: 0, live: 0, flagged: 0 });
  const [blockedWords, setBlockedWords] = useState<any[]>([]);
  const [newBlockedWord, setNewBlockedWord] = useState('');
  const [newBlockedWordCategory, setNewBlockedWordCategory] = useState('CUSTOM');
  const [blockedWordSearch, setBlockedWordSearch] = useState('');

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert("No data available to export.");
      return;
    }
    const flattenObject = (obj: any, prefix = ''): any => {
      return Object.keys(obj).reduce((acc: any, k: string) => {
        const pre = prefix.length ? prefix + '_' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
          Object.assign(acc, flattenObject(obj[k], pre + k));
        } else {
          acc[pre + k] = obj[k];
        }
        return acc;
      }, {});
    };

    const flatData = data.map(d => flattenObject(d));
    const headers = Array.from(new Set(flatData.flatMap(Object.keys)));
    const csvRows = [headers.join(',')];

    for (const row of flatData) {
      const values = headers.map(header => {
        const val = row[header];
        const strVal = (val === null || val === undefined) ? '' : String(val);
        return `"${strVal.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportToExcel = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert("No data available to export.");
      return;
    }
    const flattenObject = (obj: any, prefix = ''): any => {
      return Object.keys(obj).reduce((acc: any, k: string) => {
        const pre = prefix.length ? prefix + '_' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
          Object.assign(acc, flattenObject(obj[k], pre + k));
        } else {
          acc[pre + k] = obj[k];
        }
        return acc;
      }, {});
    };

    const flatData = data.map(d => flattenObject(d));
    const worksheet = XLSX.utils.json_to_sheet(flatData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, filename);
  };

  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [demands, setDemands] = useState<any[]>([]);
  const [passkeyRegistered, setPasskeyRegistered] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const email = localStorage.getItem("adminEmail") || "";
    return localStorage.getItem(`passkey_registered_${email}`) === "true";
  });

  const handleRegisterPasskey = async () => {
    const email = localStorage.getItem("adminEmail");
    if (!email) {
      alert("Could not determine admin email. Please log out and log in again.");
      return;
    }
    try {
      const res = await fetch("/api/passkeys/register/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to start passkey registration");
      }
      const optionsRaw = await res.json();
      const options = optionsRaw.publicKey ?? optionsRaw;

      const attResp = await startRegistration({ optionsJSON: options });

      const finishRes = await fetch("/api/passkeys/register/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, response: attResp })
      });

      if (finishRes.ok) {
        const regEmail = localStorage.getItem("adminEmail") || "";
        localStorage.setItem(`passkey_registered_${regEmail}`, "true");
        setPasskeyRegistered(true);
        alert("🔐 Passkey registered! Next time you can sign in with Passkey🗝️");
      } else {
        const err = await finishRes.json();
        throw new Error(err.error || "Failed to save passkey on server");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error: " + (err.message || "Could not register Passkey. Is your browser supported?"));
    }
  };

  useEffect(() => {
    fetchProfiles();
    if (activeTab === 'admins') {
      fetchAdmins();
    }
    if (activeTab === 'security') {
      fetchBannedUsers();
    }
  }, [activeTab]);

  const fetchBannedUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/banned-users', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setBannedUsers(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleUnbanUser = async (email: string) => {
    if (!confirm(`Are you sure you want to unban ${email}?`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/banned-users/${email}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        alert("User unbanned successfully.");
        fetchBannedUsers();
      }
    } catch (e) { console.error(e); }
  };

  const fetchBlockedWords = async () => {
    try {
      const res = await fetch('/api/admin/security/blocked-words/all', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.ok) setBlockedWords(await res.json());
    } catch (e) { }
  };

  const handleAddBlockedWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockedWord.trim()) return;
    try {
      const res = await fetch('/api/admin/security/blocked-words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ word: newBlockedWord, category: newBlockedWordCategory })
      });
      if (res.ok) {
        setNewBlockedWord('');
        fetchBlockedWords();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add word");
      }
    } catch (e) { }
  };

  const handleDeleteBlockedWord = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/security/blocked-words/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.ok) fetchBlockedWords();
    } catch (e) { }
  };

  useEffect(() => {
    fetchBlockedWords();
  }, []);

  const fetchProfiles = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const authHeaders = { 'Authorization': `Bearer ${token}` };
      const [studentRes, coachRes, categoryRes, enquiryRes, classRes, demandRes] = await Promise.all([
        fetch('/api/profile/student'),
        fetch('/api/profile/coach'),
        fetch('/api/admin/categories', { headers: authHeaders }),
        fetch('/api/admin/enquiries', { headers: authHeaders }),
        fetch('/api/admin/classes', { headers: authHeaders }),
        fetch('/api/admin/demands', { headers: authHeaders })
      ]);

      const isUnauthorized = [categoryRes, enquiryRes, classRes, demandRes].some(res => res.status === 401 || res.status === 403);
      if (isUnauthorized) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminEmail');
        navigate({ to: '/SAMRAHUL-login' });
        return;
      }

      if (studentRes.ok) setStudents(await studentRes.json());
      if (coachRes.ok) setCoaches(await coachRes.json());
      if (categoryRes.ok) setCategories(await categoryRes.json());
      if (enquiryRes.ok) setEnquiries(await enquiryRes.json());
      if (classRes.ok) setClassesList(await classRes.json());
      if (demandRes.ok) setDemands(await demandRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/admin/students');
      const data = await res.json();
      setStudents(data);
    } catch (e) { console.error(e); }
  };

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/super-admins', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch admins');
      const data = await res.json();
      setAdminsList(data);
    } catch (e) { console.error(e); }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/super-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAdminName, email: newAdminEmail })
      });
      if (res.ok) {
        alert("Super Admin invited successfully!");
        setNewAdminName("");
        setNewAdminEmail("");
        fetchAdmins();
      } else {
        alert(await res.text());
      }
    } catch (e) { console.error(e); }
  };

  const handleRevokeAdmin = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this admin's access?")) return;
    try {
      const res = await fetch(`/api/admin/super-admins/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert("Admin access revoked.");
        fetchAdmins();
      } else {
        alert(await res.text());
      }
    } catch (e) { console.error(e); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const email = localStorage.getItem("adminEmail") || "admin@coachkonnects.com"; // Assuming we stored email on login
      const res = await fetch('/api/admin/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, oldPassword, newPassword })
      });
      if (res.ok) {
        alert("Password updated successfully!");
        setOldPassword("");
        setNewPassword("");
      } else {
        const error = await res.json();
        alert(error.message || "Failed to update password");
      }
    } catch (e) { console.error(e); }
  };

  const fetchCoaches = async () => {
    try {
      const res = await fetch('/api/admin/coaches');
      const data = await res.json();
      setCoaches(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm("Are you sure you want to approve this profile? It will go LIVE.")) return;
    try {
      const res = await fetch(`/api/admin/coaches/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        alert("Profile Approved!");
        setSelectedCoach(null);
        fetchCoaches();
      }
    } catch (e) { }
  };

  const handleToggleFeature = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/coaches/${id}/feature`, { method: 'POST' });
      if (res.ok) {
        alert("Coach feature status updated!");
        fetchCoaches();
        setSelectedCoach(null);
      }
    } catch (e) { }
  };

  const handleReject = async (id: string, isEdit: boolean = false) => {
    const msg = isEdit
      ? "Are you sure you want to reject these profile changes? The original profile will remain active."
      : "Are you sure you want to completely reject this coach profile?";
    if (!confirm(msg)) return;
    try {
      const res = await fetch(`/api/admin/coaches/${id}/reject`, { method: 'POST' });
      if (res.ok) {
        alert("Profile Rejected!");
        setSelectedCoach(null);
        fetchCoaches();
      }
    } catch (e) { }
  };

  const handleDeleteCoach = async (id: string, ban: boolean = false) => {
    if (!confirm(`🚨 WARNING: Are you sure you want to completely DELETE this coach profile and user account? ${ban ? 'THEIR EMAIL WILL BE PERMANENTLY BANNED!' : ''} This cannot be undone!`)) return;
    try {
      const res = await fetch(`/api/admin/coaches/${id}?ban=${ban}`, { method: 'DELETE' });
      if (res.ok) {
        alert("Coach profile deleted.");
        fetchCoaches();
      } else {
        const error = await res.text();
        alert("Error: " + error);
      }
    } catch (e) { }
  };

  const handleToggleActiveCoach = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/coaches/${id}/toggle-active`, { method: 'POST' });
      if (res.ok) {
        fetchCoaches();
      }
    } catch (e) { }
  };

  const handleApproveStudent = async (id: string) => {
    if (!confirm("Are you sure you want to approve this student?")) return;
    try {
      const res = await fetch(`/api/admin/students/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        alert("Student Profile Approved!");
        setSelectedStudent(null);
        fetchStudents();
      }
    } catch (e) { }
  };

  const handleFlagSubmit = async () => {
    if (!flagReason) return alert("You must provide a reason!");
    const isCoach = !!selectedCoach;
    const targetId = isCoach ? selectedCoach.id : selectedStudent.id;
    const endpoint = isCoach ? `/api/admin/coaches/${targetId}/flag` : `/api/admin/students/${targetId}/flag`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flaggedField: flagField, reasonNote: flagReason })
      });
      if (res.ok) {
        alert("Profile Flagged! It has been returned to the user for edits.");
        setIsFlagging(false);
        if (isCoach) {
          setSelectedCoach(null);
          fetchCoaches();
        } else {
          setSelectedStudent(null);
          fetchStudents();
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, expertises: newCategoryExpertises })
      });
      if (res.ok) {
        const newCat = await res.json();
        setCategories([...categories, newCat]);
        setNewCategoryName('');
        setNewCategoryExpertises('');
      }
    } catch (e) { console.error(e); }
  };

  const handleEditCategory = async (id: number) => {
    if (!editingCategoryName.trim()) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/categories/${id}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: editingCategoryName, expertises: editingCategoryExpertises })
      });
      if (res.ok) {
        const updatedCat = await res.json();
        setCategories(categories.map(c => c.id === id ? updatedCat : c));
        setEditingCategory(null);
      }
    } catch (e) { console.error(e); }
  };

  const handleApproveCategory = async (id: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/categories/${id}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const updatedCat = await res.json();
        setCategories(categories.map(c => c.id === id ? updatedCat : c));
      }
    } catch (e) { console.error(e); }
  };

  const handleApproveDemand = async (id: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/demands/${id}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const updatedDemand = await res.json();
        setDemands(demands.map(d => d.id === id ? updatedDemand : d));
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteDemand = async (id: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/demands/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setDemands(demands.filter(d => d.id !== id));
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories(categories.filter(c => c.id !== id));
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteStudent = async (id: number, ban: boolean = false) => {
    if (!window.confirm(`Are you sure you want to completely delete this student? ${ban ? 'THEIR EMAIL WILL BE PERMANENTLY BANNED!' : ''}`)) return;
    try {
      const res = await fetch(`/api/admin/students/${id}?ban=${ban}`, { method: 'DELETE' });
      if (res.ok) {
        setStudents(students.filter((s: any) => s.id !== id));
      } else {
        alert("Failed to delete student.");
      }
    } catch (e) { console.error(e); }
  };

  const confirmBan = async () => {
    if (!banConfirm) return;
    const { type, id } = banConfirm;
    setBanConfirm(null);
    try {
      const res = await fetch(`/api/admin/${type === 'coach' ? 'coaches' : 'students'}/${id}?ban=true`, { method: 'DELETE' });
      if (res.ok) {
        if (type === 'coach') fetchCoaches();
        else setStudents(students.filter((s: any) => s.id !== id));
      } else {
        alert("Failed to ban " + type);
      }
    } catch (e) { console.error(e); }
  };

  const handleApproveClass = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/classes/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        setClassesList(classesList.map(c => c.id === id ? { ...c, status: 'APPROVED' } : c));
      }
    } catch (e) { console.error(e); }
  };

  const handleRejectClass = async (id: number) => {
    const reason = window.prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      const res = await fetch(`/api/admin/classes/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        setClassesList(classesList.map(c => c.id === id ? { ...c, status: 'REJECTED', rejectReason: reason } : c));
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteClass = async (id: number) => {
    if (!window.confirm("Delete this class entirely?")) return;
    try {
      const res = await fetch(`/api/admin/classes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setClassesList(classesList.filter(c => c.id !== id));
      }
    } catch (e) { console.error(e); }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterValue, setFilterValue] = useState('ALL');

  const filteredCoaches = coaches.filter(c => {
    const s = searchQuery.toLowerCase();
    const matchesSearch = !s || (c.fullName?.toLowerCase().includes(s) || c.user?.email?.toLowerCase().includes(s) || c.user?.phoneNumber?.toLowerCase().includes(s) || c.category?.toLowerCase().includes(s) || c.district?.toLowerCase().includes(s));
    const matchesFilter = filterValue === 'ALL' || c.status === filterValue;
    return matchesSearch && matchesFilter;
  });

  const filteredStudents = students.filter(s => {
    const s_q = searchQuery.toLowerCase();
    const matchesSearch = !s_q || (s.fullName?.toLowerCase().includes(s_q) || s.user?.email?.toLowerCase().includes(s_q) || s.district?.toLowerCase().includes(s_q));
    const matchesFilter = filterValue === 'ALL' || s.status === filterValue;
    return matchesSearch && matchesFilter;
  });

  const filteredClasses = classesList.filter(c => {
    const s = searchQuery.toLowerCase();
    const matchesSearch = !s || (c.title?.toLowerCase().includes(s) || c.coachEmail?.toLowerCase().includes(s));
    const matchesFilter = filterValue === 'ALL' || (filterValue === 'WORKSHOP' ? c.type === 'WORKSHOP' : (filterValue === 'REGULAR' ? c.type !== 'WORKSHOP' : true));
    return matchesSearch && matchesFilter;
  });

  const filteredDemands = demands.filter(d => {
    const s = searchQuery.toLowerCase();
    const matchesSearch = !s || (d.skillName?.toLowerCase().includes(s) || d.email?.toLowerCase().includes(s) || d.location?.toLowerCase().includes(s));
    const matchesFilter = filterValue === 'ALL' || (filterValue === 'APPROVED' ? d.approved : (filterValue === 'PENDING' ? !d.approved : true));
    return matchesSearch && matchesFilter;
  });

  const filteredEnquiries = enquiries.filter(l => {
    const s = searchQuery.toLowerCase();
    const matchesSearch = !s || (l.leadName?.toLowerCase().includes(s) || l.leadEmail?.toLowerCase().includes(s) || l.leadPhone?.toLowerCase().includes(s));
    const matchesFilter = filterValue === 'ALL' || l.status === filterValue;
    return matchesSearch && matchesFilter;
  });

  const filteredCategories = categories.filter(c => !searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || (c.expertises && c.expertises.toLowerCase().includes(searchQuery.toLowerCase())));
  const filteredAdmins = adminsList.filter(a => !searchQuery || a.email?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredBanned = bannedUsers.filter(b => !searchQuery || b.email?.toLowerCase().includes(searchQuery.toLowerCase()));

  // Reset filter when changing tabs
  useEffect(() => {
    setFilterValue('ALL');
    setSearchQuery('');
  }, [activeTab]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-teal-50/50 to-orange-50/30 font-sans text-gray-900 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal-400/10 rounded-full blur-[150px] -z-10 mix-blend-multiply"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-400/10 rounded-full blur-[120px] -z-10 mix-blend-multiply"></div>

      {/* Sidebar */}

      {/* Mobile Header */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-16 bg-teal-900 text-white flex items-center justify-between px-4 z-20 shadow-md">
        <Link to="/"><img src="/homelogo.png" alt="CoachKonnects" className="h-8 w-auto rounded object-contain bg-white px-2 shadow-sm hover:opacity-80 transition-opacity" /></Link>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition duration-200 ease-in-out w-64 bg-teal-900/90 backdrop-blur-3xl text-white flex flex-col shadow-2xl z-40 md:z-10 border-r border-white/10`}>
        <div className="p-6 border-b border-teal-800 relative">
          <div className="flex items-center gap-3 relative z-10 mb-2">
            <Link to="/"><img src="/homelogo.png" alt="CoachKonnects" className="h-10 w-auto rounded-md object-contain bg-white px-2 py-1 shadow-sm hover:opacity-80 transition-opacity" /></Link>
          </div>
          <p className="text-lg font-bold relative z-10 bg-gradient-to-r from-orange-400 to-teal-300 bg-clip-text text-transparent mt-6 ml-8">Admin Portal</p>
        </div>
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { name: 'Dashboard', icon: LayoutDashboard },
            { name: 'Coaches', icon: UserCheck },
            { name: 'Students', icon: Users },
            { name: 'Categories', icon: Grid },
            { name: 'Leads', icon: Target },
            { name: 'Demands', icon: Target },
            { name: 'Reviews', icon: Star },
            { name: 'Classes', icon: Calendar },
            { name: 'Export', icon: Download },
            { name: 'Admins', icon: ShieldAlert },
            { name: 'Security', icon: Lock }
          ].map((module) => {
            const isActive = activeTab === module.name.toLowerCase();
            return (
              <button
                key={module.name === 'Leads' ? 'Leads / Enquiries' : module.name}
                onClick={() => { setActiveTab(module.name.toLowerCase() as any); setIsSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium flex justify-between items-center ${isActive
                  ? 'bg-[#f26b21] text-white shadow-md'
                  : 'text-teal-100 hover:bg-teal-800 hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <module.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-teal-300'}`} />
                  {module.name === 'Leads' ? 'Leads / Enquiries' : module.name}
                </div>
                {module.name === 'Coaches' && coaches.filter(c => c.status === 'PENDING_APPROVAL').length > 0 && (
                  <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">
                    {coaches.filter(c => c.status === 'PENDING_APPROVAL').length}
                  </span>
                )}
                {module.name === 'Students' && students.length > 0 && (
                  <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">
                    {students.length}
                  </span>
                )}
                {module.name === 'Classes' && classesList.length > 0 && (
                  <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">
                    {classesList.length}
                  </span>
                )}

              </button>
            );
          })}
        </div>
        <div className="p-4 border-t border-teal-800">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full px-4 py-2 text-sm text-teal-200 hover:text-white hover:bg-teal-800 rounded-xl transition-colors text-left flex items-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Log out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 pt-16 md:pt-0">
        <header className="min-h-[5rem] py-4 md:py-0 bg-white/60 backdrop-blur-xl border-b border-white flex flex-col md:flex-row items-center px-4 md:px-8 justify-between shrink-0 shadow-sm gap-4">
          <h2 className="text-lg font-bold capitalize text-gray-900 hidden lg:block whitespace-nowrap">{activeTab} Review</h2>
          <div className="flex-1 w-full max-w-2xl flex flex-row items-center gap-2 md:gap-3">
            <div className="relative w-full flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="search" placeholder={`Search...`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-2 py-2 bg-white border border-gray-200/50 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm shadow-sm transition-all" />
            </div>
            {['coaches', 'students', 'leads', 'demands', 'classes'].includes(activeTab) && (
              <select value={filterValue} onChange={e => setFilterValue(e.target.value)} className="w-auto shrink-0 max-w-[110px] md:max-w-none bg-white/60 border border-gray-200/50 rounded-xl px-2 md:px-3 py-2 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-sm font-medium text-gray-600 transition-all cursor-pointer">
                <option value="ALL">All Status</option>
                {activeTab === 'classes' ? (
                  <>
                    <option value="REGULAR">Regular</option>
                    <option value="WORKSHOP">Workshop</option>
                  </>
                ) : activeTab === 'demands' ? (
                  <>
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                  </>
                ) : activeTab === 'leads' ? (
                  <>
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="CONVERTED">Converted</option>
                  </>
                ) : (
                  <>
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING_APPROVAL">Pending</option>
                    <option value="BANNED">Banned</option>
                    <option value="REJECTED">Rejected</option>
                  </>
                )}
              </select>
            )}
          </div>
          <div className="flex items-center gap-4 shrink-0 hidden sm:flex">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold shadow-sm border border-gray-200 text-[#f26b21]">SA</div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8 relative z-10">
          {activeTab === 'coaches' && !selectedCoach && (
            <div className="bg-white/80 backdrop-blur-2xl md:rounded-[2rem] rounded-xl shadow-xl border border-white overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b text-sm text-gray-500">
                    <th className="p-4 font-medium cursor-pointer" onClick={() => handleSort('fullName')}>Name {sortConfig?.key === 'fullName' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                    <th className="p-4 font-medium cursor-pointer" onClick={() => handleSort('location')}>Location {sortConfig?.key === 'location' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                    <th className="p-4 font-medium cursor-pointer" onClick={() => handleSort('email')}>Email Address {sortConfig?.key === 'email' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                    <th className="p-4 font-medium">Mobile</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getSortedData(filteredCoaches, sortConfig).map((coach: any) => (
                    <tr key={coach.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold">{coach.fullName}</td>
                      <td className="p-4 text-gray-600">
                        {coach.area ? `${coach.area}, ` : ''}
                        {coach.district}, {coach.state}
                        {coach.pincode ? ` - ${coach.pincode}` : ''}
                      </td>
                      <td className="p-4 text-gray-600">{coach.user?.email || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${coach.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-700' :
                          coach.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                          {coach.status.replace('_', ' ')}
                        </span>
                        {!coach.active && coach.status === 'APPROVED' && (
                          <span className="ml-2 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">INACTIVE</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedCoach(coach)}
                            className="text-[#f26b21] hover:text-orange-700 font-medium text-sm border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => handleToggleActiveCoach(coach.id)}
                            className={`text-sm font-medium border px-3 py-1.5 rounded-lg transition-colors ${coach.active ? 'text-slate-500 border-slate-200 hover:bg-slate-50' : 'text-teal-600 border-teal-200 hover:bg-teal-50'}`}
                            title={coach.active ? "Force Deactivate" : "Force Activate"}
                          >
                            {coach.active ? "Deactivate" : "Activate"}
                          </button>

                          <button
                            onClick={() => setBanConfirm({ type: 'coach', id: coach.id })}
                            className="text-white hover:text-white font-medium text-sm border border-red-600 bg-red-600 px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                            title="Ban User"
                          >
                            Ban
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCoaches.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">No coaches found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Detailed Review View */}
          {activeTab === 'coaches' && selectedCoach && (
            <div className="max-w-3xl mx-auto">
              <button
                onClick={() => { setSelectedCoach(null); setIsFlagging(false); }}
                className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 hover:text-teal-900 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Coaches
              </button>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8 border-b pb-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{selectedCoach.fullName}</h1>
                    <p className="text-gray-500">{selectedCoach.user.email}</p>
                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>{selectedCoach.user.phoneNumber || 'No mobile number'}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-sm font-bold ${selectedCoach.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-600' :
                    selectedCoach.status === 'APPROVED' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                    {selectedCoach.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8">
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Date of Birth</h3>
                    <p className="font-medium text-lg">{selectedCoach.dateOfBirth}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Location</h3>
                    <p className="font-medium text-lg">
                      {selectedCoach.area ? `${selectedCoach.area}, ` : ''}
                      {selectedCoach.district}, {selectedCoach.state}
                      {selectedCoach.pincode ? ` - ${selectedCoach.pincode}` : ''}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">SEO URL</h3>
                    <p className="font-mono text-sm text-[#f26b21] bg-orange-50 p-2 rounded-lg break-all">
                      coachkonnects.com/coaches/{selectedCoach.slug}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Category</h3>
                    <select
                      value={selectedCoach.category || ''}
                      onChange={handleCategoryChange}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-base font-medium bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    >
                      <option value="">-- Select Category --</option>
                      {filteredCategories.map((cat: any) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Expertise</h3>
                    <p className="font-medium text-lg">{selectedCoach.expertise || 'Not specified'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">About / Description</h3>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-1 whitespace-pre-line text-gray-700">
                      {selectedCoach.description || 'No description provided.'}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Class Mode</h3>
                    <p className="font-medium text-lg">{selectedCoach.classMode || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Pricing</h3>
                    <p className="font-medium text-lg">{selectedCoach.pricing || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Audience</h3>
                    <p className="font-medium text-lg">{selectedCoach.targetAudience || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Schedule</h3>
                    <p className="font-medium text-sm">{selectedCoach.availableDays || 'No days'} • {selectedCoach.timeSlots || 'No slots'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Media</h3>
                    <div className="flex gap-4">
                      {selectedCoach.profileImageUrl && (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-500 uppercase">Headshot</p>
                          <a href={selectedCoach.profileImageUrl} target="_blank" rel="noreferrer">
                            <img src={selectedCoach.profileImageUrl} alt="Headshot" className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-sm hover:opacity-80 transition-opacity" />
                          </a>
                        </div>
                      )}
                      {selectedCoach.groupImageUrl && (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-500 uppercase">Group Photo</p>
                          <a href={selectedCoach.groupImageUrl} target="_blank" rel="noreferrer">
                            <img src={selectedCoach.groupImageUrl} alt="Group Photo" className="w-40 h-24 object-cover rounded-xl border border-slate-200 shadow-sm hover:opacity-80 transition-opacity" />
                          </a>
                        </div>
                      )}
                    </div>
                    {selectedCoach.introVideoUrl && (
                      <p className="mt-3 font-medium text-sm text-blue-500 break-all">
                        Video: <a href={selectedCoach.introVideoUrl} target="_blank" rel="noreferrer">{selectedCoach.introVideoUrl}</a>
                      </p>
                    )}
                  </div>
                </div>

                {selectedCoach.pendingChanges && (
                  <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl mb-8">
                    <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">✎</span>
                      Pending Profile Edits (Awaiting Approval)
                    </h3>
                    <div className="bg-white p-4 rounded-xl text-sm border border-amber-100 text-slate-800">
                      {(() => {
                        try {
                          const changes = JSON.parse(selectedCoach.pendingChanges);
                          const ignoreKeys = ['email', 'mobile', 'dob'];
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {Object.entries(changes).map(([key, value]) => {
                                if (ignoreKeys.includes(key) || value === null || value === '') return null;
                                // Convert camelCase to Title Case
                                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                                const isImage = key.toLowerCase().includes('image');
                                return (
                                  <div key={key} className="border-b border-slate-100 pb-2">
                                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</span>
                                    {isImage ? (
                                      <img src={value as string} alt={label} className="h-16 w-16 object-cover rounded shadow-sm border" />
                                    ) : (
                                      <span className="font-medium">{value as string}</span>
                                    )}

                                    {showLogoutModal && (
                                      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                                        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 transform transition-all">
                                          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                          </div>
                                          <h3 className="text-2xl font-black text-center text-slate-800 mb-2">Abandoning Ship?</h3>
                                          <p className="text-center text-slate-500 mb-8">Who's going to approve all these profiles if you leave? Just kidding, you deserve a break. Sure you want to log out?</p>
                                          <div className="flex gap-4">
                                            <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-6 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Stay</button>
                                            <button onClick={() => { localStorage.clear(); setShowLogoutModal(false); navigate({ to: '/' }); }} className="flex-1 px-6 py-3 font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all">Yes, Bye!</button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {showLogoutModal && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                                  <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 transform transition-all">
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                      <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                    </div>
                                    <h3 className="text-2xl font-black text-center text-slate-800 mb-2">Abandoning Ship?</h3>
                                    <p className="text-center text-slate-500 mb-8">Who's going to approve all these profiles if you leave? Just kidding, you deserve a break. Sure you want to log out?</p>
                                    <div className="flex gap-4">
                                      <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-6 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Stay</button>
                                      <button onClick={() => { localStorage.clear(); setShowLogoutModal(false); navigate({ to: '/' }); }} className="flex-1 px-6 py-3 font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all">Yes, Bye!</button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        } catch (e) {
                          return <div className="font-mono">{selectedCoach.pendingChanges}</div>;
                        }
                      })()}
                    </div>
                    <p className="text-sm text-amber-700 mt-4 font-medium">
                      If you approve, these changes will automatically overwrite the current profile data above.
                    </p>
                  </div>
                )}

                {isFlagging ? (
                  <div className="bg-red-50 border border-red-100 p-6 rounded-2xl">
                    <h3 className="font-bold text-red-900 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm">!</span>
                      Flag this profile for edits
                    </h3>
                    <select
                      value={flagField}
                      onChange={e => setFlagField(e.target.value)}
                      className="w-full p-3 rounded-xl border border-red-200 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="name">Name / Profile Picture</option>
                      <option value="description">Description (Spam Content)</option>
                      <option value="location">Location</option>
                    </select>
                    <textarea
                      value={flagReason}
                      onChange={e => setFlagReason(e.target.value)}
                      placeholder="Explain what the coach needs to fix... (e.g., 'Please remove the word Maths from your description')"
                      className="w-full p-4 rounded-xl border border-red-200 h-32 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    />
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => setIsFlagging(false)} className="px-6 py-2 bg-white text-gray-600 font-bold rounded-full border">Cancel</button>
                      <button onClick={handleFlagSubmit} className="px-6 py-2 bg-red-600 text-white font-bold rounded-full hover:bg-red-700">Submit Flag & Request Change</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 border-t pt-8">
                    <button
                      onClick={() => handleToggleFeature(selectedCoach.id)}
                      className="flex-1 py-4 bg-purple-50 text-purple-600 hover:bg-purple-100 font-bold rounded-2xl transition-all"
                    >
                      {selectedCoach.isFeatured ? '★ Remove Feature' : '☆ Feature Coach'}
                    </button>
                    <button
                      onClick={() => handleApprove(selectedCoach.id)}
                      disabled={selectedCoach.status !== 'PENDING_APPROVAL' && selectedCoach.status !== 'REQUEST_CHANGE'}
                      className="flex-1 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition-all disabled:opacity-50"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => setIsFlagging(true)}
                      className="flex-1 py-4 bg-amber-50 text-amber-600 hover:bg-amber-100 font-bold rounded-2xl transition-all"
                    >
                      ! Flag
                    </button>
                    <button
                      onClick={() => handleReject(selectedCoach.id, !!selectedCoach.pendingChanges)}
                      disabled={selectedCoach.status === 'REJECTED'}
                      className="flex-1 py-4 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-2xl transition-all disabled:opacity-50"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Students List View */}
          {activeTab === 'students' && !selectedStudent && (
            <div className="bg-white/80 backdrop-blur-2xl md:rounded-[2rem] rounded-xl shadow-xl border border-white overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b text-sm text-gray-500">
                    <th className="p-4 font-medium cursor-pointer hover:text-gray-800 select-none" onClick={() => handleStudentSort('fullName')}>Name {studentSortConfig?.key === 'fullName' ? (studentSortConfig.direction === 'asc' ? '↑' : '↓') : <span className="opacity-30">↕</span>}</th>
                    <th className="p-4 font-medium cursor-pointer hover:text-gray-800 select-none" onClick={() => handleStudentSort('location')}>Location {studentSortConfig?.key === 'location' ? (studentSortConfig.direction === 'asc' ? '↑' : '↓') : <span className="opacity-30">↕</span>}</th>
                    <th className="p-4 font-medium cursor-pointer hover:text-gray-800 select-none" onClick={() => handleStudentSort('email')}>Email {studentSortConfig?.key === 'email' ? (studentSortConfig.direction === 'asc' ? '↑' : '↓') : <span className="opacity-30">↕</span>}</th>
                    <th className="p-4 font-medium">Mobile</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getSortedData(filteredStudents, studentSortConfig).map((student: any) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold">{student.fullName}</td>
                      <td className="p-4 text-gray-600">
                        {student.area ? `${student.area}, ` : ''}
                        {student.district}, {student.state}
                        {student.pincode ? ` - ${student.pincode}` : ''}
                      </td>
                      <td className="p-4 text-gray-600">{student.user?.email || 'N/A'}</td>
                      <td className="p-4 text-gray-600">{student.user?.phoneNumber || 'N/A'}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${student.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                          student.status === 'APPROVED' ? 'bg-green-50 text-green-600 border border-green-200' :
                            student.status === 'REQUEST_CHANGE' ? 'bg-purple-50 text-purple-600 border border-purple-200' :
                              'bg-red-50 text-red-600 border border-red-200'
                          }`}>
                          {student.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="px-4 py-1.5 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-teal-600 transition-colors"
                          >
                            Review
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteStudent(student.id); }}
                            className="px-4 py-1.5 bg-red-100 text-red-600 text-sm font-bold rounded-lg hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setBanConfirm({ type: 'student', id: student.id }); }}
                            className="px-4 py-1.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                          >
                            Ban
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">No students found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Students Detailed Review View */}
          {activeTab === 'students' && selectedStudent && (
            <div className="max-w-3xl mx-auto">
              <button
                onClick={() => setSelectedStudent(null)}
                className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 hover:text-teal-900 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Students
              </button>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8 border-b pb-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{selectedStudent.fullName}</h1>
                    <p className="text-gray-500">{selectedStudent.user?.email || "No Email"}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-sm font-bold ${selectedStudent.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-600' :
                    selectedStudent.status === 'APPROVED' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                    {selectedStudent.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8">
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Date of Birth</h3>
                    <p className="font-medium text-lg">{selectedStudent.dateOfBirth}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Location</h3>
                    <p className="font-medium text-lg">
                      {selectedStudent.area ? `${selectedStudent.area}, ` : ''}
                      {selectedStudent.district}, {selectedStudent.state}
                      {selectedStudent.pincode ? ` - ${selectedStudent.pincode}` : ''}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Gender</h3>
                    <p className="font-medium text-lg capitalize">{selectedStudent.gender}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Preference</h3>
                    <p className="font-medium text-lg capitalize">{selectedStudent.preference}</p>
                  </div>
                  <div className="col-span-2">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Interests</h3>
                    <p className="font-medium text-lg">{selectedStudent.interests}</p>
                  </div>
                </div>

                {isFlagging ? (
                  <div className="bg-red-50 border border-red-100 p-6 rounded-2xl mt-8">
                    <h3 className="font-bold text-red-900 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm">!</span>
                      Flag this profile for edits
                    </h3>
                    <select
                      value={flagField}
                      onChange={e => setFlagField(e.target.value)}
                      className="w-full p-3 rounded-xl border border-red-200 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="name">Name</option>
                      <option value="interests">Interests</option>
                      <option value="location">Location</option>
                    </select>
                    <textarea
                      value={flagReason}
                      onChange={e => setFlagReason(e.target.value)}
                      placeholder="Explain what the student needs to fix..."
                      className="w-full p-4 rounded-xl border border-red-200 h-32 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    />
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => setIsFlagging(false)} className="px-6 py-2 bg-white text-gray-600 font-bold rounded-full border">Cancel</button>
                      <button onClick={handleFlagSubmit} className="px-6 py-2 bg-red-600 text-white font-bold rounded-full hover:bg-red-700">Submit Flag & Request Change</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 border-t pt-8 mt-8">
                    <button
                      onClick={() => handleApproveStudent(selectedStudent.id)}
                      disabled={selectedStudent.status !== 'PENDING_APPROVAL' && selectedStudent.status !== 'REQUEST_CHANGE'}
                      className="flex-1 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition-all disabled:opacity-50"
                    >
                      ✓ Approve Student
                    </button>
                    <button
                      onClick={() => setIsFlagging(true)}
                      className="flex-1 py-4 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-2xl transition-all"
                    >
                      ! Flag & Request Change
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Manage Categories & Expertises</h2>
                    <p className="text-sm text-slate-500 mt-1">Add, edit, or approve categories requested by coaches.</p>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <input
                      type="text"
                      value={categorySearchQuery}
                      onChange={e => setCategorySearchQuery(e.target.value)}
                      placeholder="🔍 Search categories..."
                      className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#f26b21] focus:bg-white text-sm w-full md:w-64"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="p-4 font-bold">Category Name</th>
                        <th className="p-4 font-bold">Expertises</th>
                        <th className="p-4 font-bold">Status</th>
                        <th className="p-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {categories.filter((cat: any) =>
                        (cat.name && cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())) ||
                        (cat.expertises && cat.expertises.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                      ).map((cat: any) => (
                        <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-semibold text-slate-800">
                            {editingCategory === cat.id ? (
                              <input
                                type="text"
                                value={editingCategoryName}
                                onChange={e => setEditingCategoryName(e.target.value)}
                                className="px-3 py-1 border rounded w-full"
                              />
                            ) : (
                              cat.name
                            )}
                          </td>
                          <td className="p-4 text-slate-600">
                            {editingCategory === cat.id ? (
                              <input
                                type="text"
                                value={editingCategoryExpertises}
                                onChange={e => setEditingCategoryExpertises(e.target.value)}
                                className="px-3 py-1 border rounded w-full"
                                placeholder="Search"
                              />
                            ) : (
                              cat.expertises || <span className="text-slate-400 italic">None</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${cat.approved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                              {cat.approved ? 'Approved' : 'Pending'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2 whitespace-nowrap">
                            {editingCategory === cat.id ? (
                              <>
                                <button onClick={() => handleEditCategory(cat.id)} className="text-green-600 hover:text-green-800 font-bold px-2">Save</button>
                                <button onClick={() => setEditingCategory(null)} className="text-slate-500 hover:text-slate-700 font-bold px-2">Cancel</button>
                              </>
                            ) : (
                              <>
                                {!cat.approved && (
                                  <button onClick={() => handleApproveCategory(cat.id)} className="text-indigo-600 hover:text-indigo-800 font-bold px-2">Approve</button>
                                )}
                                <button onClick={() => {
                                  setEditingCategory(cat.id);
                                  setEditingCategoryName(cat.name);
                                  setEditingCategoryExpertises(cat.expertises || '');
                                }} className="text-blue-600 hover:text-blue-800 font-bold px-2">Edit</button>
                                <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-600 hover:text-red-800 font-bold px-2">Delete</button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredCategories.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-500 font-medium">No categories found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl mt-8">
                  <h3 className="font-bold text-gray-900 text-lg mb-4">Blocked Words Filter</h3>
                  <p className="text-sm text-gray-500 mb-6">These words will be blocked in real-time across the entire application (e.g. bios, descriptions). Prevents bad words and restricted subjects.</p>

                  <form onSubmit={handleAddBlockedWord} className="flex flex-col sm:flex-row gap-3 mb-6">
                    <input
                      type="text"
                      value={newBlockedWord}
                      onChange={e => setNewBlockedWord(e.target.value)}
                      placeholder="Enter words to block (comma separated)..."
                      className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-orange-500 outline-none"
                    />
                    <select
                      value={newBlockedWordCategory}
                      onChange={e => setNewBlockedWordCategory(e.target.value)}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-orange-500 outline-none"
                    >
                      <option value="CUSTOM">Custom</option>
                      <option value="PROFANITY">Profanity / Bad Word</option>

                    </select>
                    <button type="submit" className="bg-orange-500 text-white font-bold px-6 py-2 rounded-xl hover:bg-orange-600 transition-colors">Add</button>
                  </form>

                  <div className="mb-4">
                    <input
                      type="text"
                      value={blockedWordSearch}
                      onChange={e => setBlockedWordSearch(e.target.value)}
                      placeholder="Search added words..."
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto p-2 border border-gray-100 rounded-xl bg-slate-50">
                    {blockedWords.length === 0 && <span className="text-gray-400 text-sm">No blocked words.</span>}
                    {blockedWords.filter(bw => bw.word.toLowerCase().includes(blockedWordSearch.toLowerCase())).map(bw => (
                      <div key={bw.id} className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm">
                        <span>{bw.word}</span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{bw.category}</span>
                        <button onClick={() => handleDeleteBlockedWord(bw.id)} className="text-red-500 hover:bg-red-50 p-1 rounded-full ml-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl">
                  <div className="flex items-start gap-4">
                    <div className="bg-orange-50 p-3 rounded-xl text-orange-500">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">Biometric Login</h3>
                      <p className="text-gray-500 mt-1 text-sm">Register your Face ID, Touch ID, or Windows Hello to log into the Admin Portal instantly without a password or OTP.</p>
                      <button
                        onClick={handleRegisterPasskey}
                        className={`mt-4 flex items-center gap-2 font-medium px-4 py-2 rounded-lg transition-all ${passkeyRegistered
                            ? "bg-teal-500 text-white hover:bg-teal-600 ring-2 ring-teal-200"
                            : "bg-gray-900 text-white hover:bg-orange-500"
                          }`}
                      >
                        {passkeyRegistered ? (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            Passkey Registered ✓
                          </>
                        ) : "Register Passkey"}
                      </button>
                    </div>
                  </div>
                </div>



                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 w-full lg:col-span-2">
                  <h3 className="font-bold text-gray-900 text-lg mb-4">Banned Accounts</h3>
                  <p className="text-gray-500 text-sm mb-6">These users are permanently blocked from registering or logging in.</p>
                  <div className="overflow-x-auto border border-gray-100 rounded-xl">
                    <table className="w-full text-left min-w-[300px]">
                      <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User Name</th>
                          <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Banned Email</th>
                          <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {filteredBanned.map((bu, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{bu.name || 'Unknown'}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-500 truncate max-w-[200px]">{bu.email}</td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleUnbanUser(bu.email)}
                                className="px-4 py-1.5 bg-green-100 text-green-700 text-sm font-bold rounded-lg hover:bg-green-200 transition-colors"
                              >
                                Unban
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredBanned.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                              No banned users found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Admins (Super Admin Management) */}
          {activeTab === 'admins' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white/80 backdrop-blur-2xl md:rounded-[2rem] rounded-xl shadow-xl border border-white overflow-x-auto">
                  <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 text-lg">Active Admins</h3>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-sm text-gray-500">
                        <th className="p-4 font-medium">Email Address</th>
                        <th className="p-4 font-medium">Role</th>
                        <th className="p-4 font-medium">Joined Date</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredAdmins.map((admin: any) => (
                        <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {(admin.email || '?')[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800 text-sm">{admin.email}</div>
                                <div className="text-xs text-gray-400">{admin.phoneNumber || 'No phone'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${admin.role === 'SUPER_ADMIN'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-600 border-blue-200'
                              }`}>
                              {admin.role || 'ADMIN'}
                            </span>
                          </td>
                          <td className="p-4 text-gray-500 text-sm">
                            {admin.createdAt
                              ? new Date(admin.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '—'}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleRevokeAdmin(admin.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors text-sm font-medium border border-transparent hover:border-red-100"
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredAdmins.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-10 text-center">
                            <div className="text-gray-400 text-sm">No admins found. Add one using the form →</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <form onSubmit={handleAddAdmin} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="mb-6">
                    <div className="w-12 h-12 bg-orange-50 text-[#f26b21] rounded-xl flex items-center justify-center mb-4">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Add Super Admin</h3>
                    <p className="text-sm text-gray-500">Invite a team member to manage the platform.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={newAdminName}
                        onChange={e => setNewAdminName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#f26b21]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={newAdminEmail}
                        onChange={e => setNewAdminEmail(e.target.value)}
                        placeholder="john@coachkonnects.com"
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#f26b21]"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                    <div className="space-y-2">
                      {['View Dashboard', 'Manage Users', 'Approve Profiles', 'View Enquiries'].map(perm => (
                        <label key={perm} className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded text-[#f26b21] focus:ring-[#f26b21]" />
                          <span className="text-sm text-gray-600">{perm}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="w-full mt-8 bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-[#f26b21] transition-colors">
                    Send Invitation
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'leads' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Leads / Enquiries</h2>
                  <p className="text-sm text-gray-500 mt-1">Review and manage all incoming leads from the public coach profiles.</p>
                </div>

              </div>

              {filteredEnquiries.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No leads yet. They will appear here when visitors contact coaches.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEnquiries.map((enq) => (
                    <div key={enq.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-gray-900 text-lg">{enq.leadName || 'Unknown'}</h3>
                            {enq.status === 'PENDING_ADMIN_APPROVAL' && (
                              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">Pending Admin</span>
                            )}
                            {enq.status === 'PENDING_COACH_APPROVAL' && (
                              <span className="bg-orange-100 text-[#f26b21] text-xs font-bold px-2 py-0.5 rounded-full">Sent to Coach</span>
                            )}
                            {enq.status === 'APPROVED' && (
                              <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">Coach Accepted</span>
                            )}
                            {enq.status === 'REJECTED' && (
                              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">Rejected</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
                            <span>📧 {enq.leadEmail}</span>
                            {enq.leadPhone && <span>📞 {enq.leadPhone}</span>}
                            {enq.leadLocation && <span>📍 {enq.leadLocation}</span>}
                            <span className="text-gray-400">→ Coach: <span className="font-medium text-gray-700">{enq.coach?.fullName}</span></span>
                          </div>
                          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-700 italic">
                            "{enq.message}"
                          </div>
                        </div>

                        {enq.status === 'PENDING_ADMIN_APPROVAL' && (
                          <div className="flex sm:flex-col gap-2 shrink-0">
                            <button
                              onClick={async () => {
                                await fetch(`/api/admin/enquiries/${enq.id}/approve`, { method: 'PUT' });
                                fetchProfiles();
                              }}
                              className="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors text-sm"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={async () => {
                                await fetch(`/api/admin/enquiries/${enq.id}/reject`, { method: 'PUT' });
                                fetchProfiles();
                              }}
                              className="px-4 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors text-sm"
                            >
                              ✕ Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {activeTab === 'demands' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Demanded Classes</h2>
                  <p className="text-sm text-gray-500 mt-1">Student requests for skills not currently available on the platform.</p>
                </div>
                <span className="bg-orange-100 text-orange-700 font-bold text-sm px-3 py-1 rounded-full">
                  {demands.length} Total
                </span>
              </div>

              {filteredDemands.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <div className="text-gray-400 mb-3 text-4xl">📥</div>
                  <h3 className="text-lg font-bold text-gray-900">No demands yet</h3>
                  <p className="text-sm text-gray-500 mt-1">When students request new classes, they will appear here.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                          <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Requested Skill</th>
                          <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                          <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Student Email</th>
                          <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Date requested</th>
                          <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredDemands.map((d: any) => (
                          <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center gap-2 font-bold text-gray-900">
                                {d.skillName}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                                📍 {d.location}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-sm text-gray-900 font-medium">{d.email}</div>
                              <a href={`mailto:${d.email}`} className="text-xs text-[#f26b21] font-bold hover:underline">Contact Student</a>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-sm text-gray-500 font-medium">
                                {new Date(d.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${d.approved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                {d.approved ? 'Approved' : 'Pending'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                              {!d.approved && (
                                <button onClick={() => handleApproveDemand(d.id)} className="text-indigo-600 hover:text-indigo-800 font-bold px-2">Approve</button>
                              )}
                              <button onClick={() => handleDeleteDemand(d.id)} className="text-red-600 hover:text-red-800 font-bold px-2">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'classes' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Coach Classes & Workshops</h2>
                  <p className="text-sm text-gray-500 mt-1">Review all active classes, sessions, and workshops created by coaches.</p>
                </div>
                <span className="bg-teal-100 text-teal-700 font-bold text-sm px-3 py-1 rounded-full">
                  {classesList.length} Total
                </span>
              </div>

              {filteredClasses.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No classes have been created yet.</p>
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-2xl md:rounded-[2rem] rounded-xl shadow-xl border border-white overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-gray-50 border-b text-sm text-gray-500">
                        <th className="p-4 font-medium">Class Name</th>
                        <th className="p-4 font-medium">Coach Email</th>
                        <th className="p-4 font-medium">Type</th>
                        <th className="p-4 font-medium">Schedule</th>
                        <th className="p-4 font-medium">Pricing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredClasses.map(cls => (
                        <tr key={cls.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-bold text-gray-900">{cls.title}</td>
                          <td className="p-4 text-gray-500">{cls.coachEmail}</td>
                          <td className="p-4">
                            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
                              {cls.type || 'REGULAR'}
                            </span>
                          </td>
                          <td className="p-4 text-gray-600 text-sm">{cls.schedule}</td>
                          <td className="p-4 text-gray-900 font-bold">₹{cls.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          
          {activeTab === 'reviews' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight">Platform Reviews</h1>
                  <p className="text-slate-500 mt-2 font-medium">Manage student reviews.</p>
                </div>
              </div>
              <div className="bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        <th className="py-4 px-6 font-bold text-slate-500 uppercase text-xs tracking-wider">Date</th>
                        <th className="py-4 px-6 font-bold text-slate-500 uppercase text-xs tracking-wider">Coach</th>
                        <th className="py-4 px-6 font-bold text-slate-500 uppercase text-xs tracking-wider">Student</th>
                        <th className="py-4 px-6 font-bold text-slate-500 uppercase text-xs tracking-wider">Rating</th>
                        <th className="py-4 px-6 font-bold text-slate-500 uppercase text-xs tracking-wider">Comment</th>
                        <th className="py-4 px-6 font-bold text-slate-500 uppercase text-xs tracking-wider">Status</th>
                        <th className="py-4 px-6 font-bold text-slate-500 uppercase text-xs tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reviews.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">No reviews found.</td>
                        </tr>
                      ) : (
                        reviews.map((r: any) => (
                          <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6 font-medium text-slate-700">{new Date(r.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 px-6 font-bold text-slate-800">{r.coach?.fullName}</td>
                            <td className="py-4 px-6 font-medium text-slate-600">{r.student?.parentName || r.student?.user?.fullName || 'Unknown Student'}</td>
                            <td className="py-4 px-6 text-yellow-500 font-bold">{r.rating} ★</td>
                            <td className="py-4 px-6 text-slate-600 max-w-xs truncate" title={r.comment}>{r.comment || '-'}</td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-1 text-xs font-bold rounded-lg ${r.status === 'APPROVED' ? 'bg-teal-100 text-teal-700' : r.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                {r.status || 'PENDING'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right flex gap-2 justify-end">
                              {(!r.status || r.status === 'PENDING') && (
                                <>
                                  <button onClick={() => changeReviewStatus(r.id, 'APPROVED')} className="text-teal-600 hover:text-teal-700 font-bold text-sm bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors">Approve</button>
                                  <button onClick={() => changeReviewStatus(r.id, 'REJECTED')} className="text-amber-600 hover:text-amber-700 font-bold text-sm bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors">Reject</button>
                                </>
                              )}
                              <button onClick={() => deleteReview(r.id)} className="text-red-500 hover:text-red-600 font-bold text-sm bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">Delete</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Data Export</h2>
                  <p className="text-sm text-gray-500 mt-1">Download platform data as CSV files for reporting and backups.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Coaches</h3>
                    <p className="text-gray-500 text-sm mb-6">Export all registered coach profiles, including their skills, pricing, and locations.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => exportToCSV(coaches, 'coaches_export.csv')} className="flex-1 bg-[#f26b21] hover:bg-[#d95d1c] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                      <Download className="w-4 h-4" /> CSV
                    </button>
                    <button onClick={() => exportToExcel(coaches, 'coaches_export.xlsx')} className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                      <FileSpreadsheet className="w-4 h-4" /> Excel
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Students</h3>
                    <p className="text-gray-500 text-sm mb-6">Export student profiles, including their learning goals and locations.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => exportToCSV(students, 'students_export.csv')} className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                      <Download className="w-4 h-4" /> CSV
                    </button>
                    <button onClick={() => exportToExcel(students, 'students_export.xlsx')} className="flex-1 bg-[#f26b21] hover:bg-[#d95d1c] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                      <FileSpreadsheet className="w-4 h-4" /> Excel
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Leads / Enquiries</h3>
                    <p className="text-gray-500 text-sm mb-6">Export all leads and enquiries made through coach profiles.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => exportToCSV(enquiries, 'leads_export.csv')} className="flex-1 bg-[#f26b21] hover:bg-[#d95d1c] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                      <Download className="w-4 h-4" /> CSV
                    </button>
                    <button onClick={() => exportToExcel(enquiries, 'leads_export.xlsx')} className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                      <FileSpreadsheet className="w-4 h-4" /> Excel
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Classes</h3>
                    <p className="text-gray-500 text-sm mb-6">Export all created classes, workshops, and schedules across the platform.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => exportToCSV(classesList, 'classes_export.csv')} className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                      <Download className="w-4 h-4" /> CSV
                    </button>
                    <button onClick={() => exportToExcel(classesList, 'classes_export.xlsx')} className="flex-1 bg-[#f26b21] hover:bg-[#d95d1c] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                      <FileSpreadsheet className="w-4 h-4" /> Excel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}



        </main>
      </div>

      {showLeaveWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center transform animate-scale-in">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-red-100">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Leave Admin Portal?</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              You are about to exit the Admin Portal.<br />
              Any unsaved changes will be lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveWarning(false)}
                className="flex-1 py-3 px-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                Stay
              </button>
              <button
                onClick={() => { setShowLeaveWarning(false); navigate({ to: '/SAMRAHUL-login' }); }}
                className="flex-1 py-3 px-4 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all shadow-md shadow-red-200"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {banConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center transform animate-scale-in">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-red-100">
              <ShieldAlert className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ban User?</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              Are you sure you want to ban this user? Their email will be permanently blocked from registering again.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setBanConfirm(null)}
                className="flex-1 py-3 px-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                No
              </button>
              <button
                onClick={confirmBan}
                className="flex-1 py-3 px-4 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all shadow-md shadow-red-200"
              >
                Yes, Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 transform transition-all">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </div>
            <h3 className="text-2xl font-black text-center text-slate-800 mb-2">Abandoning Ship?</h3>
            <p className="text-center text-slate-500 mb-8">Who's going to approve all these profiles if you leave? Just kidding, you deserve a break. Sure you want to log out?</p>
            <div className="flex gap-4">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-6 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Stay</button>
              <button onClick={() => { localStorage.clear(); setShowLogoutModal(false); navigate({ to: '/' }); }} className="flex-1 px-6 py-3 font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all">Yes, Bye!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
