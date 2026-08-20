import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import Cropper from 'react-easy-crop';

export const Route = createFileRoute('/register-coach')({
  component: CoachRegisterPage,
});

function CoachRegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<any[]>([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [demandId, setDemandId] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const demand = searchParams.get('demandId');
    if (demand) setDemandId(demand);
    const savedEmail = localStorage.getItem('userEmail');
    const savedRole = localStorage.getItem('userRole');

    // Only enter Edit Mode if explicitly requested via query parameter
    const isEditRequested = window.location.search.includes('edit=true');

    if (savedEmail && savedRole === 'coach' && isEditRequested) {
      setIsEditMode(true);
      setEmailVerified(true);
      setFormData(prev => ({ ...prev, email: savedEmail }));

      fetch(`/api/profile/coach/me?email=${savedEmail}`)
        .then(res => res.json())
        .then(data => {
          if (data.profile) {
            let minP = '';
            let maxP = '';
            if (data.profile.pricing) {
              const parts = data.profile.pricing.match(/\d+/g);
              if (parts && parts.length >= 2) {
                minP = parts[0];
                maxP = parts[1];
              }
            }
            setFormData(prev => ({
              ...prev,
              fullName: data.profile.fullName || '',
              mobile: data.profile.mobile || '',
              dob: data.profile.dateOfBirth || '',
              pincode: data.profile.pincode || '',
              area: data.profile.area || '',
              location: data.profile.location || '',
              district: data.profile.district || '',
              state: data.profile.state || '',
              category: data.profile.category || '',
              expertise: data.profile.expertise || '',
              description: data.profile.description || '',
              classMode: data.profile.classMode || '',
              targetAudience: data.profile.targetAudience || '',
              minPrice: minP,
              maxPrice: maxP,
              availableDays: data.profile.availableDays ? data.profile.availableDays.split(', ') : [],
              timeBlocks: data.profile.timeSlots ? data.profile.timeSlots.split(', ') : [],
              profileImageUrl: data.profile.profileImageUrl || '',
              groupImageUrl: data.profile.groupImageUrl || '',
              instagram: data.profile.socialLinks ? data.profile.socialLinks.replace('https://instagram.com/', '') : '',
              introVideoUrl: data.profile.introVideoUrl || '',
              consent: true
            }));
          } else {
            // If they requested edit mode but have no profile, turn off edit mode
            setIsEditMode(false);
            setEmailVerified(true);
          }
        })
        .catch(console.error);
    }

    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(console.error);

    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        setModelsLoaded(true);
      } catch (e) {
        console.error("Failed to load face-api models", e);
      }
    };
    loadModels();
  }, []);

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    mobile: '',
    dob: '',
    gender: '',
    district: '',
    state: '',
    pincode: '',
    area: '',
    location: '',
    category: '',
    customCategory: '',
    expertise: '',
    description: '',
    classMode: '',
    minPrice: '',
    maxPrice: '',
    targetAudience: '',
    availableDays: [] as string[],
    timeBlocks: [] as string[],
    profileImageUrl: '',
    groupImageUrl: '',
    introVideoUrl: '',
    instagram: '',
    socialLinks: '',
    consent: true,
    isFresher: false
  });

  const handlePincodeChange = async (pincode: string) => {
    setFormData(prev => ({ ...prev, pincode }));
    if (pincode.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await res.json();
        if (data && data[0].Status === "Success") {
          const po = data[0].PostOffice[0];
          setFormData(prev => ({
            ...prev,
            area: po.Name,
            district: po.District,
            state: po.State
          }));
        } else {
          alert("Invalid Pincode! Please enter a valid 6-digit Indian pincode.");
          setFormData(prev => ({ ...prev, area: '', district: '', state: '' }));
        }
      } catch (e) {
        console.error("Pincode fetch failed", e);
        setFormData(prev => ({ ...prev, area: '', district: '', state: '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, area: '', district: '', state: '' }));
    }
  };


  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 2) {
      let day = parseInt(val.substring(0, 2));
      if (day > 31) val = '31' + val.substring(2);
      if (day === 0) val = '01' + val.substring(2);
    }
    if (val.length >= 4) {
      let month = parseInt(val.substring(2, 4));
      if (month > 12) val = val.substring(0, 2) + '12' + val.substring(4);
      if (month === 0) val = val.substring(0, 2) + '01' + val.substring(4);
    }
    if (val.length >= 3 && val.length <= 4) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    } else if (val.length > 4) {
      val = val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4, 8);
    }
    setFormData(prev => ({ ...prev, dob: val }));

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
            setDobError("You must be at least 18 years old to register as a coach.");
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

  const [isVerifying, setIsVerifying] = useState(false);
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [bioError, setBioError] = useState('');
  const [nameError, setNameError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileError, setMobileError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [dobError, setDobError] = useState('');

  const checkEmailExists = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      setEmailError('');
      return;
    }
    try {
      const res = await fetch(`/api/auth/check-email?email=${formData.email}`);
      const data = await res.json();
      if (data.exists) {
        setEmailError("This email is already registered. Please log in instead.");
      } else {
        setEmailError('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const checkMobileNumber = async () => {
    if (!formData.mobile || formData.mobile.length !== 10 || !/^[6-9]/.test(formData.mobile)) {
      setMobileError('');
      return;
    }
    try {
      const res = await fetch(`/api/auth/check-mobile?mobile=${formData.mobile}`);
      const data = await res.json();
      if (data.exists) {
        setMobileError("This phone number is already registered, try with another number.");
      } else {
        setMobileError('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const fetchBlockedWords = async () => {
    try {
      const res = await fetch('/api/config/blocked-words');
      if (res.ok) setBlockedWords(await res.json());
    } catch (e) { }
  };

  useEffect(() => {
    fetchBlockedWords();
  }, []);

  const validateNoBlockedWords = (text: string): string | null => {
    for (const word of blockedWords) {
      if (text.includes(word)) {
        return `The word "${word}" is not allowed.`;
      }
    }
    return null;
  };

  const handleSendOtp = async () => {
    if (emailError) return alert(emailError);
    if (!formData.email) return alert("Please enter an email first");
    setIsVerifying(true);
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, intendedRole: "COACH", isRegister: "true" })
      });
      if (res.ok) {
        setOtpSent(true);
        setCountdown(30);
        alert("OTP sent to your email!");
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Failed to send OTP");
      }
    } catch (err) {
      console.error(err);
    }
    setIsVerifying(false);
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) return alert("Please enter the OTP");
    setIsVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: otpCode })
      });
      if (res.ok) {
        const data = await res.json();
        setAuthToken(data.token || data.session_token);
        setOtpSent(false);
        setEmailVerified(true);
      } else {
        alert("Invalid OTP! Try again.");
      }
    } catch (err) {
      console.error(err);
    }
    setIsVerifying(false);
  };

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'profile' | 'group'>('profile');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploadingGroup, setIsUploadingGroup] = useState(false);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<HTMLCanvasElement> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
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
      pixelCrop.height
    );
    return canvas;
  };

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'group') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return alert("❌ Error: File is too large. Please upload an image smaller than 10MB.");
    if (!modelsLoaded) return alert("AI Models are still loading, please wait a second and try again.");

    const url = URL.createObjectURL(file);
    setCropImageSrc(url);
    setCropType(type);
    setCropModalOpen(true);
    setZoom(1);

    // Clear input so same file can be selected again
    e.target.value = '';
  };

  const handleCropConfirm = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    setCropModalOpen(false);

    const isGroup = cropType === 'group';
    const setIsUploadingTarget = isGroup ? setIsUploadingGroup : setIsUploading;
    setIsUploadingTarget(true);

    try {
      const croppedCanvas = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const detections = await faceapi.detectAllFaces(croppedCanvas as any, new faceapi.TinyFaceDetectorOptions());

      if (isGroup) {
        if (detections.length < 2) {
          alert(`❌ Error: Only ${detections.length} face(s) detected. A group photo must have at least 2 visible faces.`);
          setIsUploadingTarget(false);
          return;
        }
      } else {
        if (detections.length === 0) {
          alert("❌ Error: No face detected. Please upload a clear headshot.");
          setIsUploadingTarget(false);
          return;
        }
        if (detections.length > 1) {
          alert(`❌ Error: Multiple faces (${detections.length}) detected. Please upload a photo of JUST yourself.`);
          setIsUploadingTarget(false);
          return;
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

      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = width;
      finalCanvas.height = height;
      const ctx = finalCanvas.getContext('2d');
      ctx?.drawImage(croppedCanvas, 0, 0, width, height);

      finalCanvas.toBlob(async (blob) => {
        if (!blob) return setIsUploadingTarget(false);
        const form = new FormData();
        form.append("file", blob, `${cropType}.jpg`);
        try {
          const res = await fetch('/api/upload', { method: 'POST', body: form });
          if (res.ok) {
            const data = await res.json();
            setFormData(prev => ({ ...prev, [isGroup ? 'groupImageUrl' : 'profileImageUrl']: data.url }));
            alert("✅ Perfect! Image accepted and optimized.");
          } else {
            alert("Failed to upload image to server.");
          }
        } catch (uploadError) {
          alert("Error connecting to upload server.");
        }
        setIsUploadingTarget(false);
      }, 'image/jpeg', 0.7);

    } catch (e) {
      alert("Error processing cropped image.");
      setIsUploadingTarget(false);
    }
  };

  const toggleDay = (day: string) => {
    setFormData(prev => {
      const days = [...prev.availableDays];
      if (days.includes(day)) {
        return { ...prev, availableDays: days.filter(d => d !== day) };
      } else {
        return { ...prev, availableDays: [...days, day] };
      }
    });
  };

  const toggleTimeBlock = (block: string) => {
    setFormData(prev => {
      const blocks = [...prev.timeBlocks];
      if (blocks.includes(block)) {
        return { ...prev, timeBlocks: blocks.filter(b => b !== block) };
      } else {
        return { ...prev, timeBlocks: [...blocks, block] };
      }
    });
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (mobileError) return alert(mobileError);
      if (!emailVerified) return alert("Please verify your email first!");
      if (!formData.fullName) return alert("Please enter your name!");
      if (nameError) return alert(nameError);
      if (dobError) return alert(dobError);
      if (!formData.mobile || formData.mobile.length < 10 || !/^[6-9]/.test(formData.mobile)) return alert("Mobile number must be 10 digits and start with 6, 7, 8, or 9!");
      if (!formData.dob || formData.dob.length !== 10) return alert("Please enter a complete Date of Birth (DD/MM/YYYY)!");
      if (!formData.gender) return alert("Please select your Gender!");
      const dobParts = formData.dob.split('/');
      if (dobParts.length !== 3) return alert("Please enter a valid Date of Birth (DD/MM/YYYY)!");
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

      if (age < 18) return alert("You must be at least 18 years old to register as a coach.");
      if (age > 100) return alert("Date of Birth cannot be more than 100 years ago!");
      if (!formData.pincode || formData.pincode.length !== 6 || !formData.district) return alert("Please enter a valid 6-digit Pincode and wait for location to auto-fill!");
      setStep(2);
    } else if (step === 2) {
      if (!formData.category || (formData.category === 'Other' && !formData.customCategory) || !formData.expertise || !formData.description) return alert("Please fill in all expertise fields!");
      if (bioError) return alert(bioError);
      setStep(3);
    } else if (step === 3) {
      if (!formData.classMode || !formData.minPrice || !formData.maxPrice || !formData.targetAudience) return alert("Please fill in all class details!");
      if (parseInt(formData.maxPrice) <= parseInt(formData.minPrice)) return alert("Max price must be greater than Min price!");
      setStep(4);
    } else if (step === 4) {
      if (formData.availableDays.length === 0 || formData.timeBlocks.length === 0) return alert("Please select your available days and time slots!");
      setStep(5);
    }
  };

  const handleSubmitProfile = async () => {
    if (step === 5) {
      if (!formData.profileImageUrl) return alert("Please upload a profile headshot!");
      if (!formData.isFresher && !formData.groupImageUrl) return alert("Please upload a group action photo!");
      if (!formData.instagram) return alert("Please enter your Instagram handle!");
    }

    const payload = {
      ...formData,
      category: formData.category === 'Other' ? formData.customCategory : formData.category,
      pricing: `₹${formData.minPrice} - ₹${formData.maxPrice}`,
      availableDays: formData.availableDays.join(", "),
      timeSlots: formData.timeBlocks.join(", ")
    };

    const endpoint = isEditMode ? `/api/profile/coach/me?email=${formData.email}` : `/api/profile/coach`;
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken || localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert(isEditMode ? `Success! Your Coach profile has been updated and sent for Review!` : `Success! Your Coach profile has been submitted and is Pending Admin Approval!`);
        navigate({ to: isEditMode ? '/coach-dashboard' : '/' });
      } else {
        const err = await res.text();
        alert("Failed to save: " + err);
      }
    } catch (e) {
      console.error(e);
      alert("Error connecting to server");
    }
  };

  const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] font-sans text-slate-900 flex flex-col items-center py-12 px-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-400/20 blur-[150px] pointer-events-none" />

      <div className="mb-10 relative z-10 flex flex-col items-center">
        <a href="/" className="inline-block mb-2 hover:scale-105 transition-transform">
          <img src="/homelogo.png" alt="CoachKonnects" className="h-12 w-auto" />
        </a>
      </div>

      <div className="w-full max-w-3xl bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white p-8 sm:p-12 relative z-10">

        <div className="mb-10">
          <Link to="/register" className="text-teal-600 text-sm font-bold hover:text-teal-700 flex items-center gap-1 mb-6 transition-colors group w-fit">
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            I'm a student instead
          </Link>

          <div className="flex gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className={`h-2 flex-1 rounded-full ${step >= s ? 'bg-gradient-to-r from-orange-400 to-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'bg-slate-100'}`}></div>
            ))}
          </div>
          <div className="flex justify-between sm:justify-between gap-4 overflow-x-auto scrollbar-hide text-xs font-bold text-slate-400 mb-8 px-1 pb-2">
            <span className={`shrink-0 transition-colors ${step >= 1 ? "text-orange-600" : ""}`}>Basics</span>
            <span className={`shrink-0 transition-colors ${step >= 2 ? "text-orange-600" : ""}`}>Expertise</span>
            <span className={`shrink-0 transition-colors ${step >= 3 ? "text-orange-600" : ""}`}>Class Details</span>
            <span className={`shrink-0 transition-colors ${step >= 4 ? "text-orange-600" : ""}`}>Schedule</span>
            <span className={`shrink-0 transition-colors ${step >= 5 ? "text-orange-600" : ""}`}>Media</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {isEditMode ? 'Edit Your Profile' : (
              <>
                {step === 1 && 'Step 1: The Basics'}
                {step === 2 && 'Step 2: Your Expertise'}
                {step === 3 && 'Step 3: Class Details'}
                {step === 4 && 'Step 4: Your Schedule'}
                {step === 5 && 'Step 5: Media & Socials'}
              </>
            )}
          </h1>
        </div>

        <form className="space-y-6" onSubmit={e => e.preventDefault()}>

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Email Address <span className="text-orange-500">*</span></label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      onBlur={checkEmailExists}
                      placeholder="coach@example.com"
                      disabled={emailVerified}
                      className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all disabled:opacity-50 text-slate-900 shadow-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={emailVerified || isVerifying || otpSent}
                    className={`w-full sm:w-auto px-6 py-3.5 border rounded-2xl font-bold transition-all shadow-sm shrink-0 ${emailVerified ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-slate-200 text-slate-700 hover:border-orange-500 hover:text-orange-600'}`}
                  >
                    {emailVerified ? 'Verified ✓' : otpSent ? 'OTP Sent' : isVerifying ? 'Sending...' : 'Verify email'}
                  </button>
                </div>
                {emailError && <p className="text-red-500 text-xs mt-1 font-bold">{emailError}</p>}
              </div>

              {otpSent && !emailVerified && (
                <div className="space-y-3 p-5 bg-orange-50 border border-orange-100 rounded-2xl animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-bold text-orange-900">Enter the 6-digit code sent to your email</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="flex-1 w-full px-4 py-3 bg-white border border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 font-mono tracking-widest text-center text-xl font-bold shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={isVerifying || otpCode.length !== 6}
                      className="w-full sm:w-auto shrink-0 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold shadow-md disabled:opacity-50 transition-all"
                    >
                      Confirm
                    </button>
                  </div>
                  <div className="flex justify-end mt-2 space-x-4">
                    <button type="button" onClick={() => { setOtpSent(false); setOtpCode(''); }} className="text-sm text-orange-600 font-bold hover:underline">Edit Email</button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={countdown > 0 || isVerifying}
                      className="text-sm text-orange-600 font-bold hover:underline disabled:opacity-50 disabled:hover:no-underline"
                    >
                      {countdown > 0 ? `Resend (${countdown}s)` : 'Resend OTP'}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Full Name <span className="text-orange-500">*</span></label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={e => {
                      const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                      setFormData({ ...formData, fullName: val });
                      setNameError(validateNoBlockedWords(val) || '');
                    }}
                    placeholder="Coach Name"
                    className={`w-full px-5 py-3.5 bg-white border rounded-2xl focus:outline-none shadow-sm ${nameError ? 'border-red-500' : 'border-slate-200 focus:border-orange-500'}`}
                  />
                  {nameError && <p className="text-red-500 text-xs font-bold mt-1">{nameError}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Mobile Number <span className="text-orange-500">*</span></label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={formData.mobile}
                    onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                    onBlur={checkMobileNumber}
                    placeholder="9876543210"
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 shadow-sm font-mono"
                  />
                </div>
                {mobileError && <p className="text-red-500 text-xs mt-1 font-bold">{mobileError}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Date of Birth <span className="text-orange-500">*</span></label>
                  <input
                    type="text"
                    value={formData.dob}
                    onChange={handleDobChange}
                    maxLength={10}
                    placeholder="DD/MM/YYYY"
                    className={`w-full px-5 py-3.5 bg-white border rounded-2xl focus:outline-none shadow-sm ${dobError ? 'border-red-500' : 'border-slate-200 focus:border-orange-500'}`}
                  />
                  {dobError && <p className="text-red-500 text-xs font-bold mt-1">{dobError}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Gender <span className="text-orange-500">*</span></label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 shadow-sm"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Pincode <span className="text-orange-500">*</span></label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={e => handlePincodeChange(e.target.value.replace(/\D/g, ''))}
                    placeholder="400001"
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 shadow-sm font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Area / Location Name</label>
                  <input
                    type="text"
                    value={formData.area}
                    readOnly
                    placeholder="Auto-filled from Pincode"
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">District / City</label>
                  <input
                    type="text"
                    value={formData.district}
                    readOnly
                    placeholder="Auto-filled"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none text-slate-500 shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    readOnly
                    placeholder="Auto-filled"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none text-slate-500 shadow-sm"
                  />
                </div>
              </div>


            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Category <span className="text-orange-500">*</span></label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 shadow-sm"
                  >
                    <option value="">Select a Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                    <option value="Other">Other (Specify below)</option>
                  </select>
                  {formData.category === 'Other' && (
                    <input
                      type="text"
                      placeholder="Enter new category"
                      value={formData.customCategory}
                      onChange={e => setFormData({ ...formData, customCategory: e.target.value })}
                      className="w-full mt-3 px-5 py-3.5 bg-white border border-orange-300 rounded-2xl focus:outline-none focus:border-orange-500 shadow-sm"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Specific Expertise <span className="text-orange-500">*</span></label>
                  <input
                    type="text"
                    value={formData.expertise}
                    onChange={e => setFormData({ ...formData, expertise: e.target.value.replace(/[^a-zA-Z\s]/g, "") })}
                    placeholder="e.g. Chess, Voice training, Vinyasa Yoga"
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 shadow-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">About Me (Bio & Description) <span className="text-orange-500">*</span></label>
                <textarea
                  rows={5}
                  value={formData.description}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData({ ...formData, description: val });
                    setBioError(validateNoBlockedWords(val) || '');
                  }}
                  placeholder="Introduce yourself to students..."
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 shadow-sm resize-none"
                ></textarea>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Class Mode <span className="text-orange-500">*</span></label>
                  <select
                    value={formData.classMode}
                    onChange={e => setFormData({ ...formData, classMode: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 shadow-sm"
                  >
                    <option value="">Select Mode</option>
                    <option value="Online Only">Online Only</option>
                    <option value="Offline Only">Offline Only (In-person)</option>
                    <option value="Hybrid">Hybrid (Both)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Target Audience <span className="text-orange-500">*</span></label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {['Beginners', 'Advanced / Professionals', 'Kids & Teens', 'All Ages & Levels'].map(audience => (
                      <label key={audience} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${formData.targetAudience.includes(audience) ? 'bg-orange-50 border-orange-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${formData.targetAudience.includes(audience) ? 'bg-orange-500 border-orange-500' : 'bg-white border-slate-300'}`}>
                          {formData.targetAudience.includes(audience) && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className={`text-sm font-bold leading-tight ${formData.targetAudience.includes(audience) ? 'text-orange-700' : 'text-slate-700'}`}>{audience}</span>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={formData.targetAudience.includes(audience)}
                          onChange={(e) => {
                            let current = formData.targetAudience ? formData.targetAudience.split(', ') : [];
                            if (e.target.checked) {
                              current.push(audience);
                            } else {
                              current = current.filter(a => a !== audience);
                            }
                            setFormData({ ...formData, targetAudience: current.join(', ') });
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Price Range (per Hour/Session) <span className="text-orange-500">*</span></label>
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                    <input
                      type="text"
                      value={formData.minPrice}
                      onChange={e => setFormData({ ...formData, minPrice: e.target.value.replace(/\D/g, '') })}
                      placeholder="Min (e.g. 500)"
                      className="w-full pl-9 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 shadow-sm"
                    />
                  </div>
                  <div className="flex items-center text-slate-400 font-bold">—</div>
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                    <input
                      type="text"
                      value={formData.maxPrice}
                      onChange={e => setFormData({ ...formData, maxPrice: e.target.value.replace(/\D/g, '') })}
                      placeholder="Max (e.g. 1500)"
                      className="w-full pl-9 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 ml-1">Available Days <span className="text-orange-500">*</span></label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DAYS_OF_WEEK.map(day => {
                    const isSelected = formData.availableDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`py-3 px-2 rounded-xl text-sm font-bold border-2 transition-all ${isSelected ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 ml-1">Time Slots / Availability <span className="text-orange-500">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    "Morning (6 AM - 12 PM)",
                    "Afternoon (12 PM - 5 PM)",
                    "Evening (5 PM - 10 PM)"
                  ].map(block => {
                    const isSelected = formData.timeBlocks.includes(block);
                    return (
                      <button
                        key={block}
                        type="button"
                        onClick={() => toggleTimeBlock(block)}
                        className={`py-4 px-3 rounded-2xl text-sm font-bold border-2 transition-all flex items-center justify-center text-center ${isSelected ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}
                      >
                        {block}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Profile Headshot <span className="text-orange-500">*</span></label>
                  <p className="text-xs text-orange-600 font-medium ml-1 mb-2">This helps parents trust that you're a real, verified coach. Add real photos to avoid rejection of profile.</p>

                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors relative h-48 flex flex-col items-center justify-center">
                    {isUploading ? (
                      <div className="text-indigo-600 font-bold flex flex-col items-center justify-center">
                        <svg className="animate-spin h-8 w-8 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Analyzing Face...
                      </div>
                    ) : formData.profileImageUrl ? (
                      <div className="flex flex-col items-center justify-center gap-2 h-full">
                        <span className="text-green-600 font-bold text-sm">✅ Perfect! Image accepted</span>
                        <button type="button" onClick={() => setFormData({ ...formData, profileImageUrl: '' })} className="text-xs text-slate-500 hover:underline relative z-20">Remove</button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center px-4">
                        <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-slate-600 font-medium text-sm">Upload Headshot</span>
                        <span className="text-[10px] text-slate-400 mt-1 leading-tight">Must contain exactly 1 visible face (AI Validated)</span>
                      </div>
                    )}

                    {!isUploading && !formData.profileImageUrl && (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSelectFile(e, 'profile')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-sm font-bold text-slate-700">Group / Action Photo {!formData.isFresher && <span className="text-orange-500">*</span>}</label>
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isFresher}
                        onChange={e => setFormData({ ...formData, isFresher: e.target.checked })}
                        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                      />
                      I am a fresher (Skip this)
                    </label>
                  </div>

                  {!formData.isFresher && (
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors relative h-48 flex flex-col items-center justify-center">
                      {isUploadingGroup ? (
                        <div className="text-teal-600 font-bold flex flex-col items-center justify-center">
                          <svg className="animate-spin h-8 w-8 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Analyzing Faces...
                        </div>
                      ) : formData.groupImageUrl ? (
                        <div className="flex flex-col items-center justify-center gap-2 h-full">
                          <span className="text-green-600 font-bold text-sm">✅ Perfect! Image accepted</span>
                          <button type="button" onClick={() => setFormData({ ...formData, groupImageUrl: '' })} className="text-xs text-slate-500 hover:underline relative z-20">Remove</button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center px-4">
                          <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                          <span className="text-slate-600 font-medium text-sm">Upload Group Photo</span>
                          <span className="text-[10px] text-slate-400 mt-1 leading-tight">Must contain at least 2 faces (AI Validated)</span>
                        </div>
                      )}

                      {!isUploadingGroup && !formData.groupImageUrl && (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSelectFile(e, 'group')}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Instagram Handle <span className="text-orange-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">@</span>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={e => setFormData({ ...formData, instagram: e.target.value.replace(/[^a-zA-Z0-9_.]/g, '') })}
                    placeholder="yourhandle"
                    className="w-full pl-10 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Introduction Video URL (Optional)</label>
                <input
                  type="url"
                  value={formData.introVideoUrl}
                  onChange={e => setFormData({ ...formData, introVideoUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 shadow-sm"
                />
              </div>

              <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex gap-3 items-start">
                <input
                  type="checkbox"
                  checked={formData.consent}
                  onChange={e => setFormData({ ...formData, consent: e.target.checked })}
                  className="mt-1 w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                />
                <div className="text-sm text-orange-900 leading-tight">
                  <span className="font-bold">Consent (Optional):</span> I agree that CoachKonnects may use my profile photo and content from my Instagram account for company marketing and promotional material.
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pt-8 mt-4 border-t border-slate-100">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 rounded-2xl text-slate-500 font-bold hover:text-slate-900 shadow-sm">
                ← Back
              </button>
            ) : (
              <div className="hidden sm:block"></div>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-bold shadow-md transition-all active:scale-[0.98]"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitProfile}
                disabled={!formData.profileImageUrl || (!formData.isFresher && !formData.groupImageUrl)}
                className={`w-full sm:w-auto px-10 py-4 text-white rounded-2xl font-bold transition-all shadow-[0_8px_20px_rgba(20,184,166,0.3)] active:scale-[0.98] ${!formData.profileImageUrl || (!formData.isFresher && !formData.groupImageUrl) ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-teal-500 to-emerald-500'}`}
              >
                {isEditMode ? 'Save Changes' : 'Submit Coach Profile'}
              </button>
            )}
          </div>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-slate-500">
          Already have an account? <Link to="/login" className="text-teal-600 font-bold hover:underline ml-1">Sign in</Link>
        </div>
      </div>

      {/* Cropper Modal */}
      {cropModalOpen && cropImageSrc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[80vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Crop Image</h3>
                <p className="text-sm font-medium text-slate-500">Position the image inside the frame</p>
              </div>
              <button onClick={() => setCropModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="relative flex-1 bg-slate-100">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={cropType === 'profile' ? 1 : 16 / 9}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="p-6 border-t border-slate-100 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-500">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => {
                    setZoom(Number(e.target.value))
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
              <button
                onClick={handleCropConfirm}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-[0.98]"
              >
                Crop & Validate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
