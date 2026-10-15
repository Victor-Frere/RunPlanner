import React, { useState, useMemo, useEffect } from 'react';
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
  RotateCcw
} from 'lucide-react';
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
  { id: 8, date: '30/11/2026', days: [ { id: 'd1', name: 'Lundi', type: 'Footing facile', details: "65'", volume: 9 }, { id: 'd2', name: 'Mardi', type: 'Côtes', details: "13x200", volume: 10 }, { id: 'd3', name: 'Mercredi', type: 'Footing facile', details: "65'", volume: 9 }, { id: 'd4', name: 'Jeudi', type: 'Seuil', details: "6x3'", volume: 10 }, { id: 'd5', name: 'Vendredi', type: 'Footing facile', details: "65'", volume: 9 }, { id: 'd6', name: 'Samedi', type: 'Off', details: '', volume: 0 }, { id: 'd7', name: 'Dimanche', type: 'Seuil', details: "6x6'", volume: 13 } ] },
  { id: 9, date: '07/12/2026', days: [ { id: 'd1', name: 'Lundi', type: 'Footing facile', details: "70'", volume: 10 }, { id: 'd2', name: 'Mardi', type: 'Côtes', details: "14x200", volume: 11 }, { id: 'd3', name: 'Mercredi', type: 'Footing facile', details: "70'", volume: 10 }, { id: 'd4', name: 'Jeudi', type: 'Seuil', details: "7x3'", volume: 11 }, { id: 'd5', name: 'Vendredi', type: 'Footing facile', details: "70'", volume: 10 }, { id: 'd6', name: 'Samedi', type: 'Off', details: '', volume: 0 }, { id: 'd7', name: 'Dimanche', type: 'Seuil', details: "5x7'", volume: 14 } ] },
  { id: 10, date: '14/12/2026', days: [ { id: 'd1', name: 'Lundi', type: 'Footing facile', details: "75'", volume: 11 }, { id: 'd2', name: 'Mardi', type: 'Côtes', details: "14x200", volume: 11 }, { id: 'd3', name: 'Mercredi', type: 'Footing facile', details: "75'", volume: 11 }, { id: 'd4', name: 'Jeudi', type: 'Seuil', details: "9x3'", volume: 12 }, { id: 'd5', name: 'Vendredi', type: 'Footing facile', details: "75'", volume: 11 }, { id: 'd6', name: 'Samedi', type: 'Off', details: '', volume: 0 }, { id: 'd7', name: 'Dimanche', type: 'Seuil', details: "4x8'", volume: 15 } ] },
  { id: 11, date: '21/12/2026', days: [ { id: 'd1', name: 'Lundi', type: 'Footing facile', details: "80'", volume: 12 }, { id: 'd2', name: 'Mardi', type: 'Côtes', details: "10x200", volume: 12 }, { id: 'd3', name: 'Mercredi', type: 'Footing facile', details: "80'", volume: 12 }, { id: 'd4', name: 'Jeudi', type: 'Seuil', details: "9x3'", volume: 12 }, { id: 'd5', name: 'Vendredi', type: 'Footing facile', details: "80'", volume: 12 }, { id: 'd6', name: 'Samedi', type: 'Off', details: '', volume: 0 }, { id: 'd7', name: 'Dimanche', type: 'Seuil', details: "3x9'", volume: 16 } ] },
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

  useEffect(() => {
    try {
      localStorage.setItem('runplanner_weeks', JSON.stringify(weeks));
    } catch (e) {
      console.error(e);
    }
  }, [weeks]);

  const [selectedWeekId, setSelectedWeekId] = useState(initialData[0].id);
  const [selectedDayId, setSelectedDayId] = useState(null);
  
  // Gestion de l'accordéon en mode édition
  const [expandedWeeks, setExpandedWeeks] = useState([initialData[0].id]);

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
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Auto-sauvegardé
            </div>

            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
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

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setMode('view')}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-colors ${mode === 'view' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Eye size={18} /> Visualisation
              </button>
              <button 
                onClick={() => setMode('edit')}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-colors ${mode === 'edit' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Settings size={18} /> Édition
              </button>
            </div>
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
    </div>
  );
}