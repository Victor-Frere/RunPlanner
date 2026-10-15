import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Settings, 
  Eye, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Activity, 
  Map, 
  Timer, 
  Zap, 
  Coffee, 
  TrendingUp, 
  Edit3,
  Download,
  Upload,
  RotateCcw,
  Cloud,
  CloudOff,
  RefreshCw,
  Check,
  Copy,
  ExternalLink,
  X,
  Wifi,
  WifiOff,
  Lock,
  LockOpen,
  Key,
  ShieldCheck
} from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig, getSupabaseClient } from './src/supabase';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// --- RÉFÉRENTIEL ---
const TRAINING_TYPES = ["Off", "Footing facile", "Côtes", "Seuil", "Sortie longue", "VMA"];

// --- UTILITAIRES DE DATES ---
const parseDateFr = (dateStr) => {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return new Date(year, month - 1, day);
  }
  return new Date();
};

const formatDateFr = (date) => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

// --- ANALYSEUR DE TEMPS (SEUIL) ---
const parseSeuilTime = (details) => {
  if (!details) return 0;
  let totalTime = 0;
  const regex = /(?:(\d+)\s*[x\*]\s*)?(\d+)'/g;
  let match;
  while ((match = regex.exec(details)) !== null) {
    const multiplier = match[1] ? parseInt(match[1], 10) : 1;
    const duration = parseInt(match[2], 10);
    totalTime += multiplier * duration;
  }
  return totalTime;
};

// --- ANALYSEUR DE DISTANCE (CÔTES / VMA) ---
const parseSpecificDistance = (details) => {
  if (!details) return 0;
  let totalMeters = 0;
  // Cherche le motif: "nombre" suivi d'un "x" ou "*", suivi d'une "distance" (ex: 10x200)
  const regex = /(\d+)\s*[x\*]\s*(\d+)/g;
  let match;
  while ((match = regex.exec(details)) !== null) {
    const reps = parseInt(match[1], 10);
    const distance = parseInt(match[2], 10);
    totalMeters += reps * distance;
  }
  return totalMeters / 1000; // Convertit les mètres en kilomètres
};

