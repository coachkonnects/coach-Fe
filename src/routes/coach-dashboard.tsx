import { createFileRoute, useNavigate } from "@tanstack/react-router"; // test
import { useState, useEffect, useCallback } from "react";
import * as faceapi from "face-api.js";
import Cropper from "react-easy-crop";
import { startRegistration } from "@simplewebauthn/browser";

export const Route = createFileRoute("/coach-dashboard")({
  component: CoachDashboard,
});

function CoachDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [flags, setFlags] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "classes" | "calendar" | "enquiries">(
    "overview",
  );
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingGroup, setIsUploadingGroup] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"profile" | "group">("profile");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [classModalOpen, setClassModalOpen] = useState(false);
  const [classForm, setClassForm] = useState<any>({
    title: "",
    type: "REGULAR",
    schedule: "",
    price: "",
    capacity: "1",
    description: "",
    imageUrl: "",
  });
  const [isUploadingWorkshopImage, setIsUploadingWorkshopImage] = useState(false);
  
  const [passkeyStatus, setPasskeyStatus] = useState<"SUCCESS" | "ERROR" | null>(
    localStorage.getItem("hasPasskeyRegistered") === "true" ? "SUCCESS" : null
  );
  const [passkeyMessage, setPasskeyMessage] = useState(
    localStorage.getItem("hasPasskeyRegistered") === "true" ? "Passkey successfully registered!" : ""
  );

  const handleWorkshopImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingWorkshopImage(true);
    const form = new FormData();
    form.append("file", file, file.name);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json();
        setClassForm({ ...classForm, imageUrl: data.url });
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      alert("Error uploading image");
    } finally {
      setIsUploadingWorkshopImage(false);
    }
  };

  const handleCreateClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (classForm.type === "WORKSHOP" && !classForm.imageUrl) {
      alert("Workshop banner image is mandatory!");
      return;
    }
    try {
      const res = await fetch(`/api/classes?email=${localStorage.getItem("userEmail")}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...classForm,
          price: parseFloat(classForm.price || "0"),
          capacity: parseInt(classForm.capacity || "1"),
        }),
      });
      if (res.ok) {
        const newClass = await res.json();
        setClasses([...classes, newClass]);
        setClassModalOpen(false);
        setClassForm({ title: "", type: "REGULAR", schedule: "", price: "", capacity: "1", description: "", imageUrl: "" });
      }
    } catch (err) {
      alert("Error saving class");
    }
  };

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        setModelsLoaded(true);
      } catch (e) {
        console.error("Error loading faceapi models:", e);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    const role = localStorage.getItem("userRole");

    if (!email || role !== "coach") {
      navigate({ to: "/login" });
      return;
    }

    Promise.all([
      fetch(`/api/profile/coach/me?email=${email}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/enquiries/coach?email=${email}`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/classes?email=${email}`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/availability?email=${email}`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([data, enquiriesData, classesData, availData]) => {
        if (data && data.profile) {
          setProfile(data.profile);
          setFlags(data.flags || []);
        } else {
          navigate({ to: "/register-coach", search: { edit: true } as any });
        }
        if (Array.isArray(enquiriesData)) {
          setEnquiries(
            enquiriesData.filter(
              (e: any) =>
                e.status === "APPROVED" ||
                e.status === "PENDING_COACH_APPROVAL" ||
                e.status === "REJECTED",
            ),
          );
        }
        if (Array.isArray(classesData)) {
          setClasses(classesData);
        }
        if (Array.isArray(availData)) {
          setAvailabilities(availData);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [navigate]);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );
    return canvas;
  };

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>, type: "profile" | "group") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024)
      return alert("❌ Error: File is too large. Please upload an image smaller than 10MB.");
    if (!modelsLoaded)
      return alert("AI Models are still loading, please wait a second and try again.");

    const url = URL.createObjectURL(file);
    setCropImageSrc(url);
    setCropType(type);
    setCropModalOpen(true);
    setZoom(1);
    e.target.value = "";
  };

  const handleCropConfirm = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    setCropModalOpen(false);

    const isGroup = cropType === "group";
    const setIsUploadingTarget = isGroup ? setIsUploadingGroup : setIsUploading;
    setIsUploadingTarget(true);

    try {
      const croppedCanvas = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const detections = await faceapi.detectAllFaces(
        croppedCanvas as any,
        new faceapi.TinyFaceDetectorOptions(),
      );

      // The face-api check is often too strict for stylized avatars.
      // We will allow the upload to proceed even if it doesn't confidently detect a face.
      if (isGroup) {
        if (detections.length < 2) {
          alert("❌ Error: Please upload an image with multiple people for the group/cover photo.");
          setIsUploadingTarget(false);
          return;
        }
      } else {
        if (detections.length === 0) {
          console.warn("Face-API: No face detected, but allowing upload for avatars/logos.");
        }
      }

      // Compress
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1200;
      let width = croppedCanvas.width;
      let height = croppedCanvas.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = width;
      finalCanvas.height = height;
      const ctx = finalCanvas.getContext("2d");
      ctx?.drawImage(croppedCanvas as any, 0, 0, width, height);

      finalCanvas.toBlob(
        async (blob) => {
          if (!blob) return setIsUploadingTarget(false);
          const form = new FormData();
          form.append("file", blob, "image.jpg");
          try {
            const res = await fetch("/api/upload", { method: "POST", body: form });
            if (res.ok) {
              const data = await res.json();
              const fileUrl = data.url;
              setEditForm((prev: any) => ({
                ...prev,
                [isGroup ? "groupImageUrl" : "profileImageUrl"]: fileUrl,
              }));
              alert("✅ Perfect! Image accepted and optimized.");
            } else {
              alert("Failed to upload image to server.");
            }
          } catch (uploadError) {
            alert("Error connecting to upload server.");
          }
          setIsUploadingTarget(false);
        },
        "image/jpeg",
        0.7,
      );
    } catch (e) {
      alert("Error processing cropped image.");
      setIsUploadingTarget(false);
    }
  };

  const handleUpdateEnquiryStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/enquiries/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setEnquiries(enquiries.map((e) => (e.id === id ? { ...e, status } : e)));
      } else {
        alert("Failed to update status.");
      }
    } catch (e) {
      alert("Error connecting to server.");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const handleToggleActive = async () => {
    try {
      const email = localStorage.getItem("userEmail");
      const res = await fetch(`/api/profile/coach/toggle-active?email=${email}`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setProfile({ ...profile, active: data.isActive });
      } else {
        alert("Failed to toggle status.");
      }
    } catch (e) {
      alert("Error connecting to server.");
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const email = localStorage.getItem("userEmail");
      const res = await fetch(`/api/profile/coach/me?email=${email}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setIsEditing(false);
        alert("Profile updated successfully! Note: Your profile is now Pending Approval.");
      } else {
        const errorText = await res.text();
        alert("Failed to update profile: " + errorText);
      }
    } catch (e) {
      alert("Error connecting to server.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAvailability = async () => {
    setIsSaving(true);
    try {
      const email = localStorage.getItem("userEmail");
      const res = await fetch(`/api/availability?email=${email}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(availabilities),
      });
      if (res.ok) {
        alert("Availability updated successfully!");
      }
    } catch (e) {
      alert("Failed to update availability");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetupPasskey = async () => {
    setPasskeyStatus(null);
    setPasskeyMessage("");
    try {
      const email = localStorage.getItem("userEmail");
      const startRes = await fetch(`/api/passkeys/register/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "coach", email })
      });
      if (!startRes.ok) throw new Error("Failed to start passkey registration");

      const options = await startRes.json();
      const asseResp = await startRegistration({ optionsJSON: options });

      const finishRes = await fetch(`/api/passkeys/register/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(asseResp)
      });

      if (!finishRes.ok) throw new Error("Failed to finish passkey registration");
      setPasskeyStatus("SUCCESS");
      setPasskeyMessage("Passkey successfully registered!");
      localStorage.setItem("hasPasskeyRegistered", "true");
    } catch (err: any) {
      setPasskeyStatus("ERROR");
      setPasskeyMessage(err.message || "Passkey registration failed.");
    }
  };

  const getStatusBanner = () => {
    if (profile?.active === false) {
      return (
        <div className="bg-slate-100 border-l-4 border-slate-500 p-6 rounded-r-2xl mb-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-slate-500 text-white flex items-center justify-center">
              ⏸️
            </span>
            Profile on Leave (Inactive)
          </h2>
          <p className="mt-2 text-slate-600">
            Your profile is currently hidden from the public directory. Students cannot find or book
            you right now.
          </p>
        </div>
      );
    }
    switch (profile?.status) {
      case "PENDING_APPROVAL":
        return (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-2xl mb-8 shadow-sm">
            <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center">
                ⏳
              </span>
              Profile Under Review
            </h2>
            <p className="mt-2 text-amber-700">
              Your profile has been submitted and is currently being reviewed by our team. You will
              be notified once it is live!
            </p>
          </div>
        );
      case "APPROVED":
        return (
          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-2xl mb-8 shadow-sm">
            <h2 className="text-xl font-bold text-green-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                ✓
              </span>
              You are Live!
            </h2>
            <p className="mt-2 text-green-700">
              Your profile is live on the platform. Students can now find and book you!
            </p>
          </div>
        );
      case "REQUEST_CHANGE":
        return (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-2xl mb-8 shadow-sm">
            <h2 className="text-xl font-bold text-red-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center">
                !
              </span>
              Action Required
            </h2>
            <p className="mt-2 text-red-700 font-medium">
              Your profile requires changes before it can be approved:
            </p>
            <ul className="mt-4 space-y-3">
              {flags.map((f, i) => (
                <li
                  key={i}
                  className="bg-white p-4 rounded-xl border border-red-100 shadow-sm flex flex-col gap-2"
                >
                  <span className="font-bold text-slate-800 uppercase text-xs tracking-wider">
                    Field Flagged: {f.flaggedField}
                  </span>
                  <span className="text-slate-600 font-medium">{f.reasonNote}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <button
                onClick={() => navigate({ to: "/register-coach", search: { edit: true } as any })}
                className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg active:scale-95 transition-all"
              >
                Edit Profile Now
              </button>
            </div>
          </div>
        );
      case "REJECTED":
        return (
          <div className="bg-slate-50 border-l-4 border-slate-500 p-6 rounded-r-2xl mb-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Profile Rejected</h2>
            <p className="mt-2 text-slate-600">
              Your profile has been rejected due to multiple policy violations.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Coach Dashboard</h1>
          <button
            onClick={() => {
              localStorage.clear();
              navigate({ to: "/login" });
            }}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 font-bold shadow-sm transition-all hover:border-slate-300"
          >
            Logout
          </button>
        </div>

        {getStatusBanner()}

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden relative">
          <div className="flex flex-col sm:flex-row border-b border-slate-200 bg-slate-50">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 py-4 text-center font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === "overview" ? "text-[#f26b21] border-b-2 border-[#f26b21] bg-white" : "text-slate-500 hover:text-slate-800"}`}
            >
              Profile Overview
            </button>
            <button
              onClick={() => setActiveTab("classes")}
              className={`flex-1 py-4 text-center font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${activeTab === "classes" ? "text-[#f26b21] border-b-2 border-[#f26b21] bg-white" : "text-slate-500 hover:text-slate-800"}`}
            >
              Classes
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "classes" ? "bg-[#f26b21]/10 text-[#f26b21]" : "bg-slate-200 text-slate-600"}`}
              >
                {classes.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex-1 py-4 text-center font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === "calendar" ? "text-[#f26b21] border-b-2 border-[#f26b21] bg-white" : "text-slate-500 hover:text-slate-800"}`}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveTab("enquiries")}
              className={`flex-1 py-4 text-center font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${activeTab === "enquiries" ? "text-[#f26b21] border-b-2 border-[#f26b21] bg-white" : "text-slate-500 hover:text-slate-800"}`}
            >
              Leads / Enquiries
              {enquiries.length > 0 && (
                <span className="bg-teal-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {enquiries.length}
                </span>
              )}
            </button>
          </div>

          <div className="p-8">
            {activeTab === "overview" && (
              <div>
                <div className="relative mb-16">
                  {/* Cover Photo */}
                  <div className="h-48 w-full bg-slate-200 overflow-hidden relative">
                    <img
                      src={
                        profile?.groupImageUrl ||
                        "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80"
                      }
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20"></div>
                  </div>

                  {/* Profile Info Overlay */}
                  <div className="absolute -bottom-12 left-8 flex items-end gap-6 w-full">
                    <img
                      src={profile?.profileImageUrl || "/placeholder.png"}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl bg-white"
                    />
                    <div className="pb-2 bg-white/40 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm border border-white/50">
                      <h2 className="text-3xl font-extrabold text-slate-900 drop-shadow-sm">
                        {profile?.fullName}
                      </h2>
                      <p className="text-slate-800 font-bold text-lg mt-1 drop-shadow-sm">
                        {profile?.expertise} {profile?.location ? `• ${profile.location}` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 px-8 pb-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
                      <p className="text-slate-500">Manage your coaching profile and status.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          if (isEditing) {
                            setIsEditing(false);
                          } else {
                            setEditForm(profile);
                            setIsEditing(true);
                          }
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                      >
                        {isEditing ? "Cancel Edit" : "Edit Profile"}
                      </button>
                      <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                        <span
                          className={`text-sm font-bold ${profile?.active ? "text-teal-600" : "text-slate-500"}`}
                        >
                          {profile?.active ? "Available" : "On Leave"}
                        </span>
                        <button
                          onClick={handleToggleActive}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${profile?.active ? "bg-teal-500" : "bg-slate-300"}`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${profile?.active ? "translate-x-6" : "translate-x-1"}`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={editForm.fullName || ""}
                          onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                          className="w-full px-4 py-2 border rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Expertise / Title
                        </label>
                        <input
                          type="text"
                          value={editForm.expertise || ""}
                          onChange={(e) => setEditForm({ ...editForm, expertise: e.target.value })}
                          className="w-full px-4 py-2 border rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Location (e.g. Mumbai, MH)
                        </label>
                        <input
                          type="text"
                          value={editForm.location || ""}
                          onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                          className="w-full px-4 py-2 border rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Pricing
                        </label>
                        <input
                          type="text"
                          value={editForm.pricing || ""}
                          onChange={(e) => setEditForm({ ...editForm, pricing: e.target.value })}
                          className="w-full px-4 py-2 border rounded-xl"
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Target Audience
                        </label>
                        <select
                          value={editForm.targetAudience || ""}
                          onChange={(e) => setEditForm({ ...editForm, targetAudience: e.target.value })}
                          className="w-full px-4 py-2 border rounded-xl bg-white"
                        >
                          <option value="" disabled>Select age group</option>
                          <option value="Beginners">Beginners</option>
                          <option value="Advanced / Professionals">Advanced / Professionals</option>
                          <option value="Kids & Teens">Kids & Teens</option>
                          <option value="All Ages & Levels">All Ages & Levels</option>
                        </select>
                      </div>
                      <div className="col-span-1 sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                          <label className="block text-sm font-bold text-slate-700 mb-2">
                            Profile Picture (Headshot)
                          </label>
                          <p className="text-xs text-slate-500 mb-4">
                            Must clearly show your face.
                          </p>
                          {editForm.profileImageUrl ? (
                            <div className="relative w-32 h-32 mb-4 mx-auto">
                              <img
                                src={editForm.profileImageUrl}
                                alt="Preview"
                                className="w-full h-full object-cover rounded-full border-4 border-white shadow-lg"
                              />
                              <button
                                onClick={() => setEditForm({ ...editForm, profileImageUrl: "" })}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow hover:bg-red-600"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-white transition-colors cursor-pointer relative overflow-hidden">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleSelectFile(e, "profile")}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <span className="text-3xl mb-2 block">📸</span>
                              <span className="text-sm font-medium text-slate-600">
                                {isUploading ? "Uploading..." : "Click or drop headshot"}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                          <label className="block text-sm font-bold text-slate-700 mb-2">
                            Cover Banner (Group Image)
                          </label>
                          <p className="text-xs text-slate-500 mb-4">
                            Must contain 2 or more people.
                          </p>
                          {editForm.groupImageUrl ? (
                            <div className="relative w-full h-32 mb-4">
                              <img
                                src={editForm.groupImageUrl}
                                alt="Preview"
                                className="w-full h-full object-cover rounded-xl border-4 border-white shadow-lg"
                              />
                              <button
                                onClick={() => setEditForm({ ...editForm, groupImageUrl: "" })}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow hover:bg-red-600"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-white transition-colors cursor-pointer relative overflow-hidden">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleSelectFile(e, "group")}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <span className="text-3xl mb-2 block">👥</span>
                              <span className="text-sm font-medium text-slate-600">
                                {isUploadingGroup ? "Uploading..." : "Click or drop group photo"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Description / Bio
                        </label>
                        <textarea
                          rows={4}
                          value={editForm.description || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, description: e.target.value })
                          }
                          className="w-full px-4 py-2 border rounded-xl"
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2 flex justify-end pt-4 border-t">
                        <button
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          className="px-6 py-3 bg-[#f26b21] hover:bg-[#e05a10] text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                        >
                          {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Pricing
                        </h3>
                        <p className="font-bold text-slate-800 text-lg">{profile?.pricing}</p>
                      </div>
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Target Audience
                        </h3>
                        <p className="font-bold text-slate-800 text-lg">
                          {profile?.targetAudience}
                        </p>
                      </div>
                      <div className="col-span-1 sm:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Description
                        </h3>
                        <p className="font-medium text-slate-700 leading-relaxed">
                          {profile?.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="mt-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                            Security Settings
                          </h3>
                          <p className="text-sm text-slate-500 mt-1">
                            Set up Passkeys (FaceID, TouchID) for faster, more secure login without OTP.
                          </p>
                        </div>
                        <button
                          onClick={handleSetupPasskey}
                          className={`px-4 py-2 font-bold rounded-xl shadow-sm transition-colors text-sm ${
                            passkeyStatus === "SUCCESS"
                              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                              : passkeyStatus === "ERROR"
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : "bg-slate-900 hover:bg-slate-800 text-white"
                          }`}
                        >
                          {passkeyStatus === "SUCCESS"
                            ? "✓ Registered"
                            : passkeyStatus === "ERROR"
                            ? "Try Again"
                            : "Register Passkey"}
                        </button>
                      </div>
                      {passkeyMessage && (
                        <p
                          className={`mt-3 text-sm font-bold ${
                            passkeyStatus === "SUCCESS" ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {passkeyMessage}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "classes" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900">Your Classes</h2>
                    <p className="text-slate-500 mt-1">
                      Create specific classes, workshops, or batches for students to join.
                    </p>
                  </div>
                  <button
                    onClick={() => setClassModalOpen(true)}
                    className="bg-[#f26b21] text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-[#e05a10] transition-colors flex items-center gap-2 whitespace-nowrap w-full sm:w-auto justify-center"
                  >
                    + Create New Class
                  </button>
                </div>

                {classes.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-5xl mb-4">📅</div>
                    <h3 className="text-xl font-bold text-slate-700">No classes created yet</h3>
                    <p className="text-slate-500 mt-2 max-w-md mx-auto">
                      Create specific batches with schedules and prices to make it easier for
                      students to join your coaching.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {classes.map((c) => (
                      <div
                        key={c.id}
                        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#f26b21]/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform"></div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">{c.title}</h3>
                            {c.type && c.type !== "REGULAR" && (
                              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700">
                                {c.type.replace("_", " ")}
                              </span>
                            )}
                          </div>
                          <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm font-bold">
                            {c.price === 0 ? "Free" : `₹${c.price}`}
                          </span>
                        </div>
                        <p className="text-slate-600 mb-4 line-clamp-2">{c.description}</p>
                        <div className="space-y-2 mb-6">
                          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                            <span>🕒</span> {c.schedule}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                            <span>👥</span> Up to {c.capacity} students
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              if (!window.confirm("Are you sure you want to delete this class?"))
                                return;
                              fetch(
                                `/api/classes/${c.id}?email=${localStorage.getItem("userEmail")}`,
                                { method: "DELETE" },
                              )
                                .then(() => setClasses(classes.filter((cl) => cl.id !== c.id)))
                                .catch(() => alert("Error deleting class"));
                            }}
                            className="w-full py-2 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
                          >
                            Delete Class
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "calendar" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900">
                      Availability Calendar
                    </h2>
                    <p className="text-slate-500">
                      Set the hours you are available for coaching each day.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveAvailability}
                    disabled={isSaving}
                    className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-teal-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save Schedule"}
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  {[
                    "MONDAY",
                    "TUESDAY",
                    "WEDNESDAY",
                    "THURSDAY",
                    "FRIDAY",
                    "SATURDAY",
                    "SUNDAY",
                  ].map((day) => {
                    const avail = availabilities.find((a) => a.dayOfWeek === day);
                    const isAvailable = !!avail;

                    return (
                      <div
                        key={day}
                        className="flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-b-0"
                      >
                        <div className="flex items-center gap-4 w-1/3">
                          <input
                            type="checkbox"
                            checked={isAvailable}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAvailabilities([
                                  ...availabilities,
                                  { dayOfWeek: day, startTime: "09:00", endTime: "17:00" },
                                ]);
                              } else {
                                setAvailabilities(
                                  availabilities.filter((a) => a.dayOfWeek !== day),
                                );
                              }
                            }}
                            className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                          />
                          <span className="font-bold text-slate-700 w-24">
                            {day.charAt(0) + day.slice(1).toLowerCase()}
                          </span>
                        </div>

                        {isAvailable ? (
                          <div className="flex items-center gap-4 flex-1 justify-end">
                            <input
                              type="time"
                              value={avail.startTime}
                              onChange={(e) =>
                                setAvailabilities(
                                  availabilities.map((a) =>
                                    a.dayOfWeek === day ? { ...a, startTime: e.target.value } : a,
                                  ),
                                )
                              }
                              className="px-3 py-1.5 border rounded-lg text-sm font-medium"
                            />
                            <span className="text-slate-400">to</span>
                            <input
                              type="time"
                              value={avail.endTime}
                              onChange={(e) =>
                                setAvailabilities(
                                  availabilities.map((a) =>
                                    a.dayOfWeek === day ? { ...a, endTime: e.target.value } : a,
                                  ),
                                )
                              }
                              className="px-3 py-1.5 border rounded-lg text-sm font-medium"
                            />
                          </div>
                        ) : (
                          <div className="flex-1 text-right text-slate-400 font-medium italic text-sm">
                            Unavailable
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "enquiries" && (
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Leads / Enquiries</h2>
                {enquiries.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-slate-500 font-medium">
                      No enquiries yet. Check back later!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enquiries.map((enquiry) => (
                      <div
                        key={enquiry.id}
                        className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-slate-900">
                              {enquiry.leadName || enquiry.student?.fullName || "Visitor"}
                            </h3>
                            {enquiry.status === "APPROVED" && (
                              <div className="mt-2 space-y-1">
                                <p className="text-teal-600 font-medium text-sm flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                  {enquiry.leadEmail || enquiry.student?.user?.email}
                                </p>
                                {(enquiry.leadPhone || enquiry.student?.user?.phoneNumber) && (
                                  <p className="text-teal-600 font-medium text-sm flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    {enquiry.leadPhone || enquiry.student?.user?.phoneNumber}
                                  </p>
                                )}
                                {(enquiry.leadLocation || enquiry.student?.location) && (
                                  <p className="text-slate-500 font-medium text-sm flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    {enquiry.leadLocation || enquiry.student?.location}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <div>
                            {enquiry.status === "PENDING_COACH_APPROVAL" && (
                              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                Pending
                              </span>
                            )}
                            {enquiry.status === "APPROVED" && (
                              <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                Accepted
                              </span>
                            )}
                            {enquiry.status === "REJECTED" && (
                              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                Declined
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl mb-4 text-slate-700 border border-slate-100">
                          <p className="italic">"{enquiry.message}"</p>
                        </div>

                        {enquiry.status === "PENDING_COACH_APPROVAL" && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleUpdateEnquiryStatus(enquiry.id, "APPROVED")}
                              className="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors flex-1"
                            >
                              Accept & Show Contact
                            </button>
                            <button
                              onClick={() => handleUpdateEnquiryStatus(enquiry.id, "REJECTED")}
                              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors flex-1"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {cropModalOpen && cropImageSrc && (
        <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">Crop Image</h3>
              <p className="text-sm text-slate-500">Adjust the image so it looks perfect.</p>
            </div>

            <div className="relative h-[60vh] bg-slate-100">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={cropType === "profile" ? 1 : 16 / 9}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-6 flex justify-end gap-3">
              <button
                onClick={() => setCropModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCropConfirm}
                className="px-6 py-2.5 rounded-xl font-bold bg-[#f26b21] text-white hover:bg-[#e05a10]"
              >
                Confirm & Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {classModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white/80 backdrop-blur-xl border border-white/50 w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/40 flex justify-between items-center bg-white/40">
              <h2 className="text-2xl font-extrabold text-slate-900">
                {classForm.type === "WORKSHOP" ? "Create Workshop" : "Create Class"}
              </h2>
              <button
                onClick={() => setClassModalOpen(false)}
                className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="createClassForm" onSubmit={handleCreateClassSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                  <input
                    required
                    type="text"
                    value={classForm.title}
                    onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/80 focus:outline-none focus:ring-2 focus:ring-[#f26b21] transition-all"
                    placeholder="e.g. Summer Coding Bootcamp"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Type</label>
                    <select
                      value={classForm.type}
                      onChange={(e) => setClassForm({ ...classForm, type: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/80 focus:outline-none focus:ring-2 focus:ring-[#f26b21] transition-all"
                    >
                      <option value="REGULAR">Regular Class</option>
                      <option value="WORKSHOP">Workshop</option>
                      <option value="CAMP">Camp</option>
                      <option value="TRIAL_CLASS">Trial Class</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Schedule</label>
                    <input
                      required
                      type="text"
                      value={classForm.schedule}
                      onChange={(e) => setClassForm({ ...classForm, schedule: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/80 focus:outline-none focus:ring-2 focus:ring-[#f26b21] transition-all"
                      placeholder="e.g. Saturdays 10:00 AM"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Price (₹)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={classForm.price}
                      onChange={(e) => setClassForm({ ...classForm, price: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/80 focus:outline-none focus:ring-2 focus:ring-[#f26b21] transition-all"
                      placeholder="0.00 for free"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Capacity</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={classForm.capacity}
                      onChange={(e) => setClassForm({ ...classForm, capacity: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/80 focus:outline-none focus:ring-2 focus:ring-[#f26b21] transition-all"
                      placeholder="Number of students"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={classForm.description}
                    onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/80 focus:outline-none focus:ring-2 focus:ring-[#f26b21] transition-all resize-none"
                    placeholder="Describe what students will learn..."
                  />
                </div>

                {classForm.type === "WORKSHOP" && (
                  <div className="p-5 rounded-2xl bg-orange-50 border border-orange-100">
                    <label className="block text-sm font-bold text-orange-900 mb-2">Workshop Banner Image (Mandatory)</label>
                    {classForm.imageUrl ? (
                      <div className="relative rounded-xl overflow-hidden aspect-video bg-black/5 group">
                        <img src={classForm.imageUrl} alt="Workshop Banner" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm shadow-lg hover:bg-slate-50 transition-colors">
                            Change Image
                            <input type="file" className="hidden" accept="image/*" onChange={handleWorkshopImageUpload} disabled={isUploadingWorkshopImage} />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed border-orange-200 bg-white/50 cursor-pointer hover:bg-white hover:border-orange-400 transition-all text-orange-500">
                        {isUploadingWorkshopImage ? (
                          <div className="font-bold animate-pulse">Uploading...</div>
                        ) : (
                          <>
                            <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="font-bold text-sm">Click to upload banner</span>
                          </>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleWorkshopImageUpload} disabled={isUploadingWorkshopImage} />
                      </label>
                    )}
                  </div>
                )}
              </form>
            </div>

            <div className="p-6 border-t border-white/40 bg-white/40 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setClassModalOpen(false)}
                className="px-6 py-3 rounded-xl font-bold bg-white/50 text-slate-600 hover:bg-white transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="createClassForm"
                className="px-6 py-3 rounded-xl font-bold bg-[#f26b21] text-white hover:bg-[#e05a10] transition-colors shadow-md"
              >
                {classForm.type === "WORKSHOP" ? "Publish Workshop" : "Create Class"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
