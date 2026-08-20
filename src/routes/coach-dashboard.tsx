import { createFileRoute, useNavigate } from "@tanstack/react-router"; // test
import { useState, useEffect, useCallback } from "react";
import * as faceapi from "face-api.js";
import Cropper from "react-easy-crop";
import { startRegistration } from "@simplewebauthn/browser";

export const Route = createFileRoute("/coach-dashboard")({
  component: CoachDashboard,
});

function CoachDashboard() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
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
  const [dobError, setDobError] = useState("");
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"profile" | "group" | "workshop">("profile");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [classModalOpen, setClassModalOpen] = useState(false);
  const [classForm, setClassForm] = useState<any>({
    id: null,
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
    if (file.size > 10 * 1024 * 1024)
      return alert("❌ Error: File is too large. Please upload an image smaller than 10MB.");

    const url = URL.createObjectURL(file);
    setCropImageSrc(url);
    setCropType("workshop");
    setCropModalOpen(true);
    setZoom(1);
    e.target.value = "";
  };

  const handleCreateClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (classForm.description && classForm.description.trim().split(/\s+/).length > 250) {
      return alert("Class/Workshop Description must not exceed 250 words!");
    }
    if (classForm.type === "WORKSHOP" && !classForm.imageUrl) {
      alert("Workshop banner image is mandatory!");
      return;
    }
    try {
      const isEdit = !!classForm.id;
      const url = isEdit
        ? `/api/classes/${classForm.id}?email=${localStorage.getItem("userEmail")}`
        : `/api/classes?email=${localStorage.getItem("userEmail")}`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...classForm,
          price: parseFloat(classForm.price || "0"),
          capacity: parseInt(classForm.capacity || "1"),
        }),
      });
      if (res.ok) {
        const newClass = await res.json();
        if (isEdit) {
          setClasses(classes.map(c => c.id === newClass.id ? newClass : c));
        } else {
          setClasses([...classes, newClass]);
        }
        setClassModalOpen(false);
        setClassForm({ id: null, title: "", type: "REGULAR", schedule: "", price: "", capacity: "1", description: "", imageUrl: "" });
      } else {
        alert("Error saving class");
      }
    } catch (e) {
      console.error(e);
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
      fetch(`/api/profile/coach/me?email=${email}`),
      fetch(`/api/enquiries/coach?email=${email}`),
      fetch(`/api/classes?email=${email}`),
      fetch(`/api/availability?email=${email}`),
    ])
      .then(async (responses) => {
        if (responses.some(r => r.status === 401 || r.status === 403)) {
          localStorage.removeItem("userEmail");
          localStorage.removeItem("userRole");
          localStorage.removeItem("token");
          localStorage.removeItem("coachToken");
          navigate({ to: "/login" });
          return null;
        }
        return Promise.all([
          responses[0].ok ? responses[0].json() : null,
          responses[1].ok ? responses[1].json() : [],
          responses[2].ok ? responses[2].json() : [],
          responses[3].ok ? responses[3].json() : [],
        ]);
      })
      .then((results) => {
        if (!results) return;
        const [data, enquiriesData, classesData, availData] = results;
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
    const isWorkshop = cropType === "workshop";
    const setIsUploadingTarget = isWorkshop ? setIsUploadingWorkshopImage : (isGroup ? setIsUploadingGroup : setIsUploading);
    setIsUploadingTarget(true);

    try {
      const croppedCanvas = await getCroppedImg(cropImageSrc, croppedAreaPixels);

      if (!isWorkshop) {
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
              if (isWorkshop) {
                setClassForm((prev: any) => ({ ...prev, imageUrl: fileUrl }));
              } else {
                setEditForm((prev: any) => ({
                  ...prev,
                  [isGroup ? "groupImageUrl" : "profileImageUrl"]: fileUrl,
                }));
              }
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

  
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.slice(0, 8);
    if (val.length > 4) {
      val = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`;
    } else if (val.length > 2) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setEditForm({ ...editForm, dob: val, dateOfBirth: val });

    if (val.length === 10) {
      const parts = val.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1940 || year > currentYear) {
          setDobError(`Please enter a valid year between 1940 and ${currentYear}`);
        } else {
          const dobDate = new Date(year, month, day);
          let age = currentYear - year;
          const today = new Date();
          const m = today.getMonth() - dobDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
            age--;
          }
          if (age < 18) {
            setDobError("You must be at least 18 years old to be a coach.");
          } else if (age > 100) {
            setDobError("Date of Birth cannot be more than 100 years ago.");
          } else {
            setDobError("");
          }
        }
      }
    } else {
      setDobError("");
    }
  };


  const handlePincodeChange = async (pincode: string) => {
    setEditForm((prev: any) => ({ ...prev, pincode }));
    if (pincode.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await res.json();
        if (data && data[0].Status === "Success") {
          const po = data[0].PostOffice[0];
          setEditForm((prev: any) => ({
            ...prev,
            area: po.Name,
            district: po.District,
            state: po.State
          }));
        } else {
          alert("Invalid Pincode! Please enter a valid 6-digit Indian pincode.");
          setEditForm((prev: any) => ({ ...prev, area: '', district: '', state: '' }));
        }
      } catch (e) {
        console.error("Pincode fetch failed", e);
        setEditForm((prev: any) => ({ ...prev, area: '', district: '', state: '' }));
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!editForm.pincode || editForm.pincode.length !== 6) {
      return alert("Please enter a valid 6-digit Pincode!");
    }

    if (editForm.mobile && (!/^[6-9]/.test(editForm.mobile) || editForm.mobile.length !== 10)) {
      return alert("Mobile number must be 10 digits and start with 6, 7, 8, or 9!");
    }
    if (editForm.description && editForm.description.trim().split(/\s+/).length > 250) {
      return alert("About Me / Description must not exceed 250 words!");
    }
    if (dobError) {
      return alert(dobError);
    }
    editForm.dob = editForm.dob || editForm.dateOfBirth;
    if (!editForm.dob || editForm.dob.length !== 10) {
      return alert("Please enter a complete Date of Birth (DD/MM/YYYY)!");
    }
    
    const dobParts = editForm.dob.split('/');
    if (dobParts.length === 3) {
      const day = parseInt(dobParts[0], 10);
      const month = parseInt(dobParts[1], 10) - 1;
      const year = parseInt(dobParts[2], 10);
      const dobDate = new Date(year, month, day);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1940 || year > currentYear) return alert(`Please enter a valid year between 1940 and ${currentYear}!`);
      
      let age = currentYear - year;
      const today = new Date();
      const m = today.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }

      if (age < 18) return alert("You must be at least 18 years old to be a coach.");
      if (age > 100) return alert("Date of Birth cannot be more than 100 years ago!");
    } else {
      return alert("Please enter a valid Date of Birth (DD/MM/YYYY)!");
    }

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
    editForm.dob = editForm.dob || editForm.dateOfBirth;

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

          {showLogoutModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 transform transition-all">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </div>
                <h3 className="text-2xl font-black text-center text-slate-800 mb-2">Done Coaching?</h3>
                <p className="text-center text-slate-500 mb-8">Taking a breather from shaping minds and changing lives? We get it. Are you sure you want to log out?</p>
                <div className="flex gap-4">
                  <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-6 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Keep Coaching</button>
                  <button onClick={() => { localStorage.clear(); setShowLogoutModal(false); navigate({ to: '/' }); }} className="flex-1 px-6 py-3 font-bold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-all">Yes, Log out</button>
                </div>
              </div>
            </div>
          )}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/50 to-orange-50/30 py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-400/10 rounded-full blur-[120px] -z-10 mix-blend-multiply"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-400/10 rounded-full blur-[100px] -z-10 mix-blend-multiply"></div>

      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Coach Dashboard</h1>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 font-bold shadow-sm transition-all hover:border-slate-300"
          >
            Logout
          </button>
        </div>

        {getStatusBanner()}

        <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] shadow-xl border border-white overflow-hidden relative">
          <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 w-full [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full pb-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`shrink-0 min-w-[140px] px-4 py-4 text-center font-bold text-sm uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === "overview" ? "text-[#f26b21] border-b-2 border-[#f26b21] bg-white" : "text-slate-500 hover:text-slate-800"}`}
            >
              Profile Overview
            </button>
            <button
              onClick={() => setActiveTab("classes")}
              className={`shrink-0 min-w-[140px] px-4 py-4 text-center font-bold text-sm uppercase tracking-wider transition-colors whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === "classes" ? "text-[#f26b21] border-b-2 border-[#f26b21] bg-white" : "text-slate-500 hover:text-slate-800"}`}
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
              className={`shrink-0 min-w-[140px] px-4 py-4 text-center font-bold text-sm uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === "calendar" ? "text-[#f26b21] border-b-2 border-[#f26b21] bg-white" : "text-slate-500 hover:text-slate-800"}`}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveTab("enquiries")}
              className={`shrink-0 min-w-[140px] px-4 py-4 text-center font-bold text-sm uppercase tracking-wider transition-colors whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === "enquiries" ? "text-[#f26b21] border-b-2 border-[#f26b21] bg-white" : "text-slate-500 hover:text-slate-800"}`}
            >
              Leads / Enquiries
              {enquiries.filter((e: any) => e.status === 'PENDING_COACH_APPROVAL').length > 0 && (
                <span className="bg-teal-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {enquiries.filter((e: any) => e.status === 'PENDING_COACH_APPROVAL').length}
                </span>
              )}
            </button>
          </div>

          <div className="p-8">
            {activeTab === "overview" && (
              <div>
                <div className="relative mb-24 sm:mb-16">
                  {/* Cover Photo */}
                  <div className="h-32 sm:h-48 w-full bg-slate-200 overflow-hidden relative">
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
                  <div className="absolute -bottom-20 sm:-bottom-12 left-4 sm:left-8 flex flex-col sm:flex-row items-start sm:items-end gap-2 sm:gap-6 w-[calc(100%-2rem)] sm:w-auto">
                    <img
                      src={profile?.profileImageUrl || "/placeholder.png"}
                      alt="Profile"
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-xl bg-white"
                    />
                    <div className="pb-1 sm:pb-2 bg-white/60 sm:bg-white/40 backdrop-blur-md px-3 sm:px-4 py-1 sm:py-2 rounded-xl shadow-sm border border-white/50 mb-1 sm:mb-0">
                      <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 drop-shadow-sm line-clamp-1">
                        {profile?.fullName}
                      </h2>
                      <p className="text-slate-800 font-bold text-sm sm:text-lg mt-0.5 sm:mt-1 drop-shadow-sm line-clamp-1">
                        {profile?.expertise} {profile?.location ? `• ${profile.location}` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 px-4 sm:px-8 pb-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
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
                            setEditForm({ ...profile, mobile: profile?.user?.phoneNumber || "" });
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 relative z-10 bg-white/60 backdrop-blur-md p-4 sm:p-6 rounded-3xl shadow-sm border border-white">
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
                        <label className="block text-sm font-bold text-slate-700 mb-2">Date of Birth</label>
                        <input type="text" placeholder="DD/MM/YYYY" value={editForm.dob || editForm.dateOfBirth || ""} onChange={handleDobChange} className={`w-full px-4 py-2 border rounded-xl ${dobError ? 'border-red-500' : ''}`} />
                        {dobError && <p className="text-red-500 text-xs font-bold mt-1">{dobError}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                        <select value={editForm.category || ""} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="w-full px-4 py-2 border rounded-xl">
                          <option value="">Select a Category</option>
                          <option value="Sports">Sports</option>
                          <option value="Academics">Academics</option>
                          <option value="Arts">Arts</option>
                          <option value="Music">Music</option>
                          <option value="Dance">Dance</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Class Mode</label>
                        <select value={editForm.classMode || ""} onChange={e => setEditForm({ ...editForm, classMode: e.target.value })} className="w-full px-4 py-2 border rounded-xl">
                          <option value="">Select Class Mode</option>
                          <option value="Online">Online</option>
                          <option value="Offline">Offline</option>
                          <option value="Hybrid">Hybrid</option>
                        </select>
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
                          Mobile Number
                        </label>
                        <input
                          type="text"
                          maxLength={10}
                          value={editForm.mobile || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 10) setEditForm({ ...editForm, mobile: val });
                          }}
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


                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Pincode</label>
                        <input type="text" maxLength={6} value={editForm.pincode || ""} onChange={(e) => handlePincodeChange(e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-2 border rounded-xl" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Area / Location Name</label>
                        <input type="text" value={editForm.area || ""} readOnly className="w-full px-4 py-2 border rounded-xl bg-slate-50" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">District / City</label>
                        <input type="text" value={editForm.district || ""} readOnly className="w-full px-4 py-2 border rounded-xl bg-slate-50" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">State</label>
                        <input type="text" value={editForm.state || ""} readOnly className="w-full px-4 py-2 border rounded-xl bg-slate-50" />
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
                          Intro Video URL (YouTube)
                        </label>
                        <input
                          type="text"
                          value={editForm.introVideoUrl || ""}
                          onChange={(e) => setEditForm({ ...editForm, introVideoUrl: e.target.value })}
                          className="w-full px-4 py-2 border rounded-xl mb-6"
                          placeholder="https://youtube.com/watch?v=..."
                        />
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                      {[
                        { label: 'Email', value: profile?.user?.email || localStorage.getItem('userEmail') },
                        { label: 'Mobile Number', value: profile?.user?.phoneNumber || profile?.mobile },
                        { label: 'Date of Birth', value: profile?.dob || profile?.dateOfBirth },
                        { label: 'Category', value: profile?.category },
                        { label: 'Class Mode', value: profile?.classMode },
                        { label: 'Pricing', value: profile?.pricing },
                        { label: 'Target Audience', value: profile?.targetAudience },
                        { label: 'Pincode', value: profile?.pincode },
                        { label: 'Area / District', value: `${profile?.area || ''} ${profile?.district ? ', ' + profile.district : ''}` },
                        { label: 'State', value: profile?.state },
                      ].map((item, i) => (
                        <div key={i} className="bg-white/80 p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</h3>
                          <p className="font-bold text-slate-800 text-sm text-right">{item.value || '-'}</p>
                        </div>
                      ))}

                      <div className="col-span-1 sm:col-span-2 bg-white/80 p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description / Bio</h3>
                        <p className="font-medium text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">{profile?.description || '-'}</p>
                      </div>
                      <div className="col-span-1 sm:col-span-2 bg-white/80 p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Intro Video URL (YouTube)</h3>
                        {profile?.introVideoUrl ? (
                          <a href={profile.introVideoUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-teal-600 hover:text-teal-700 text-sm hover:underline flex items-center gap-2">
                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                            {profile.introVideoUrl}
                          </a>
                        ) : (
                          <p className="font-bold text-slate-800 text-sm">-</p>
                        )}
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
                          className={`px-4 py-2 font-bold rounded-xl shadow-sm transition-colors text-sm ${passkeyStatus === "SUCCESS"
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
                          className={`mt-3 text-sm font-bold ${passkeyStatus === "SUCCESS" ? "text-emerald-600" : "text-red-600"
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
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Your Classes</h2>
                    <p className="text-sm sm:text-base text-slate-500 mt-1">
                      Create specific classes, workshops, or batches for students to join.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setClassForm({ id: null, title: "", type: "REGULAR", schedule: "", price: "", capacity: "1", description: "", imageUrl: "" });
                      setClassModalOpen(true);
                    }}
                    className="bg-[#f26b21] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#d95d1c] transition-all shadow-md active:scale-95 flex items-center gap-2 w-full sm:w-auto justify-center"
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
                        className="bg-white/70 backdrop-blur-md border border-white rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
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
                              setClassForm({
                                id: c.id,
                                title: c.title,
                                type: c.type || "REGULAR",
                                schedule: c.schedule,
                                price: c.price,
                                capacity: c.capacity,
                                description: c.description || "",
                                imageUrl: c.imageUrl || "",
                              });
                              setClassModalOpen(true);
                            }}
                            className="w-1/2 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                          >
                            Edit
                          </button>
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
                            className="w-1/2 py-2 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                      Availability Calendar
                    </h2>
                    <p className="text-sm sm:text-base text-slate-500">
                      Set the hours you are available for coaching each day.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveAvailability}
                    disabled={isSaving}
                    className="w-full sm:w-auto bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-teal-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save Schedule"}
                  </button>
                </div>

                <div className="bg-white/70 backdrop-blur-md border border-white rounded-[1rem] sm:rounded-[2rem] overflow-hidden shadow-sm">
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
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-b-0 gap-3 sm:gap-0"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-1/3">
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
                          <div className="flex items-center gap-2 sm:gap-4 w-full sm:flex-1 justify-start sm:justify-end pl-8 sm:pl-0">
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
                              className="px-2 py-1 sm:px-3 sm:py-1.5 border rounded-lg text-xs sm:text-sm font-medium w-[100px] sm:w-auto"
                            />
                            <span className="text-slate-400 text-xs sm:text-sm">to</span>
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
                              className="px-2 py-1 sm:px-3 sm:py-1.5 border rounded-lg text-xs sm:text-sm font-medium w-[100px] sm:w-auto"
                            />
                          </div>
                        ) : (
                          <div className="w-full sm:flex-1 text-left sm:text-right pl-8 sm:pl-0 text-slate-400 font-medium italic text-xs sm:text-sm">
                            Unavailable
                          </div>
                        )}

                        {showLogoutModal && (
                          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 transform transition-all">
                              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                              </div>
                              <h3 className="text-2xl font-black text-center text-slate-800 mb-2">Done Coaching?</h3>
                              <p className="text-center text-slate-500 mb-8">Taking a breather from shaping minds and changing lives? We get it. Are you sure you want to log out?</p>
                              <div className="flex gap-4">
                                <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-6 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Keep Coaching</button>
                                <button onClick={() => { localStorage.clear(); setShowLogoutModal(false); navigate({ to: '/' }); }} className="flex-1 px-6 py-3 font-bold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-all">Yes, Log out</button>
                              </div>
                            </div>
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
                        className="bg-white/70 backdrop-blur-md border border-white p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0 mb-4">
                          <div className="flex justify-between items-center w-full sm:w-auto">
                            <h3 className="font-bold text-lg text-slate-900">
                              {enquiry.leadName || enquiry.student?.fullName || "Visitor"}
                            </h3>
                            <div className="block sm:hidden">
                              {enquiry.status === "PENDING_COACH_APPROVAL" && (
                                <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-[10px] font-bold uppercase">
                                  Pending
                                </span>
                              )}
                              {enquiry.status === "APPROVED" && (
                                <span className="bg-teal-100 text-teal-800 px-2 py-1 rounded-full text-[10px] font-bold uppercase">
                                  Accepted
                                </span>
                              )}
                              {enquiry.status === "REJECTED" && (
                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-[10px] font-bold uppercase">
                                  Declined
                                </span>
                              )}
                            </div>
                          </div>
                          {enquiry.status === "APPROVED" && (
                            <div className="mt-1 sm:mt-2 space-y-1 w-full sm:w-auto">
                              <p className="text-teal-600 font-medium text-sm flex items-center gap-1 break-all">
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                {enquiry.leadEmail || enquiry.student?.user?.email}
                              </p>
                              {(enquiry.leadPhone || enquiry.student?.user?.phoneNumber) && (
                                <p className="text-teal-600 font-medium text-sm flex items-center gap-1">
                                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                  {enquiry.leadPhone || enquiry.student?.user?.phoneNumber}
                                </p>
                              )}
                              {(enquiry.leadLocation || enquiry.student?.location) && (
                                <p className="text-slate-500 font-medium text-sm flex items-center gap-1">
                                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                  {enquiry.leadLocation || enquiry.student?.location}
                                </p>
                              )}
                            </div>
                          )}
                          <div className="hidden sm:block">
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
        <div className="fixed inset-0 bg-slate-900/90 z-[60] flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] border border-white w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl">
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
          <div className="bg-white/80 backdrop-blur-xl border border-white/50 w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]">
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
                    <div className="flex gap-2 items-center">
                      <select
                        required
                        value={classForm.schedule.split(' ')[0] || ''}
                        onChange={(e) => {
                          const parts = classForm.schedule.split(' ');
                          const start = parts[1] || '';
                          const end = parts[3] || '';
                          const newSched = `${e.target.value} ${start} - ${end}`.trim().replace(/(^\s*-\s*$|^\s*-\s*|\s*-\s*$)/, '');
                          setClassForm({ ...classForm, schedule: newSched })
                        }}
                        className="flex-1 px-3 py-3 rounded-xl bg-white/60 border border-white/80 focus:outline-none focus:ring-2 focus:ring-[#f26b21] transition-all text-sm"
                      >
                        <option value="">Day</option>
                        <option value="Mondays">Mondays</option>
                        <option value="Tuesdays">Tuesdays</option>
                        <option value="Wednesdays">Wednesdays</option>
                        <option value="Thursdays">Thursdays</option>
                        <option value="Fridays">Fridays</option>
                        <option value="Saturdays">Saturdays</option>
                        <option value="Sundays">Sundays</option>
                        <option value="Weekends">Weekends</option>
                        <option value="Daily">Daily</option>
                      </select>
                      <input
                        required
                        type="time"
                        value={classForm.schedule.split(' ')[1] || ''}
                        onChange={(e) => {
                          const parts = classForm.schedule.split(' ');
                          const day = parts[0] || '';
                          const end = parts[3] || '';
                          const newSched = `${day} ${e.target.value} - ${end}`.trim().replace(/(^\s*-\s*$|^\s*-\s*|\s*-\s*$)/, '');
                          setClassForm({ ...classForm, schedule: newSched })
                        }}
                        className="flex-1 px-2 py-3 rounded-xl bg-white/60 border border-white/80 focus:outline-none focus:ring-2 focus:ring-[#f26b21] transition-all text-sm"
                      />
                      <span className="text-slate-400 font-bold">-</span>
                      <input
                        required
                        type="time"
                        value={classForm.schedule.split(' ')[3] || ''}
                        onChange={(e) => {
                          const parts = classForm.schedule.split(' ');
                          const day = parts[0] || '';
                          const start = parts[1] || '';
                          let newSched = `${day} ${start} - ${e.target.value}`.trim();
                          if (newSched === '-') newSched = '';
                          setClassForm({ ...classForm, schedule: newSched })
                        }}
                        className="flex-1 px-2 py-3 rounded-xl bg-white/60 border border-white/80 focus:outline-none focus:ring-2 focus:ring-[#f26b21] transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Price (₹)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={classForm.price}
                      onKeyDown={(e) => {
                        if (['e', 'E', '+', '-'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
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
                    <label className="block text-sm font-bold text-orange-900 mb-1">Workshop Banner Image (Mandatory)</label>
                    <p className="text-xs text-orange-700/80 font-medium mb-3">Upload a cool banner, your logo, or even a picture of a potato (though students might prefer knowing what the workshop is actually about 🥔).</p>
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

      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 transform transition-all">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </div>
            <h3 className="text-2xl font-black text-center text-slate-800 mb-2">Done Coaching?</h3>
            <p className="text-center text-slate-500 mb-8">Taking a breather from shaping minds and changing lives? We get it. Are you sure you want to log out?</p>
            <div className="flex gap-4">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-6 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Keep Coaching</button>
              <button onClick={() => { localStorage.clear(); setShowLogoutModal(false); navigate({ to: '/' }); }} className="flex-1 px-6 py-3 font-bold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-all">Yes, Log out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