// --- DONNÉES INITIALES ---
const initialData = [
  { id: 1, date: '12/10/2026', days: [ { id: 'd1', name: 'Lundi', type: 'Off', details: '', volume: 0 }, { id: 'd2', name: 'Mardi', type: 'Footing facile', details: "45'", volume: 5 }, { id: 'd3', name: 'Mercredi', type: 'Footing facile', details: "40'", volume: 4 }, { id: 'd4', name: 'Jeudi', type: 'Footing facile', details: "45'", volume: 5 }, { id: 'd5', name: 'Vendredi', type: 'Footing facile', details: "50'", volume: 6 }, { id: 'd6', name: 'Samedi', type: 'Off', details: '', volume: 0 }, { id: 'd7', name: 'Dimanche', type: 'Footing facile', details: "55'", volume: 6 } ] },
  { id: 2, date: '19/10/2026', days: [ { id: 'd1', name: 'Lundi', type: 'Footing facile', details: "45'", volume: 5 }, { id: 'd2', name: 'Mardi', type: 'Footing facile', details: "40'", volume: 4 }, { id: 'd3', name: 'Mercredi', type: 'Footing facile', details: "40'", volume: 4 }, { id: 'd4', name: 'Jeudi', type: 'Footing facile', details: "50'", volume: 6 }, { id: 'd5', name: 'Vendredi', type: 'Footing facile', details: "45'", volume: 5 }, { id: 'd6', name: 'Samedi', type: 'Off', details: '', volume: 0 }, { id: 'd7', name: 'Dimanche', type: 'Seuil', details: "4x2'", volume: 7 } ] },
  { id: 3, date: '26/10/2026', days: [ { id: 'd1', name: 'Lundi', type: 'Footing facile', details: "45'", volume: 5 }, { id: 'd2', name: 'Mardi', type: 'Côtes', details: "10x200", volume: 6 }, { id: 'd3', name: 'Mercredi', type: 'Footing facile', details: "40'", volume: 4 }, { id: 'd4', name: 'Jeudi', type: 'Seuil', details: "4x2'", volume: 7 }, { id: 'd5', name: 'Vendredi', type: 'Footing facile', details: "50'", volume: 6 }, { id: 'd6', name: 'Samedi', type: 'Off', details: '', volume: 0 }, { id: 'd7', name: 'Dimanche', type: 'Seuil', details: "4x3'", volume: 8 } ] },
  { id: 4, date: '02/11/2026', days: [ { id: 'd1', name: 'Lundi', type: 'Footing facile', details: "50'", volume: 6 }, { id: 'd2', name: 'Mardi', type: 'Côtes', details: "10x200", volume: 7 }, { id: 'd3', name: 'Mercredi', type: 'Footing facile', details: "45'", volume: 5 }, { id: 'd4', name: 'Jeudi', type: 'Seuil', details: "4x2'", volume: 8 }, { id: 'd5', name: 'Vendredi', type: 'Footing facile', details: "50'", volume: 6 }, { id: 'd6', name: 'Samedi', type: 'Off', details: '', volume: 0 }, { id: 'd7', name: 'Dimanche', type: 'Seuil', details: "4x4'", volume: 9 } ] },
  { id: 5, date: '09/11/2026', days: [ { id: 'd1', name: 'Lundi', type: 'Footing facile', details: "55'", volume: 7 }, { id: 'd2', name: 'Mardi', type: 'Côtes', details: "10x200", volume: 7 }, { id: 'd3', name: 'Mercredi', type: 'Footing facile', details: "50'", volume: 6 }, { id: 'd4', name: 'Jeudi', type: 'Seuil', details: "4x2'", volume: 9 }, { id: 'd5', name: 'Vendredi', type: 'Footing facile', details: "55'", volume: 7 }, { id: 'd6', name: 'Samedi', type: 'Off', details: '', volume: 0 }, { id: 'd7', name: 'Dimanche', type: 'Seuil', details: "5x4'", volume: 10 } ] },
  { id: 6, date: '16/11/2026', days: [ { id: 'd1', name: 'Lundi', type: 'Footing facile', details: "55'", volume: 7 }, { id: 'd2', name: 'Mardi', type: 'Côtes', details: "11x200", volume: 8 }, { id: 'd3', name: 'Mercredi', type: 'Footing facile', details: "60'", volume: 8 }, { id: 'd4', name: 'Jeudi', type: 'Seuil', details: "4x2'", volume: 9 }, { id: 'd5', name: 'Vendredi', type: 'Footing facile', details: "60'", volume: 8 }, { id: 'd6', name: 'Samedi', type: 'Off', details: '', volume: 0 }, { id: 'd7', name: 'Dimanche', type: 'Seuil', details: "5x5'", volume: 11 } ] },
  { id: 7, date: '23/11/2026', days: [ { id: 'd1', name: 'Lundi', type: 'Footing facile', details: "60'", volume: 8 }, { id: 'd2', name: 'Mardi', type: 'Côtes', details: "12x200", volume: 9 }, { id: 'd3', name: 'Mercredi', type: 'Footing facile', details: "60'", volume: 8 }, { id: 'd4', name: 'Jeudi', type: 'Seuil', details: "5x2'", volume: 10 }, { id: 'd5', name: 'Vendredi', type: 'Footing facile', details: "65'", volume: 9 }, { id: 'd6', name: 'Samedi', type: 'Off', details: '', volume: 0 }, { id: 'd7', name: 'Dimanche', type: 'Seuil', details: "5x6'", volume: 12 } ] },
  { id: 8, date: '30/11/2026', days: [ { id: 'd1', name: 'Lundi', type: 'Footing facile', details: "65'", volume: 9 }, { id: 'd2', name: 'Mardi', type: 'Côtes', details: "13x200", volume: 10 }, { id: 'd3', name: 'Mercredi', type: 'Footing facile', details: "65'", volume: 9 }, { id: 'd4', name: 'Jeudi', type: 'Seuil', details: "6x3'", volume: 10 }, { id: 'd5', name: 'Vendredi', type: 'Footing facile', details: "65'", volume: 10 }, { id: 'd6', name: 'Samedi', type: 'Off', details: '', volume: 0 }, { id: 'd7', name: 'Dimanche', type: 'Seuil', details: "6x6'", volume: 13 } ] },
  { id: 9, date: '07/12/2026', days: [ { id: 'd1', name: 'Lundi', type: 'Footing facile', details: "70'", volume: 10 }, { id: 'd2', name: 'Mardi', type: 'Côtes', details: "14x200", volume: 11 }, { id: 'd3', name: 'Mercredi', type: 'Footing facile', details: "70'", volume: 10 }, { id: 'd4', name: 'Jeudi', type: 'Seuil', details: "7x3'", volume: 11 }, { id: 'd5', name: 'Vendredi', type: 'Footing facile', details: "70'", volume: 10 }, { id: 'd6', name: 'Samedi', type: 'Off', details: '', volume: 0 }, { id: 'd7', name: 'Dimanche', type: 'Seuil', details: "5x7'", volume: 14 } ] },
  { id: 10, date: '14/12/2026', days: [ { id: 'd1', name: 'Lundi', type: 'Footing facile', details: "75'", volume: 11 }, { id: 'd2', name: 'Mardi', type: 'Côtes', details: "14x200", volume: 11 }, { id: 'd3', name: 'Mercredi', type: 'Footing facile', details: "75'", volume: 11 }, { id: 'd4', name: 'Jeudi', type: 'Seuil', details: "9x3'", volume: 12 }, { id: 'd5', name: 'Vendredi', type: 'Footing facile', details: "75'", volume: 11 }, { id: 'd6', name: 'Samedi', type: 'Off', details: '', volume: 0 }, { id: 'd7', name: 'Dimanche', type: 'Seuil', details: "4x8'", volume: 15 } ] },
  { id: 11, date: '21/12/2026', days: [ { id: 'd1', name: 'Lundi', type: 'Footing facile', details: "80'", volume: 12 }, { id: 'd2', name: 'Mardi', type: 'Côtes', details: "15x200", volume: 12 }, { id: 'd3', name: 'Mercredi', type: 'Footing facile', details: "80'", volume: 12 }, { id: 'd4', name: 'Jeudi', type: 'Seuil', details: "9x3'", volume: 12 }, { id: 'd5', name: 'Vendredi', type: 'Footing facile', details: "80'", volume: 12 }, { id: 'd6', name: 'Samedi', type: 'Off', details: '', volume: 0 }, { id: 'd7', name: 'Dimanche', type: 'Seuil', details: "3x9'", volume: 16 } ] },
  { id: 12, date: '28/12/2026', days: [ { id: 'd1', name: 'Lundi', type: 'Footing facile', details: "85'", volume: 13 }, { id: 'd2', name: 'Mardi', type: 'Côtes', details: "15x200", volume: 13 }, { id: 'd3', name: 'Mercredi', type: 'Footing facile', details: "80'", volume: 12 }, { id: 'd4', name: 'Jeudi', type: 'Seuil', details: "10x3'", volume: 13 }, { id: 'd5', name: 'Vendredi', type: 'Footing facile', details: "85'", volume: 13 }, { id: 'd6', name: 'Samedi', type: 'Off', details: '', volume: 0 }, { id: 'd7', name: 'Dimanche', type: 'Seuil', details: "3x10'", volume: 17 } ] }
];

