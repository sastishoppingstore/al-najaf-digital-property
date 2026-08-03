import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Camera, Upload, X, ShieldCheck, CreditCard, AlertCircle, Search, Fingerprint, ScanLine, Smartphone, MapPin, Hash, Clock, Loader2, FileText, Mail } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { useNavigate } from 'react-router-dom';
import { getStampFees, getStampTypes as getManagedStampTypes } from '@/lib/contentManager';
import { sendOtpEmail, verifyOtp, getStoredOtp } from '@/lib/emailApi';
import { addOrder, getSession } from '@/lib/dataService';

type StampType = {
  id: string;
  name: string;
  description: string;
  minValue: number;
  maxValue: number;
  category: string;
  govRate: number;
  source: string;
};

type FingerprintStatus = 'idle' | 'scanning' | 'captured' | 'error';
type IdScanSide = 'front' | 'back' | 'withPerson';
type ScanStep = 'idle' | 'preview' | 'confirmed' | 'captured' | 'error';

function getDefaultStampTypes(): StampType[] {
  return getManagedStampTypes();
}

const GOV_STAMP_CATEGORIES = ['judicial', 'non-judicial', 'agreement', 'affidavit', 'bond', 'poa', 'deed', 'indemnity'];

export function EStampPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const [stampValue, setStampValue] = useState<number>(100);
  const [serviceMode, setServiceMode] = useState<'online' | 'offline'>('online');
  const [selectedStampType, setSelectedStampType] = useState<string>('judicial');
  const [stampSearchQuery, setStampSearchQuery] = useState('');
  const [stampTypes, setStampTypes] = useState<StampType[]>(() => getManagedStampTypes());
  const [govRate, setGovRate] = useState<number>(10);

  const [partyName, setPartyName] = useState('');
  const [partyEmail, setPartyEmail] = useState('');

  const [fingerprintStatus, setFingerprintStatus] = useState<FingerprintStatus>('idle');
  const [fingerprintCaptured, setFingerprintCaptured] = useState<string | null>(null);
  const fingerprintStream = useRef<MediaStream | null>(null);

  const [idScanStep, setIdScanStep] = useState<IdScanSide>('front');
  const [idCaptures, setIdCaptures] = useState<Record<IdScanSide, string | null>>({ front: null, back: null, withPerson: null });
  const idStreams = useRef<Record<IdScanSide, MediaStream | null>>({ front: null, back: null, withPerson: null });
  const [idScanStatus, setIdScanStatus] = useState<Record<IdScanSide, ScanStep>>({ front: 'idle', back: 'idle', withPerson: 'idle' });

  const [countdown, setCountdown] = useState(0);
  const [captured, setCaptured] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stampFees = getStampFees();
  const onlineFee = stampFees.online;
  const offlineFee = stampFees.offline;
  const serviceFee = serviceMode === 'online' ? onlineFee : offlineFee;
  const totalPayable = stampValue + serviceFee;

  const steps = [t('estamp.step1'), t('estamp.step2'), t('estamp.step3'), t('estamp.step4'), t('estamp.step5'), t('estamp.step6')];

  const searchStampTypes = useCallback((query: string) => {
    const q = query.toLowerCase();
    const filtered = stampTypes.filter(st =>
      st.name.toLowerCase().includes(q) ||
      st.category.toLowerCase().includes(q) ||
      st.description.toLowerCase().includes(q) ||
      st.source.toLowerCase().includes(q)
    );
    setStampTypes(filtered);
  }, []);

  useEffect(() => {
    if (stampSearchQuery) {
      const timer = setTimeout(() => searchStampTypes(stampSearchQuery), 300);
      return () => clearTimeout(timer);
    } else {
      setStampTypes(() => getManagedStampTypes());
    }
  }, [stampSearchQuery, searchStampTypes]);

  useEffect(() => {
    return () => {
      stopCamera();
      stopFingerprintCamera();
      stopIdCamera('front');
      stopIdCamera('back');
      stopIdCamera('withPerson');
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError('Camera access denied. Please allow camera permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startFingerprintCamera = async () => {
    setFingerprintStatus('scanning');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } });
      fingerprintStream.current = stream;
      setFingerprintStatus('scanning');
    } catch {
      setFingerprintStatus('error');
      setCameraError('Fingerprint camera access denied.');
    }
  };

  const stopFingerprintCamera = () => {
    if (fingerprintStream.current) {
      fingerprintStream.current.getTracks().forEach((track) => track.stop());
      fingerprintStream.current = null;
    }
  };

  const captureFingerprint = () => {
    if (!fingerprintStream.current) return;
    const video = document.createElement('video');
    video.srcObject = fingerprintStream.current;
    video.play().then(() => {
      setTimeout(() => {
        const c = document.createElement('canvas');
        c.width = 320;
        c.height = 240;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, c.width, c.height);
          const dataUrl = c.toDataURL('image/jpeg', 0.8);
          setFingerprintCaptured(dataUrl);
          setFingerprintStatus('captured');
        }
        stopFingerprintCamera();
      }, 500);
    });
  };

  const startIdCamera = async (side: IdScanSide) => {
    setCameraError('');
    setIdScanStatus(prev => ({ ...prev, [side]: 'idle' }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      const current = { ...idStreams.current };
      current[side] = stream;
      idStreams.current = current;
      setIdScanStatus(prev => ({ ...prev, [side]: 'idle' }));
    } catch {
      setCameraError(`Camera access denied for ${side === 'withPerson' ? 'ID with person' : side === 'front' ? 'ID front' : 'ID back'} scan.`);
      setIdScanStatus(prev => ({ ...prev, [side]: 'error' }));
    }
  };

  const stopIdCamera = (side: IdScanSide) => {
    const stream = idStreams.current[side];
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      const current = { ...idStreams.current };
      current[side] = null;
      idStreams.current = current;
    }
    setIdScanStatus(prev => ({ ...prev, [side]: 'idle' }));
  };

  const captureIdFrame = async (side: IdScanSide) => {
    const stream = idStreams.current[side];
    if (!stream) {
      await startIdCamera(side);
      await new Promise(r => setTimeout(r, 500));
    }
    const currentStream = idStreams.current[side];
    if (!currentStream) return;

    const videoEl = document.createElement('video');
    videoEl.srcObject = currentStream;
    await videoEl.play();

    await new Promise(r => setTimeout(r, 100));

    const c = document.createElement('canvas');
    c.width = videoEl.videoWidth || 640;
    c.height = videoEl.videoHeight || 480;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoEl, 0, 0, c.width, c.height);

    const dataUrl = c.toDataURL('image/jpeg', 0.9);
    setIdCaptures(prev => ({ ...prev, [side]: dataUrl }));
    setIdScanStatus(prev => ({ ...prev, [side]: 'captured' }));
    stopIdCamera(side);
  };

  const allIdScansComplete = idCaptures.front && idCaptures.back && idCaptures.withPerson;

  const startCountdown = () => {
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        if (countdown === 1) capturePhoto();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setCaptured(canvas.toDataURL('image/jpeg'));
    }
    stopCamera();
  };

  const handleStampSelect = (stampId: string) => {
    setSelectedStampType(stampId);
    const found = getManagedStampTypes().find(s => s.id === stampId);
    if (found) {
      setGovRate(found.govRate);
      setStampValue(Math.max(found.minValue, Math.min(found.maxValue, stampValue)));
    }
  };

  const handleStampSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStampSearchQuery(e.target.value);
  };

  if (submitted && otpVerified) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <div className="enter-3d">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-8 w-8" /></div>
          <h1 className="mt-4 font-serif text-2xl font-bold text-navy-800">{t('estamp.submitted')}</h1>
          <p className="mt-2 text-navy-500">{t('estamp.submittedSub')}</p>
          <p className="mt-1 text-sm text-navy-400">Reference: <strong>ES-{Date.now().toString(36).toUpperCase()}</strong></p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/dashboard" className="rounded-xl bg-navy-700 px-5 py-2.5 font-semibold text-white hover:bg-navy-800">{t('dash.title')}</Link>
            <Link to="/" className="rounded-xl border border-navy-200 px-5 py-2.5 font-semibold text-navy-700 hover:bg-navy-50">{t('service.goHome')}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-navy-800 sm:text-3xl">{t('estamp.title')}</h1>
        <p className="mt-1 text-sm text-navy-500">{t('estamp.subtitle')}</p>
      </div>

      {/* Stepper */}
      <div className="mb-8 flex items-center justify-between overflow-x-auto no-scrollbar">
        {steps.map((s, i) => (
          <div key={i} className="flex flex-1 items-center">
            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold transition ${i <= step ? 'bg-gold-400 text-navy-800' : 'bg-navy-100 text-navy-400'}`}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`ml-2 hidden text-xs font-medium lg:block ${i <= step ? 'text-navy-700' : 'text-navy-400'}`}>{s}</span>
            {i < steps.length - 1 && <div className={`mx-2 h-0.5 flex-1 ${i < step ? 'bg-gold-400' : 'bg-navy-100'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (step < steps.length - 1) { setStep(step + 1); } else { const s = getSession(); try { addOrder({ userId: s?.userId || 'guest', orderRef: `EST-${Date.now().toString().slice(-6)}`, orderType: 'E-Stamp Application', orderDate: new Date().toLocaleDateString(), orderAmount: `Rs. ${(totalPayable + govRate).toLocaleString()}`, status: 'Under Review', name: partyName || s?.name || 'Guest', email: partyEmail || s?.email || '', phone: '', notes: `Stamp value Rs. ${stampValue.toLocaleString()} · ${serviceMode} mode` }); } catch {} setSubmitted(true); } }} className="card-3d tilt-3d rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">

        {/* ===== STEP 0: Stamp Type + Amount + Mode ===== */}
        {step === 0 && (
          <div className="space-y-4 enter-3d">
            <h2 className="font-serif text-lg font-bold text-navy-800">{t('estamp.step1')}</h2>

            {/* Online Government Stamp Search */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Search className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold text-blue-800">{t('estamp.govSearch')}</span>
              </div>
              <p className="mb-3 text-xs text-blue-700">{t('estamp.govSearchSub')}</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
                <input
                  type="text"
                  value={stampSearchQuery}
                  onChange={handleStampSearch}
                  placeholder={t('estamp.searchPlaceholder')}
                  className="w-full rounded-xl border border-blue-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400"
                />
              </div>
              {stampSearchQuery && (
                <div className="mt-3 max-h-40 overflow-y-auto rounded-xl border border-blue-100 bg-white">
                  {stampTypes.length === 0 ? (
                    <p className="p-3 text-sm text-navy-400">{t('estamp.noResults')}</p>
                  ) : (
                    stampTypes.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleStampSelect(st.id)}
                        className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition ${selectedStampType === st.id ? 'bg-gold-50 text-navy-800' : 'hover:bg-navy-50'}`}
                      >
                        <div>
                          <p className="font-medium text-navy-700">{st.name}</p>
                          <p className="text-xs text-navy-400">{st.source} — Rs {st.govRate} fee</p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${selectedStampType === st.id ? 'bg-gold-400 text-navy-800' : 'bg-navy-50 text-navy-500'}`}>
                          Rs {st.minValue}-{st.maxValue}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Stamp Type Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-navy-700">{t('estamp.stampType')}</label>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {getManagedStampTypes().map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleStampSelect(st.id)}
                    className={`rounded-xl border p-3 text-left text-sm transition ${selectedStampType === st.id ? 'border-gold-400 bg-gold-50 ring-2 ring-gold-300' : 'border-navy-100 hover:border-gold-300'}`}
                  >
                    <p className="font-semibold text-navy-800">{st.name}</p>
                    <p className="mt-1 text-xs text-navy-500">{st.category}</p>
                    <p className="mt-0.5 text-xs text-gold-600">Rs {st.govRate} fee</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Stamp Value */}
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700">{t('estamp.stampValue')} (Rs. 100 - Rs. 1,200) <span className="text-rose-500">*</span></label>
              <div className="mb-3 flex flex-wrap gap-2">
                {[100, 200, 500, 1000, 1200].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setStampValue(val)}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold border transition ${
                      stampValue === val
                        ? 'bg-gold-400 border-gold-400 text-navy-800 font-bold'
                        : 'border-navy-150 text-navy-600 hover:bg-navy-50'
                    }`}
                  >
                    Rs. {val.toLocaleString()}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="100"
                max="1200"
                required
                value={stampValue}
                onChange={(e) => setStampValue(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400 font-medium"
              />
              <p className="mt-1 text-xs text-navy-400">{t('estamp.stampValueHelp')}</p>
            </div>

            {/* Processing Mode */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-700">{t('estamp.mode')}</label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${serviceMode === 'online' ? 'border-gold-400 bg-gold-50/20' : 'border-navy-100 bg-white hover:bg-navy-50/50'}`}>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="serviceMode" checked={serviceMode === 'online'} onChange={() => setServiceMode('online')} className="accent-gold-500" />
                    <div>
                      <p className="text-sm font-semibold text-navy-800">{t('estamp.online')}</p>
                      <p className="text-xs text-navy-500">{t('estamp.digital')}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-navy-700">{`+ Rs. ${serviceFee}`}</span>
                </label>

                <label className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${serviceMode === 'offline' ? 'border-gold-400 bg-gold-50/30' : 'border-navy-100 bg-white hover:bg-navy-50/50'}`}>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="serviceMode" checked={serviceMode === 'offline'} onChange={() => setServiceMode('offline')} className="accent-gold-500" />
                    <div>
                      <p className="text-sm font-semibold text-navy-800">{t('estamp.offline')}</p>
                      <p className="text-xs text-navy-500">{t('estamp.doorside')}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-navy-700">Rs. {offlineFee}</span>
                </label>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700">{t('estamp.purpose')}</label>
              <select className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
                <option value="property_sale">Property Sale</option>
                <option value="property_rent">Property Rent</option>
                <option value="affidavit">Affidavit</option>
                <option value="power_of_attorney">Power of Attorney</option>
                <option value="gift_deed">Gift Deed</option>
                <option value="relinquishment">Relinquishment</option>
                <option value="agreement">Agreement</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        )}

        {/* ===== STEP 1: Party Details + ID Scan ===== */}
        {step === 1 && (
          <div className="space-y-4 enter-3d">
            <h2 className="font-serif text-lg font-bold text-navy-800">{t('estamp.step2')}</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={t('estamp.partyName')} required value={partyName} onChange={(e) => setPartyName(e.target.value)} />
              <Input label={t('estamp.partyCnic')} required placeholder="XXXXX-XXXXXXX-X" />
              <Input label={t('auth.phone')} required type="tel" />
              <Input label={t('auth.email')} type="email" required value={partyEmail} onChange={(e) => setPartyEmail(e.target.value)} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700">{t('estamp.partyAddress')}</label>
              <textarea required rows={3} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
            </div>

            {/* Real-time ID Card Scan - Both Sides */}
            <div className="rounded-xl border border-navy-200 bg-navy-50/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <ScanLine className="h-5 w-5 text-gold-500" />
                <h3 className="font-serif font-bold text-navy-800">{t('estamp.idScan')}</h3>
                <span className="ml-auto text-xs text-navy-400">{t('estamp.idScanSub')}</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* ID Front */}
                <div className="rounded-xl border border-navy-200 bg-white p-4 text-center">
                  <div className="mx-auto mb-3 grid h-20 w-20 place-items-center rounded-full bg-blue-50 text-blue-500">
                    <ScanLine className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-semibold text-navy-700">{t('estamp.idFront')}</p>
                  {idScanStatus.front === 'captured' && idCaptures.front ? (
                    <div className="mt-2">
                      <img src={idCaptures.front} alt="ID Front" className="mx-auto h-24 rounded-lg border border-navy-100 object-cover" />
                      <span className="mt-1 inline-block text-xs font-medium text-emerald-600">{t('estamp.captured')}</span>
                    </div>
                  ) : null}
                  <button type="button" onClick={() => captureIdFrame('front')} className="mt-3 w-full rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600">
                    {idScanStatus.front === 'captured' ? t('estamp.retake') : t('estamp.scanNow')}
                  </button>
                </div>

                {/* ID Back */}
                <div className="rounded-xl border border-navy-200 bg-white p-4 text-center">
                  <div className="mx-auto mb-3 grid h-20 w-20 place-items-center rounded-full bg-green-50 text-green-500">
                    <ScanLine className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-semibold text-navy-700">{t('estamp.idBack')}</p>
                  {idScanStatus.back === 'captured' && idCaptures.back ? (
                    <div className="mt-2">
                      <img src={idCaptures.back} alt="ID Back" className="mx-auto h-24 rounded-lg border border-navy-100 object-cover" />
                      <span className="mt-1 inline-block text-xs font-medium text-emerald-600">{t('estamp.captured')}</span>
                    </div>
                  ) : null}
                  <button type="button" onClick={() => captureIdFrame('back')} className="mt-3 w-full rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600">
                    {idScanStatus.back === 'captured' ? t('estamp.retake') : t('estamp.scanNow')}
                  </button>
                </div>

                {/* ID with Person */}
                <div className="rounded-xl border border-navy-200 bg-white p-4 text-center">
                  <div className="mx-auto mb-3 grid h-20 w-20 place-items-center rounded-full bg-purple-50 text-purple-500">
                    <Smartphone className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-semibold text-navy-700">{t('estamp.idWithPerson')}</p>
                  {idScanStatus.withPerson === 'captured' && idCaptures.withPerson ? (
                    <div className="mt-2">
                      <img src={idCaptures.withPerson} alt="ID with Person" className="mx-auto h-24 rounded-lg border border-navy-100 object-cover" />
                      <span className="mt-1 inline-block text-xs font-medium text-emerald-600">{t('estamp.captured')}</span>
                    </div>
                  ) : null}
                  <button type="button" onClick={() => captureIdFrame('withPerson')} className="mt-3 w-full rounded-lg bg-purple-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-600">
                    {idScanStatus.withPerson === 'captured' ? t('estamp.retake') : t('estamp.scanNow')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP 2: Property Details ===== */}
        {step === 2 && (
          <div className="space-y-4 enter-3d">
            <h2 className="font-serif text-lg font-bold text-navy-800">{t('estamp.step3')}</h2>
            <Input label={t('estamp.propertyAddress')} required />
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700">{t('estamp.transactionDetails')}</label>
              <textarea required rows={4} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={t('estamp.propertyCity')} />
              <Input label={t('estamp.propertyArea')} />
            </div>

            {/* GPS/Location Picker */}
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700">{t('estamp.propertyLocation')} <span className="text-navy-400">(GPS)</span></label>
              <div className="rounded-xl border border-navy-100 bg-navy-50/40 p-4">
                <p className="text-xs text-navy-500">{t('estamp.gpsHelp')}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-navy-500">Latitude</label>
                    <input type="number" step="any" defaultValue="31.5204" className="w-full rounded-lg border border-navy-100 px-2 py-1.5 text-sm outline-none focus:border-gold-400" />
                  </div>
                  <div>
                    <label className="text-xs text-navy-500">Longitude</label>
                    <input type="number" step="any" defaultValue="74.3587" className="w-full rounded-lg border border-navy-100 px-2 py-1.5 text-sm outline-none focus:border-gold-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP 3: Documents ===== */}
        {step === 3 && (
          <div className="space-y-4 enter-3d">
            <h2 className="font-serif text-lg font-bold text-navy-800">{t('estamp.step4')}</h2>
            <p className="text-sm text-navy-500">{t('service.uploadDocsSub')}</p>
            <UploadZone label={t('estamp.uploadCnic')} icon={<ScanLine className="h-5 w-5 text-navy-400" />} />
            <UploadZone label={t('estamp.uploadProperty')} icon={<FileText className="h-5 w-5 text-navy-400" />} />
            <UploadZone label={t('estamp.uploadSignature')} icon={<Upload className="h-5 w-5 text-navy-400" />} />
          </div>
        )}

        {/* ===== STEP 4: Fingerprint + Selfie ===== */}
        {step === 4 && (
          <div className="space-y-5 enter-3d">
            <h2 className="font-serif text-lg font-bold text-navy-800">{t('estamp.step5')}</h2>

            {/* Fingerprint Scan */}
            <div className="rounded-xl border border-navy-200 bg-navy-50/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Fingerprint className="h-5 w-5 text-emerald-600" />
                <h3 className="font-serif font-bold text-navy-800">{t('estamp.fingerprint')}</h3>
              </div>
              {fingerprintStatus === 'captured' && fingerprintCaptured ? (
                <div className="text-center">
                  <img src={fingerprintCaptured} alt="Fingerprint" className="mx-auto h-32 rounded-lg border border-navy-100" />
                  <p className="mt-2 text-xs font-medium text-emerald-600">{t('estamp.fingerprintCaptured')}</p>
                </div>
              ) : fingerprintStatus === 'scanning' ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  <p className="mt-2 text-sm text-navy-500">{t('estamp.fingerprintScanning')}</p>
                  <button type="button" onClick={captureFingerprint} className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">{t('estamp.fingerprintCapture')}</button>
                </div>
              ) : fingerprintStatus === 'error' ? (
                <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                  <AlertCircle className="inline h-4 w-4 mr-1" /> {t('estamp.fingerprintError')}
                </div>
              ) : (
                <div className="text-center">
                  <Fingerprint className="mx-auto h-8 w-8 text-navy-400" />
                  <p className="mt-2 text-xs text-navy-500">{t('estamp.fingerprintHelp')}</p>
                  <button type="button" onClick={startFingerprintCamera} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
                    <Fingerprint className="h-4 w-4" /> {t('estamp.fingerprintStart')}
                  </button>
                </div>
              )}
            </div>

            {/* Selfie with ID Card */}
            <div>
              <p className="mb-2 text-sm font-medium text-navy-700">{t('estamp.selfieTitle')}</p>
              <div className="rounded-xl bg-gold-50 p-3">
                <p className="text-sm text-navy-700">{t('estamp.selfieInstructions')}</p>
              </div>

              {cameraError && (
                <div className="mt-2 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  <AlertCircle className="h-4 w-4" /> {cameraError}
                </div>
              )}

              <div className="relative mt-2 overflow-hidden rounded-xl border-2 border-navy-100 bg-navy-900">
                {captured ? (
                  <div className="relative">
                    <img src={captured} alt="Captured" className="h-72 w-full object-cover" />
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                      <button type="button" onClick={() => { setCaptured(null); startCamera(); }} className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-4 py-2 text-sm font-semibold text-navy-800 hover:bg-white">
                        <Camera className="h-4 w-4" /> {t('estamp.selfieRetake')}
                      </button>
                      <button type="button" onClick={() => setStep(5)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
                        <Check className="h-4 w-4" /> {t('estamp.selfieConfirm')}
                      </button>
                    </div>
                    <div className="absolute right-3 top-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                      {t('estamp.selfieCaptured')}
                    </div>
                  </div>
                ) : cameraActive ? (
                  <div className="relative">
                    <video ref={videoRef} className="h-72 w-full object-cover" playsInline muted />
                    <div className="pointer-events-none absolute inset-0 border border-white/10">
                      <div className="absolute left-[15%] top-[15%] h-[60%] w-[32%] rounded-full border-2 border-dashed border-white/60 bg-white/5 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white/80">Face Area</span>
                      </div>
                      <div className="absolute right-[15%] top-[30%] h-[35%] w-[32%] rounded-lg border-2 border-dashed border-gold-400 bg-gold-400/5 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-gold-400">Hold ID Card</span>
                      </div>
                    </div>
                    {countdown > 0 ? (
                      <div className="absolute inset-0 grid place-items-center bg-navy-900/50">
                        <span className="font-serif text-7xl font-bold text-white">{countdown}</span>
                      </div>
                    ) : (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
                        <button type="button" onClick={startCountdown} className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 font-semibold text-navy-800 shadow-lg transition hover:scale-105 hover:bg-gold-300">
                          <Camera className="h-5 w-5" /> {t('estamp.selfieCapture')}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid h-72 place-items-center">
                    <div className="text-center">
                      <Camera className="mx-auto h-12 w-12 text-navy-400" />
                      <p className="mt-3 text-sm text-navy-200">{t('estamp.selfieCountdown')}</p>
                      <button type="button" onClick={startCamera} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gold-400 px-5 py-2.5 font-semibold text-navy-800 transition hover:bg-gold-300">
                        <Camera className="h-4 w-4" /> {t('estamp.selfieStart')}
                      </button>
                    </div>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP 5: Review & Submit ===== */}
        {step === 5 && (
          <div className="space-y-4 enter-3d">
            <h2 className="font-serif text-lg font-bold text-navy-800">{t('estamp.step6')}</h2>
            {captured && (
              <div className="overflow-hidden rounded-xl border border-navy-100">
                <img src={captured} alt="Selfie" className="h-48 w-full object-cover" />
              </div>
            )}
            {fingerprintCaptured && (
              <div className="flex items-center gap-2 text-sm text-navy-600">
                <Fingerprint className="h-4 w-4 text-emerald-500" /> Fingerprint scanned
              </div>
            )}
            {allIdScansComplete && (
              <div className="flex items-center gap-2 text-sm text-navy-600">
                <ScanLine className="h-4 w-4 text-emerald-500" /> ID scanned (front + back + with person)
              </div>
            )}

            <div className="rounded-xl bg-navy-50 p-4 text-sm text-navy-700 space-y-1.5 shadow-inner">
              <div className="flex justify-between border-b border-navy-100 pb-1.5 font-bold">
                <span>Description</span>
                <span>Amount</span>
              </div>
              <div className="flex justify-between">
                <span>E-Stamp Paper Value</span>
                <span>Rs. {stampValue.toLocaleString()}</span>
              </div>
              {serviceMode === 'online' && (
                <div className="flex justify-between">
                  <span>Online Processing Fee</span>
                  <span>Rs. {serviceFee}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Gov Rate (FBR)</span>
                <span>Rs. {govRate}</span>
              </div>
              <div className="flex justify-between border-t border-navy-150 pt-1.5 font-bold text-gold-600 text-base">
                <span>{t('estamp.totalPayable')}</span>
                <span>Rs. {(totalPayable + govRate).toLocaleString()}</span>
              </div>
            </div>

            {/* OTP Verification */}
            <OTPVerification email={partyEmail} name={partyName} onVerified={() => setOtpVerified(true)} />

            <label className="flex items-start gap-2 text-sm text-navy-700 cursor-pointer">
              <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-gold-500" />
              {t('service.reviewConfirm')}
            </label>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1 rounded-xl border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50">
              <ChevronLeft className="h-4 w-4" /> {t('service.back')}
            </button>
          ) : <span />}
          <button type="submit" disabled={step === 5 && !otpVerified} className="inline-flex items-center gap-1 rounded-xl bg-gold-400 px-6 py-2.5 text-sm font-semibold text-navy-800 hover:bg-gold-300 disabled:opacity-60">
            {step < steps.length - 1 ? t('service.continue') : t('estamp.submit')} <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function OTPVerification({ email, name, onVerified }: { email: string; name?: string; onVerified: () => void }) {
  const { lang, t } = useLang();
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [fallbackOtp, setFallbackOtp] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const sendOtp = async () => {
    if (!email) {
      setError(lang === 'ur' ? 'براہ کرم مرحلہ ۲ میں اپنا ای میل درج کریں' : 'Please enter your email in Step 2 to receive the OTP.');
      return;
    }
    setError('');
    setFallbackOtp(null);
    const ok = await sendOtpEmail(email, name || 'User');
    if (!ok) {
      setFallbackOtp(getStoredOtp(email));
      setError(lang === 'ur' ? 'ای میل نہیں بھیجا جا سکا — نیچے کوڈ استعمال کریں' : 'Email could not be delivered — use the code shown below.');
    }
    setSent(true);
    setResendTimer(60);
  };

  const doVerify = () => {
    if (otp.length !== 6) return;
    setError('');
    if (verifyOtp(email, otp)) {
      setVerified(true);
      onVerified();
    } else {
      setError(lang === 'ur' ? 'غلط یا میعاد ختم شدہ او ٹی پی۔ دوبارہ کوشش کریں' : 'Invalid or expired OTP. Please try again.');
    }
  };

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(r => r - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  if (verified) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
        <Check className="h-4 w-4" /> {t('auth.otpVerified')}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-4">
      <h3 className="mb-2 font-semibold text-navy-800">{t('estamp.otpVerify')}</h3>
      {!sent ? (
        <button onClick={sendOtp} className="inline-flex items-center gap-2 rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-navy-800 hover:bg-gold-300">
          <Mail className="h-4 w-4" /> Send OTP via Email
        </button>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="flex-1 rounded-xl border border-navy-100 px-3 py-2 text-center text-lg tracking-widest outline-none focus:border-gold-400"
            />
            <button onClick={doVerify} className="rounded-xl bg-navy-700 px-4 py-2 text-sm font-semibold text-white">Verify</button>
          </div>
          {fallbackOtp && (
            <p className="mt-2 rounded-lg bg-gold-50 px-3 py-2 text-sm text-navy-700">
              {lang === 'ur' ? 'آپ کا او ٹی پی کوڈ:' : 'Your OTP code:'} <strong className="tracking-widest text-gold-600">{fallbackOtp}</strong>
            </p>
          )}
        </>
      )}
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
      {sent && !verified && (
        <p className="mt-2 text-xs text-navy-400">
          {resendTimer > 0 ? `Resend in ${resendTimer}s` : (
            <button onClick={sendOtp} className="text-gold-600 hover:underline">{t('auth.resendOtp')}</button>
          )}
        </p>
      )}
    </div>
  );
}

function Input({ label, type = 'text', required, placeholder, value, onChange }: { label: string; type?: string; required?: boolean; placeholder?: string; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-navy-700">{label}{required && <span className="text-rose-500"> *</span>}</label>
      <input type={type} required={required} placeholder={placeholder} value={value} onChange={onChange} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
    </div>
  );
}

function UploadZone({ label, icon }: { label: string; icon?: React.ReactNode }) {
  const { t } = useLang();
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-navy-700">{label}</label>
      <div className="cursor-pointer rounded-xl border-2 border-dashed border-navy-200 bg-navy-50/40 p-6 text-center transition hover:border-gold-400 hover:bg-gold-50">
        {icon || <Upload className="mx-auto h-6 w-6 text-navy-400" />}
        <p className="mt-2 text-sm font-medium text-navy-700">{t('service.dragDrop')}</p>
        <p className="text-xs text-navy-400">{t('service.orBrowse')}</p>
      </div>
    </div>
  );
}
