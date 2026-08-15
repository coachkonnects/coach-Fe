import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { Search, MapPin, Filter, Mail, Phone, Calendar, User, CheckCircle2, FileText, Settings, LogOut, ChevronRight, Download, Activity, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { LayoutDashboard, Users, UserCheck, MessageSquare, Target, Star, ShieldAlert, Lock, Grid } from 'lucide-react';

export const Route = createFileRoute('/admin')({
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate({ to: "/admin-login" });
    }
  }, [navigate]);

  const [activeTab, setActiveTab] = useState<string>(() => localStorage.getItem('adminActiveTab') || 'students');

  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCoach, setSelectedCoach] = useState<any | null>(null);

  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const [classesList, setClassesList] = useState<any[]>([]);

  const [isFlagging, setIsFlagging] = useState(false);
  const [flagField, setFlagField] = useState('description');
  const [flagReason, setFlagReason] = useState('');
  const [stats, setStats] = useState({ totalCoaches: 0, pending: 0, live: 0, flagged: 0 });

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

  const handleRegisterPasskey = async () => {
    try {
      const res = await fetch("/api/admin/passkeys/register/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: localStorage.getItem("adminToken") })
      });
      const options = await res.json();

      const attResp = await startRegistration({ optionsJSON: options });

      const finishRes = await fetch("/api/admin/passkeys/register/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attResp)
      });

      if (finishRes.ok) {
        alert("Passkey successfully registered!");
      } else {
        alert("Failed to register Passkey on the server.");
      }
    } catch (err) {
      console.error(err);
      alert("Error registering Passkey (Is your browser supported?)");
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [activeTab]);

  const fetchProfiles = async () => {
    try {
      const [studentRes, coachRes, categoryRes, enquiryRes, classRes] = await Promise.all([
        fetch('/api/profile/student'),
        fetch('/api/profile/coach'),
        fetch('/api/categories'),
        fetch('/api/admin/enquiries'),
        fetch('/api/admin/classes')
      ]);
      if (studentRes.ok) setStudents(await studentRes.json());
      if (coachRes.ok) setCoaches(await coachRes.json());
      if (categoryRes.ok) setCategories(await categoryRes.json());
      if (enquiryRes.ok) setEnquiries(await enquiryRes.json());
      if (classRes.ok) setClassesList(await classRes.json());
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
      const res = await fetch('/api/admin/super-admins');
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

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to completely reject this coach profile?")) return;
    try {
      const res = await fetch(`/api/admin/coaches/${id}/reject`, { method: 'POST' });
      if (res.ok) {
        alert("Profile Rejected!");
        setSelectedCoach(null);
        fetchCoaches();
      }
    } catch (e) { }
  };

  const handleDeleteCoach = async (id: string) => {
    if (!confirm("🚨 WARNING: Are you sure you want to completely DELETE this coach profile and user account? This cannot be undone!")) return;
    try {
      const res = await fetch(`/api/admin/coaches/${id}`, { method: 'DELETE' });
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
        body: JSON.stringify({ name: newCategoryName })
      });
      if (res.ok) {
        const newCat = await res.json();
        setCategories([...categories, newCat]);
        setNewCategoryName('');
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

  const handleDeleteStudent = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      const res = await fetch(`/api/profile/student/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStudents(students.filter((s: any) => s.id !== id));
      } else {
        alert("Failed to delete student.");
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

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden relative">

      {/* Sidebar */}
      <div className="w-64 bg-teal-900 text-white flex flex-col shadow-xl z-10 relative">
        <div className="p-6 border-b border-teal-800 relative">
          <div className="flex items-center gap-3 relative z-10 mb-2">
            <img src="/homelogo.png" alt="CoachKonnects" className="h-10 w-auto rounded-md object-contain bg-white px-2 py-1 shadow-sm" />
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
            { name: 'Reviews', icon: Star },
            { name: 'Classes', icon: Calendar },
            { name: 'Export', icon: Download },
            { name: 'Admins', icon: ShieldAlert },
            { name: 'Security', icon: Lock }
          ].map((module) => {
            const isActive = activeTab === module.name.toLowerCase();
            return (
              <button
                key={module.name}
                onClick={() => setActiveTab(module.name.toLowerCase() as any)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium flex justify-between items-center ${isActive
                  ? 'bg-[#f26b21] text-white shadow-md'
                  : 'text-teal-100 hover:bg-teal-800 hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <module.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-teal-300'}`} />
                  {module.name}
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
                {module.name === 'Leads' && enquiries.filter(e => e.status === 'PENDING_ADMIN_APPROVAL').length > 0 && (
                  <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">
                    {enquiries.filter(e => e.status === 'PENDING_ADMIN_APPROVAL').length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="p-4 border-t border-teal-800">
          <button
            onClick={() => {
              localStorage.removeItem('adminToken');
              localStorage.removeItem('adminEmail');
              navigate({ to: '/admin-login' });
            }}
            className="w-full px-4 py-2 text-sm text-teal-200 hover:text-white hover:bg-teal-800 rounded-xl transition-colors text-left flex items-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Log out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 justify-between shrink-0 shadow-sm">
          <h2 className="text-lg font-bold capitalize text-gray-900">{activeTab} Review</h2>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold shadow-sm border border-gray-200 text-[#f26b21]">SA</div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8 relative z-10">
          {activeTab === 'coaches' && !selectedCoach && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b text-sm text-gray-500">
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium">Location</th>
                    <th className="p-4 font-medium">Date of Birth</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coaches.map(coach => (
                    <tr key={coach.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold">{coach.fullName}</td>
                      <td className="p-4 text-gray-600">
                        {coach.area ? `${coach.area}, ` : ''}
                        {coach.district}, {coach.state}
                        {coach.pincode ? ` - ${coach.pincode}` : ''}
                      </td>
                      <td className="p-4 text-gray-600">{coach.dateOfBirth}</td>
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
                            onClick={() => handleDeleteCoach(coach.id)}
                            className="text-red-600 hover:text-red-700 font-medium text-sm border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete Coach"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {coaches.length === 0 && (
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
                className="text-gray-500 font-medium text-sm flex items-center gap-1 mb-6 hover:text-gray-900"
              >
                ← Back to List
              </button>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="flex justify-between items-start mb-8 border-b pb-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{selectedCoach.fullName}</h1>
                    <p className="text-gray-500">{selectedCoach.user.email}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-sm font-bold ${selectedCoach.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-600' :
                    selectedCoach.status === 'APPROVED' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                    {selectedCoach.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
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
                  <div className="col-span-2">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">SEO URL</h3>
                    <p className="font-mono text-sm text-[#f26b21] bg-orange-50 p-2 rounded-lg break-all">
                      coachkonnects.com/coaches/{selectedCoach.slug}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Category</h3>
                    <p className="font-medium text-lg">{selectedCoach.category || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Expertise</h3>
                    <p className="font-medium text-lg">{selectedCoach.expertise || 'Not specified'}</p>
                  </div>
                  <div className="col-span-2">
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
                  <div className="col-span-2">
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
                                  </div>
                                );
                              })}
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
                      <option value="description">Description (Spam/Educational Content)</option>
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
                      onClick={() => handleReject(selectedCoach.id)}
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b text-sm text-gray-500">
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium">Location</th>
                    <th className="p-4 font-medium">Date of Birth</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student: any) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold">{student.fullName}</td>
                      <td className="p-4 text-gray-600">
                        {student.area ? `${student.area}, ` : ''}
                        {student.district}, {student.state}
                        {student.pincode ? ` - ${student.pincode}` : ''}
                      </td>
                      <td className="p-4 text-gray-600">{student.dateOfBirth}</td>
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
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
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
                className="text-gray-500 font-medium text-sm flex items-center gap-1 mb-6 hover:text-gray-900"
              >
                ← Back to List
              </button>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="flex justify-between items-start mb-8 border-b pb-6">
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

                <div className="grid grid-cols-2 gap-8 mb-8">
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
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Manage Categories</h2>

                <div className="flex gap-4 mb-8">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Health & Wellness"
                    className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-[#f26b21] shadow-sm"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="px-8 py-3.5 bg-[#f26b21] text-white rounded-2xl font-bold hover:bg-[#d95d1c] shadow-md transition-all active:scale-[0.98]"
                  >
                    Add Category
                  </button>
                </div>

                <div className="space-y-3">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <span className="font-bold text-slate-700">{cat.name}</span>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-red-500 hover:text-red-700 font-bold text-sm px-4 py-2 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <div className="text-center py-10 text-slate-500 font-medium">No categories added yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                      <button onClick={handleRegisterPasskey} className="mt-4 bg-gray-900 text-white font-medium px-4 py-2 rounded-lg hover:bg-orange-500 transition-colors">
                        Register Passkey
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl">
                  <div className="flex items-start gap-4">
                    <div className="bg-orange-50 p-3 rounded-xl text-orange-500">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div className="w-full">
                      <h3 className="font-bold text-gray-900 text-lg">Change Password</h3>
                      <p className="text-gray-500 mt-1 mb-4 text-sm">Update your temporary password to a secure one.</p>

                      <form onSubmit={handleChangePassword} className="space-y-3">
                        <input
                          type="password"
                          placeholder="Current Password"
                          value={oldPassword}
                          onChange={e => setOldPassword(e.target.value)}
                          required
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-orange-500"
                        />
                        <input
                          type="password"
                          placeholder="New Password"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          required
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-orange-500"
                        />
                        <button type="submit" className="w-full bg-gray-900 text-white font-medium px-4 py-2 rounded-lg hover:bg-orange-500 transition-colors">
                          Update Password
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admins (Super Admin Management) */}
          {activeTab === 'admins' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                      {adminsList.map(admin => (
                        <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-bold text-slate-800">{admin.email}</td>
                          <td className="p-4">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                              SUPER ADMIN
                            </span>
                          </td>
                          <td className="p-4 text-gray-500 text-sm">
                            {new Date(admin.createdAt || Date.now()).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleRevokeAdmin(admin.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded transition-colors text-sm font-medium"
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))}
                      {adminsList.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-gray-500">No other admins found.</td>
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
                <span className="bg-orange-100 text-orange-700 font-bold text-sm px-3 py-1 rounded-full">
                  {enquiries.filter(e => e.status === 'PENDING_ADMIN_APPROVAL').length} Pending
                </span>
              </div>

              {enquiries.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No leads yet. They will appear here when visitors contact coaches.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {enquiries.map((enq) => (
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

              {classesList.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No classes have been created yet.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-left border-collapse">
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
                      {classesList.map(cls => (
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
    </div>
  );
}