export default function App() {
  const [mode, setMode] = useState('view'); 
  const [weeks, setWeeks] = useState(() => {
    try {
      const saved = localStorage.getItem('runplanner_weeks');
      return saved ? JSON.parse(saved) : initialData;
    } catch {
      return initialData;
    }
  });

  const [selectedWeekId, setSelectedWeekId] = useState(initialData[0].id);
  const [selectedDayId, setSelectedDayId] = useState(null);
  
  // Gestion de l'accordéon en mode édition
  const [expandedWeeks, setExpandedWeeks] = useState([initialData[0].id]);

  // --- TEMPS RÉEL (SUPABASE) ---
  const [syncStatus, setSyncStatus] = useState<'idle' | 'connecting' | 'connected' | 'saving' | 'error'>('idle');
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [cloudUrlInput, setCloudUrlInput] = useState(() => getSupabaseConfig().url);
  const [cloudKeyInput, setCloudKeyInput] = useState(() => getSupabaseConfig().key);
  const [copySuccess, setCopySuccess] = useState(false);
  const [remoteFlash, setRemoteFlash] = useState(false);

  // --- MOT DE PASSE ---
  const [isEditUnlocked, setIsEditUnlocked] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangedSuccess, setPasswordChangedSuccess] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const hashPassword = async (password: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const DEFAULT_HASH = 'd9e2c313277ebdf9689c6a16f37f0d13180fa356f806c53edd0793d204bb1c61';
  const LEGACY_DEFAULT_HASHES = [
    'a18ceb2154111dd7e9bdfe59a36ae187ef6880bdbe676fb47ca1bb796f3dcbc1',
    '5d6d01b2ad6dae9012e06b1b74c4692bc4992f8f1f27bad7a7cb3a81639a5597',
  ];

  const getStoredHash = (): string => {
    const storedHash = localStorage.getItem('runplanner_password_hash');
    if (storedHash && LEGACY_DEFAULT_HASHES.includes(storedHash)) {
      localStorage.setItem('runplanner_password_hash', DEFAULT_HASH);
      return DEFAULT_HASH;
    }
    return storedHash || DEFAULT_HASH;
  };

  const handleTryEditMode = () => {
    if (isEditUnlocked) {
      setMode('edit');
    } else {
      setShowPasswordModal(true);
      setTimeout(() => passwordInputRef.current?.focus(), 100);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hash = await hashPassword(passwordInput);
    if (hash === getStoredHash()) {
      setIsEditUnlocked(true);
      setMode('edit');
      setShowPasswordModal(false);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('Mot de passe incorrect. Réessayez.');
      setPasswordInput('');
    }
  };

  const handleLockEdit = () => {
    setIsEditUnlocked(false);
    setMode('view');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasswordInput.length < 4) {
      setPasswordChangeError('Le mot de passe doit contenir au moins 4 caractères.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeError('Les mots de passe ne correspondent pas.');
      return;
    }
    const hash = await hashPassword(newPasswordInput);
    localStorage.setItem('runplanner_password_hash', hash);
    setPasswordChangeError('');
    setPasswordChangedSuccess(true);
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setTimeout(() => {
      setPasswordChangedSuccess(false);
      setShowChangePasswordModal(false);
    }, 2000);
  };

  const isRemoteUpdateRef = useRef(false);
  const saveTimeoutRef = useRef<any>(null);

  // 1. Initialisation de la connexion Supabase et écoute en temps réel
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setSyncStatus('idle');
      return;
    }

    setSyncStatus('connecting');

    const initSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('training_plans')
          .select('weeks, updated_at')
          .eq('id', 'default')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.warn('Supabase fetch notice:', error);
          setSyncStatus('error');
          return;
        }

        if (data && data.weeks && Array.isArray(data.weeks)) {
          isRemoteUpdateRef.current = true;
          setWeeks(data.weeks);
          if (data.weeks.length > 0) {
            setSelectedWeekId(data.weeks[0].id);
          }
          setLastSyncedTime(new Date(data.updated_at || Date.now()).toLocaleTimeString());
        } else {
          await supabase.from('training_plans').upsert({
            id: 'default',
            weeks: weeks,
            updated_at: new Date().toISOString()
          });
        }
        setSyncStatus('connected');
      } catch (err) {
        console.error('Erreur initialisation Supabase:', err);
        setSyncStatus('error');
      }
    };

    initSupabase();

    const channel = supabase
      .channel('realtime_training_plans')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'training_plans' },
        (payload: any) => {
          if (payload.new && payload.new.weeks && Array.isArray(payload.new.weeks)) {
            isRemoteUpdateRef.current = true;
            setWeeks(payload.new.weeks);
            setLastSyncedTime(new Date().toLocaleTimeString());
            setRemoteFlash(true);
            setTimeout(() => setRemoteFlash(false), 3000);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setSyncStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          setSyncStatus('error');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 2. Synchronisation automatique vers Supabase et localStorage
  useEffect(() => {
    try {
      localStorage.setItem('runplanner_weeks', JSON.stringify(weeks));
    } catch (e) {
      console.error(e);
    }

    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    setSyncStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase.from('training_plans').upsert({
          id: 'default',
          weeks: weeks,
          updated_at: new Date().toISOString()
        });

        if (error) {
          console.error('Erreur de synchronisation Supabase:', error);
          setSyncStatus('error');
        } else {
          setSyncStatus('connected');
          setLastSyncedTime(new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.error('Erreur réseau sync:', err);
        setSyncStatus('error');
      }
    }, 400);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [weeks]);

  // --- STATS D'UNE SEMAINE ---
  const getWeekStats = (week) => {
    let totalVolume = 0;
    let maxVolume = 0;
    week.days.forEach(day => {
      const vol = parseFloat(String(day.volume)) || 0;
      totalVolume += vol;
      if (vol > maxVolume) maxVolume = vol;
    });
    return { totalVolume, maxVolume };
  };

  // --- CALCUL DES DONNÉES POUR LES GRAPHIQUES ---
  const chartData = useMemo(() => {
    return weeks.map(week => {
      let volumeTotal = 0;
      let sortieLongue = 0;
      let distanceCotes = 0;
      let distanceVma = 0;
      let tempsSeuil = 0;

      week.days.forEach(day => {
        const vol = parseFloat(String(day.volume)) || 0;
        volumeTotal += vol;
        if (vol > sortieLongue) sortieLongue = vol;

        if (day.type === 'Côtes') distanceCotes += parseSpecificDistance(day.details);
        if (day.type === 'VMA') distanceVma += parseSpecificDistance(day.details);
        if (day.type === 'Seuil') tempsSeuil += parseSeuilTime(day.details);
      });

      return {
        name: week.date.substring(0, 5), // Ex: '12/10'
        fullDate: week.date,
        volumeTotal: Math.round(volumeTotal * 10) / 10,
        sortieLongue: Math.round(sortieLongue * 10) / 10,
        distanceCotes: Math.round(distanceCotes * 10) / 10,
        distanceVma: Math.round(distanceVma * 10) / 10,
        tempsSeuil
      };
    });
  }, [weeks]);

  // --- ACTIONS ---
  const handleDayChange = (weekId, dayId, field, value) => {
    setWeeks(weeks.map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: week.days.map(day => 
            day.id === dayId ? { ...day, [field]: value } : day
          )
        };
      }
      return week;
    }));
  };

  const handleWeekDateChange = (weekId, value) => {
    setWeeks(weeks.map(w => w.id === weekId ? { ...w, date: value } : w));
  };

  const toggleWeekExpansion = (weekId) => {
    setExpandedWeeks(prev => 
      prev.includes(weekId) ? prev.filter(id => id !== weekId) : [...prev, weekId]
    );
  };

  const addWeek = () => {
    const lastWeek = weeks[weeks.length - 1];
    let nextDateStr = formatDateFr(new Date());

    if (lastWeek && lastWeek.date) {
      const lastDate = parseDateFr(lastWeek.date);
      if (!isNaN(lastDate.getTime())) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + 7);
        nextDateStr = formatDateFr(nextDate);
      }
    }

    const newId = Date.now();
    const newWeek = {
      id: newId,
      date: nextDateStr,
      days: initialData[0].days.map(d => ({ ...d, type: 'Off', details: '', volume: 0 }))
    };
    setWeeks([...weeks, newWeek]);
    setExpandedWeeks([...expandedWeeks, newId]);
    if (mode === 'view') {
      setSelectedWeekId(newId);
    }
  };

  const exportPlan = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(weeks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `plan_entrainement_${formatDateFr(new Date()).replace(/\//g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importPlan = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWeeks(parsed);
          setSelectedWeekId(parsed[0].id);
          alert('Plan d\'entraînement importé avec succès !');
        } else {
          alert('Format de fichier invalide.');
        }
      } catch (err) {
        alert('Erreur lors de la lecture du fichier JSON.');
      }
    };
    reader.readAsText(file);
    // Reset file input value
    event.target.value = '';
  };

  const resetPlan = () => {
    if (window.confirm('Voulez-vous réinitialiser le plan avec les données d\'origine ? Vos modifications actuelles seront écrasées.')) {
      setWeeks(initialData);
      setSelectedWeekId(initialData[0].id);
      localStorage.removeItem('runplanner_weeks');
    }
  };

  const handleSaveCloudConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(cloudUrlInput, cloudKeyInput);
    setShowCloudModal(false);
    window.location.reload();
  };

  const handleClearCloudConfig = () => {
    if (window.confirm('Voulez-vous déconnecter Supabase ? Les modifications ne seront plus partagées en direct.')) {
      saveSupabaseConfig('', '');
      setCloudUrlInput('');
      setCloudKeyInput('');
      setShowCloudModal(false);
      window.location.reload();
    }
  };

  const sqlSetupCode = `-- 1. Table des plans
create table if not exists public.training_plans (
  id text primary key default 'default',
  weeks jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Accès public
alter table public.training_plans enable row level security;
drop policy if exists "Accès public complet aux plans" on public.training_plans;
create policy "Accès public complet aux plans" on public.training_plans for all using (true) with check (true);

-- 3. Activation du temps réel
alter publication supabase_realtime add table public.training_plans;`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSetupCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // --- RENDU UI ---
  const getIconForType = (type) => {
    switch(type) {
      case 'Off': return <Coffee size={20} className="text-slate-400" />;
      case 'Footing facile': return <Activity size={20} className="text-green-500" />;
      case 'Côtes': return <Map size={20} className="text-orange-500" />;
      case 'Seuil': return <Timer size={20} className="text-red-500" />;
      case 'VMA': return <Zap size={20} className="text-purple-500" />;
      case 'Sortie longue': return <Activity size={20} className="text-blue-500" />;
      default: return <Activity size={20} />;
    }
  };

  const selectedWeek = weeks.find(w => w.id === selectedWeekId) || weeks[0];
  const currentWeekStats = getWeekStats(selectedWeek);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-xl text-sm">
          <p className="font-bold text-slate-800 mb-2">{payload[0].payload.fullDate}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="font-medium">
              {entry.name}: {entry.value} {entry.name.includes('Temps') ? 'min' : 'km'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header & Navigation */}
        <header className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="text-blue-600 w-8 h-8" />
            <h1 className="text-2xl font-bold text-slate-900">RunPlanner Pro</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Statut Temps Réel Cloud */}
            {mode === 'edit' && syncStatus === 'connected' && (
              <button 
                onClick={() => setShowCloudModal(true)}
                title="Synchronisation Temps Réel active. Cliquez pour voir les paramètres"
                className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl transition-all shadow-sm"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>En direct</span>
                {lastSyncedTime && <span className="text-[10px] text-emerald-600 font-normal">({lastSyncedTime})</span>}
              </button>
            )}

            {syncStatus === 'saving' && (
              <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl font-medium">
                <RefreshCw size={13} className="animate-spin text-blue-600" />
                <span>Envoi en direct...</span>
              </div>
            )}

            {syncStatus === 'connecting' && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl font-medium">
                <RefreshCw size={13} className="animate-spin text-amber-600" />
                <span>Connexion Cloud...</span>
              </div>
            )}

            {mode === 'edit' && syncStatus === 'error' && (
              <button 
                onClick={() => setShowCloudModal(true)}
                title="Erreur de connexion. Cliquez pour configurer Supabase"
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 px-3 py-1.5 rounded-xl transition-all"
              >
                <WifiOff size={13} className="text-rose-500" />
                <span>Erreur Cloud</span>
              </button>
            )}

            {mode === 'edit' && syncStatus === 'idle' && (
              <button 
                onClick={() => setShowCloudModal(true)}
                title="Cliquez pour activer le partage en direct pour tout le monde"
                className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-300 px-3.5 py-1.5 rounded-xl transition-all shadow-sm"
              >
                <Cloud size={14} className="text-amber-600" />
                <span>Activer le Temps Réel</span>
              </button>
            )}

            {mode === 'edit' && (
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button 
                onClick={() => setShowCloudModal(true)}
                title="Paramètres de synchronisation Cloud (Supabase)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
              >
                <Cloud size={15} />
              </button>

              <button 
                onClick={exportPlan}
                title="Exporter vos données au format JSON"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
              >
                <Download size={15} /> Exporter
              </button>

              <label 
                title="Importer un fichier JSON sauvegardé"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-white rounded-lg cursor-pointer transition-colors"
              >
                <Upload size={15} /> Importer
                <input type="file" accept=".json" onChange={importPlan} className="hidden" />
              </label>

              <button 
                onClick={resetPlan}
                title="Réinitialiser avec les données par défaut"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
              >
                <RotateCcw size={14} />
              </button>
            </div>
            )}

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setMode('view')}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-colors ${mode === 'view' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Eye size={18} /> Visualisation
              </button>
              <button 
                onClick={handleTryEditMode}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-colors ${mode === 'edit' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {isEditUnlocked
                  ? <><Settings size={18} /> Édition</>
                  : <><Lock size={18} /> Édition</>
                }
              </button>
            </div>

            {/* Boutons Verrouiller + Changer le mot de passe si déverrouillé */}
            {isEditUnlocked && (
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 p-1 rounded-xl">
                <button
                  onClick={() => setShowChangePasswordModal(true)}
                  title="Changer le mot de passe d'édition"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  <Key size={14} /> Mot de passe
                </button>
                <button
                  onClick={handleLockEdit}
                  title="Verrouiller le mode édition"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LockOpen size={14} /> Verrouiller
                </button>
              </div>
            )}
          </div>
        </header>

        {/* MODE VISUALISATION */}
        {mode === 'view' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="relative">
                <select 
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-800 font-semibold py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedWeekId}
                  onChange={(e) => {
                    setSelectedWeekId(Number(e.target.value));
                    setSelectedDayId(null);
                  }}
                >
                  {weeks.map(w => (
                    <option key={w.id} value={w.id}>Semaine du {w.date}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={20} />
              </div>

              <div className="flex gap-4 w-full md:w-auto">
                <div className="flex-1 md:flex-none text-center px-6 py-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-600 font-medium">Volume Total</p>
                  <p className="text-2xl font-bold text-blue-900">{currentWeekStats.totalVolume} km</p>
                </div>
                <div className="flex-1 md:flex-none text-center px-6 py-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-sm text-emerald-600 font-medium">Sortie Longue</p>
                  <p className="text-2xl font-bold text-emerald-900">{currentWeekStats.maxVolume} km</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {selectedWeek.days.map((day) => (
                <div 
                  key={day.id}
                  onClick={() => setSelectedDayId(selectedDayId === day.id ? null : day.id)}
                  className={`cursor-pointer transition-all duration-200 rounded-xl border p-4 flex flex-col h-full
                    ${day.type === 'Off' ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'} 
                    ${selectedDayId === day.id ? 'ring-2 ring-blue-500 border-blue-500 scale-[1.02]' : ''}`}
                >
                  <h3 className="font-semibold text-slate-800 mb-3">{day.name}</h3>
                  <div className="flex items-center gap-2 mb-auto">
                    {getIconForType(day.type)}
                    <span className="text-sm font-medium text-slate-600 leading-tight">{day.type}</span>
                  </div>
                  {day.type !== 'Off' && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-end">
                      <span className="text-xs text-slate-400 truncate max-w-[60%]">{day.details}</span>
                      <span className="font-bold text-slate-800">{day.volume} km</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {selectedDayId && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-in slide-in-from-top-4">
                {selectedWeek.days.filter(d => d.id === selectedDayId).map(day => (
                  <div key={day.id}>
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <Calendar className="text-blue-500" size={24} />
                      Détails du {day.name} {selectedWeek.date}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-center">
                        <p className="text-sm text-slate-500 mb-2 uppercase tracking-wider font-semibold">Type de séance</p>
                        <p className="font-bold text-xl text-slate-800 flex items-center gap-3">
                          {getIconForType(day.type)} {day.type}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-center">
                        <p className="text-sm text-slate-500 mb-2 uppercase tracking-wider font-semibold">Contenu</p>
                        <p className="font-bold text-xl text-slate-800">{day.details || 'Aucun détail'}</p>
                      </div>
                      <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex flex-col justify-center">
                        <p className="text-sm text-blue-600 mb-2 uppercase tracking-wider font-semibold">Volume estimé</p>
                        <p className="font-bold text-3xl text-blue-700">{day.volume} km</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODE ÉDITION */}
        {mode === 'edit' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* GRAPHIQUES DASHBOARD */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <TrendingUp className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-slate-900">Tableau de bord de progression</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-72">
                  <h3 className="text-sm font-semibold text-slate-500 mb-4 text-center">Évolution du Volume (km)</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip /> as any} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="volumeTotal" name="Volume Total" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="sortieLongue" name="Sortie la plus longue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-72">
                  <h3 className="text-sm font-semibold text-slate-500 mb-4 text-center">Temps de soutien au Seuil (minutes)</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorSeuil" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip /> as any} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      <Area type="monotone" dataKey="tempsSeuil" name="Temps au Seuil" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorSeuil)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                {/* NOUVEAU GRAPHIQUE : Côtes & VMA */}
                <div className="h-72 lg:col-span-2 mt-4">
                  <h3 className="text-sm font-semibold text-slate-500 mb-4 text-center">Distances spécifiques : Côtes & VMA (km)</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip /> as any} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="distanceCotes" name="Distance Côtes" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={50} />
                      <Bar dataKey="distanceVma" name="Distance VMA" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

              </div>
            </div>

            {/* LISTE DES SEMAINES (ACCORDÉON) */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2 px-2">
                <Edit3 className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-slate-900">Éditeur de séances</h2>
              </div>
              
              {weeks.map((week) => {
                const stats = getWeekStats(week);
                const isExpanded = expandedWeeks.includes(week.id);

                return (
                  <div key={week.id} className={`bg-white rounded-2xl shadow-sm border border-slate-200 transition-all duration-200 ${isExpanded ? 'ring-1 ring-slate-200 shadow-md' : 'hover:border-slate-300'}`}>
                    
                    {/* Header de la semaine (Clic pour ouvrir/fermer) */}
                    <div 
                      className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 cursor-pointer hover:bg-slate-50 rounded-2xl transition-colors gap-4"
                      onClick={() => toggleWeekExpansion(week.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                        <div onClick={e => e.stopPropagation()}>
                          <input 
                            type="text" 
                            value={week.date} 
                            onChange={(e) => handleWeekDateChange(week.id, e.target.value)}
                            className="text-lg font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none px-1 py-1 w-28 transition-colors"
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 text-sm font-medium ml-12 md:ml-0">
                        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100">
                          <Activity size={16} /> <span>Vol: {stats.totalVolume} km</span>
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100">
                          <TrendingUp size={16} /> <span>Max: {stats.maxVolume} km</span>
                        </div>
                      </div>
                    </div>

                    {/* Contenu de la semaine (Tableau) */}
                    {isExpanded && (
                      <div className="p-4 pt-0 border-t border-slate-100 mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="overflow-x-auto rounded-xl border border-slate-200 mt-4">
                          <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-slate-50">
                              <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                <th className="py-3 px-4 font-semibold w-32">Jour</th>
                                <th className="py-3 px-4 font-semibold w-48">Type de séance</th>
                                <th className="py-3 px-4 font-semibold">Détails (ex: 4x5')</th>
                                <th className="py-3 px-4 font-semibold w-32 text-center">Volume (km)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {week.days.map((day) => (
                                <tr key={day.id} className={`group ${day.type === 'Off' ? 'bg-slate-50/50' : 'bg-white'}`}>
                                  <td className="py-2 px-4 font-semibold text-slate-700">{day.name}</td>
                                  <td className="py-2 px-4">
                                    <select 
                                      value={day.type}
                                      onChange={(e) => handleDayChange(week.id, day.id, 'type', e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                    >
                                      {TRAINING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                  </td>
                                  <td className="py-2 px-4">
                                    <input 
                                      type="text" 
                                      value={day.details}
                                      onChange={(e) => handleDayChange(week.id, day.id, 'details', e.target.value)}
                                      placeholder="Repos"
                                      disabled={day.type === 'Off'}
                                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 disabled:bg-slate-100 transition-shadow"
                                    />
                                  </td>
                                  <td className="py-2 px-4">
                                    <input 
                                      type="number" 
                                      min="0" step="0.1"
                                      value={day.volume}
                                      onChange={(e) => handleDayChange(week.id, day.id, 'volume', e.target.value)}
                                      disabled={day.type === 'Off'}
                                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 disabled:bg-slate-100 transition-shadow"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button 
              onClick={addWeek}
              className="w-full py-5 border-2 border-dashed border-slate-300 bg-slate-50/50 rounded-2xl text-slate-500 font-bold hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-3"
            >
              <Plus size={24} /> Ajouter la semaine suivante
            </button>
          </div>
        )}

      </div>

      {/* Toast de notification de mise à jour en direct */}
      {remoteFlash && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 z-50">
          <div className="p-2 bg-emerald-500 rounded-xl text-white">
            <Check size={18} />
          </div>
          <div>
            <p className="text-sm font-bold">Plan mis à jour en direct !</p>
            <p className="text-xs text-slate-300">Modifications synchronisées depuis le Cloud.</p>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURATION CLOUD / TEMPS RÉEL */}
      {showCloudModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <Cloud size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Synchronisation Temps Réel (Supabase)</h3>
                  <p className="text-xs text-slate-500">Partagez votre plan en direct avec vos athlètes et entraîneurs</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCloudModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* État actuel */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${syncStatus === 'connected' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
              <div className="flex items-center gap-3">
                {syncStatus === 'connected' ? <Wifi size={22} className="text-emerald-600" /> : <WifiOff size={22} className="text-amber-600" />}
                <div>
                  <p className="font-bold text-sm">
                    {syncStatus === 'connected' ? 'Connecté au Cloud en direct' : 'Non connecté au Cloud'}
                  </p>
                  <p className="text-xs opacity-80">
                    {syncStatus === 'connected' ? 'Toutes les modifications sont synchronisées instantanément pour tout le monde.' : 'Le plan est actuellement stocké uniquement dans le navigateur local.'}
                  </p>
                </div>
              </div>
              {syncStatus === 'connected' && (
                <button 
                  onClick={handleClearCloudConfig}
                  className="text-xs text-red-600 font-semibold hover:underline bg-white/70 px-3 py-1.5 rounded-lg border border-red-200"
                >
                  Déconnecter
                </button>
              )}
            </div>

            {/* Instructions simples en 3 étapes */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Comment activer la synchronisation gratuite (1 minute) :</h4>
              
              <ol className="space-y-3 text-sm text-slate-600 list-decimal list-inside">
                <li className="leading-relaxed">
                  Créez un projet gratuit sur{' '}
                  <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold underline inline-flex items-center gap-1">
                    supabase.com <ExternalLink size={12} />
                  </a>
                </li>
                <li className="leading-relaxed">
                  Allez dans l'onglet <strong>SQL Editor</strong> de Supabase et exécutez ce script :
                  <div className="relative mt-2">
                    <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl text-xs overflow-x-auto font-mono max-h-36">
                      {sqlSetupCode}
                    </pre>
                    <button 
                      onClick={copySqlToClipboard}
                      type="button"
                      className="absolute top-2 right-2 flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg backdrop-blur-sm transition-colors"
                    >
                      {copySuccess ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      {copySuccess ? 'Copié !' : 'Copier SQL'}
                    </button>
                  </div>
                </li>
                <li className="leading-relaxed">
                  Récupérez vos identifiants dans <strong>Project Settings → Data API</strong> et collez-les ci-dessous :
                </li>
              </ol>

              {/* Formulaire URL & Clé */}
              <form onSubmit={handleSaveCloudConfig} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Project URL</label>
                  <input 
                    type="url"
                    required
                    placeholder="https://xyzcompany.supabase.co"
                    value={cloudUrlInput}
                    onChange={(e) => setCloudUrlInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Project API Key (Anon / Public)</label>
                  <input 
                    type="text"
                    required
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={cloudKeyInput}
                    onChange={(e) => setCloudKeyInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowCloudModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors"
                  >
                    Fermer
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                  >
                    <Check size={16} /> Enregistrer et Connecter
                  </button>
                </div>
              </form>

            </div>

          </div>
        </div>
      )}

      {/* MODAL SAISIE MOT DE PASSE */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-2">
                <Lock size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Mode Édition</h3>
              <p className="text-sm text-slate-500">Entrez le mot de passe pour modifier le plan d'entraînement.</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <input
                  ref={passwordInputRef}
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(''); }}
                  className={`w-full text-center text-2xl tracking-widest bg-slate-50 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${passwordError ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
                {passwordError && (
                  <p className="text-xs text-red-600 mt-2 text-center font-semibold animate-in slide-in-from-top-1">{passwordError}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowPasswordModal(false); setPasswordInput(''); setPasswordError(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <LockOpen size={16} /> Déverrouiller
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL CHANGER LE MOT DE PASSE */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
                  <Key size={22} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Changer le mot de passe</h3>
              </div>
              <button onClick={() => { setShowChangePasswordModal(false); setPasswordChangeError(''); setNewPasswordInput(''); setConfirmPasswordInput(''); }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            {passwordChangedSuccess ? (
              <div className="flex flex-col items-center gap-3 py-6 text-emerald-600">
                <ShieldCheck size={48} />
                <p className="font-bold text-lg">Mot de passe mis à jour !</p>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nouveau mot de passe</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 4 caractères"
                    value={newPasswordInput}
                    onChange={(e) => { setNewPasswordInput(e.target.value); setPasswordChangeError(''); }}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    required
                    placeholder="Répétez le mot de passe"
                    value={confirmPasswordInput}
                    onChange={(e) => { setConfirmPasswordInput(e.target.value); setPasswordChangeError(''); }}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                {passwordChangeError && (
                  <p className="text-xs text-red-600 font-semibold">{passwordChangeError}</p>
                )}
                <div className="flex gap-3 pt-1">
                  <button type="button"
                    onClick={() => { setShowChangePasswordModal(false); setPasswordChangeError(''); setNewPasswordInput(''); setConfirmPasswordInput(''); }}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-colors text-sm">
                    Annuler
                  </button>
                  <button type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all text-sm flex items-center justify-center gap-2">
                    <Key size={15} /> Enregistrer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}