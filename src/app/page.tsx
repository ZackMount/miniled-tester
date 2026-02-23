"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
  BsGrid1X2,
  BsSoundwave,
  BsBrightnessHigh,
  BsBullseye,
  BsStars,
  BsArrowsFullscreen,
  BsFullscreenExit,
  BsGlobe,
  BsInfoCircle,
  BsTrash,
  BsGithub,
  BsExclamationTriangle,
} from 'react-icons/bs';
import { getHdrAvif } from './hdr-avif-data';
import { t, Locale } from './i18n';

const modeIds = ['grid', 'animation', 'hdr-step', 'blooming', 'starfield'] as const;
const modeIcons = { grid: BsGrid1X2, animation: BsSoundwave, 'hdr-step': BsBrightnessHigh, blooming: BsBullseye, starfield: BsStars };

const presets = [
  { id: '576', cols: 32, rows: 18 },
  { id: '1152', cols: 48, rows: 24 },
  { id: '2304', cols: 64, rows: 36 },
  { id: '2596', cols: 59, rows: 44 },
];

const hdrPresetValues = [
  [100, 200, 300, 400],
  [100, 200, 300, 400],
  [100, 200, 400, 600],
  [100, 200, 400, 600, 800, 1000],
  [200, 400, 600, 800, 1000, 1400],
  [1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000],
  [1000, 1500, 2000, 3000, 4000],
  [1000, 2000, 4000, 6000, 8000, 10000],
];

const accentBtn = (active: boolean) =>
  `flex-1 py-1.5 rounded text-xs transition-colors ${active ? 'bg-teal-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`;
const modeBtn = (active: boolean) =>
  `w-full text-left px-3 py-3 rounded-lg text-sm transition-all flex items-center gap-3 ${active ? 'bg-teal-600 text-white' : 'hover:bg-gray-800 text-gray-300'}`;

function SceneHdrPanel({ i, isHdrSupported, sceneHdrEnabled, setSceneHdrEnabled, sceneHdrNits, setSceneHdrNits, sceneAvifUrl }: {
  i: ReturnType<typeof t>; isHdrSupported: boolean | null;
  sceneHdrEnabled: boolean; setSceneHdrEnabled: (v: boolean) => void;
  sceneHdrNits: number; setSceneHdrNits: (v: number) => void;
  sceneAvifUrl: string | null;
}) {
  return (
    <div className="border-t border-gray-700 pt-3 mt-3">
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{i.sceneHdr}</label>
      <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer mb-2">
        <input type="checkbox" checked={sceneHdrEnabled} onChange={e => setSceneHdrEnabled(e.target.checked)} className="accent-teal-500 w-4 h-4" disabled={!isHdrSupported} />
        {i.sceneHdrEnable}
      </label>
      {sceneHdrEnabled && (
        <>
          <div className="flex items-center gap-2 mb-1">
            <label className="text-xs text-gray-500 whitespace-nowrap">{i.sceneHdrNits}:</label>
            <input type="number" value={sceneHdrNits} onChange={e => { const v = Number(e.target.value); if (v >= 0 && v <= 10000) setSceneHdrNits(v); }}
              min="0" max="10000" step="50" className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-sm text-teal-400 font-mono outline-none text-right" />
            {sceneAvifUrl && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sceneAvifUrl} alt="" width={22} height={22} className="rounded border border-gray-600 ml-auto" />
              </>
            )}
          </div>
          <input type="range" value={sceneHdrNits} onChange={e => setSceneHdrNits(Number(e.target.value))} min="100" max="10000" step="50" className="w-full" />
        </>
      )}
      <p className="text-[10px] text-gray-500 mt-1">* {i.sceneHdrTip}</p>
      {isHdrSupported === false && <p className="text-[10px] text-red-400 mt-1">{i.hdrNotSupported}</p>}
    </div>
  );
}

export default function Home() {
  const [locale, setLocale] = useState<Locale>('zh');
  const i = t(locale);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dismissedFullscreen, setDismissedFullscreen] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [hdrWarningAccepted, setHdrWarningAccepted] = useState(false);

  const [currentMode, setCurrentMode] = useState('grid');

  const [selectedPreset, setSelectedPreset] = useState('1152');
  const [cols, setCols] = useState(48);
  const [rows, setRows] = useState(24);
  const [customCols, setCustomCols] = useState(48);
  const [customRows, setCustomRows] = useState(24);
  const [activeZone, setActiveZone] = useState<number | null>(null);
  const [lockedZones, setLockedZones] = useState<Set<number>>(new Set());
  const [bloomingAddGlow, setBloomingAddGlow] = useState(false);
  const totalZones = cols * rows;

  const [sceneHdrEnabled, setSceneHdrEnabled] = useState(false);
  const [sceneHdrNits, setSceneHdrNits] = useState(400);

  const [animationType, setAnimationType] = useState('scan-h');
  const [animationSpeed, setAnimationSpeed] = useState(50);
  const animPosRef = useRef(1);
  const animDirRef = useRef(1);
  const [animActiveZones, setAnimActiveZones] = useState<Set<number>>(new Set());

  const [bloomingShape, setBloomingShape] = useState('circle');
  const [bloomingSize, setBloomingSize] = useState(100);
  const [bloomingThickness, setBloomingThickness] = useState(2);
  const [bloomingAutoMove, setBloomingAutoMove] = useState(false);
  const [bloomingPos, setBloomingPos] = useState(() => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  });
  const bloomingVelocity = useRef({ x: 5, y: 5 });

  const [selectedHdrPreset, setSelectedHdrPreset] = useState<number | 'custom'>(3);
  const [customHdrNits, setCustomHdrNits] = useState('100, 400, 800, 1000, 2000');
  const [hdrDirection, setHdrDirection] = useState<'row' | 'col'>('row');
  const [hdrWindowSize, setHdrWindowSize] = useState(100);
  const [isHdrSupported, setIsHdrSupported] = useState<boolean | null>(null);

  const [starCount, setStarCount] = useState(300);
  const [starSize, setStarSize] = useState(2);
  const [starSpeed, setStarSpeed] = useState(20);
  const [starTwinkleRate, setStarTwinkleRate] = useState(50);
  const [stars, setStars] = useState<Array<{ id: number; x: number; y: number; size: number; opacity: number; speedX: number; speedY: number; baseOpacity: number }>>([]);

  const currentHdrNitsList = useMemo(() => {
    if (selectedHdrPreset === 'custom') {
      const parsed = customHdrNits.split(',').map(n => Number(n.trim())).filter(n => !isNaN(n) && n > 0);
      return parsed.length > 0 ? parsed : [100];
    }
    return hdrPresetValues[selectedHdrPreset];
  }, [selectedHdrPreset, customHdrNits]);

  const sceneAvifUrl = useMemo(() => {
    if (!sceneHdrEnabled || !isHdrSupported) return null;
    return getHdrAvif(sceneHdrNits);
  }, [sceneHdrEnabled, isHdrSupported, sceneHdrNits]);

  const showOverlay = !isFullscreen && !dismissedFullscreen;
  const showHdrWarning = currentMode === 'hdr-step' && !hdrWarningAccepted;

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen?.().catch(err => {
      console.warn(`Fullscreen error: ${err.message}`);
    });
  };
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) enterFullscreen();
    else document.exitFullscreen?.();
  };

  const handleModeChange = useCallback((mode: string) => {
    setCurrentMode(mode);
    if (mode === 'hdr-step') setHdrWarningAccepted(false);
  }, []);

  const toggleLockedZone = useCallback((n: number) => {
    setLockedZones(prev => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n); else next.add(n);
      return next;
    });
  }, []);

  useEffect(() => {
    const mql = window.matchMedia?.('(dynamic-range: high)');
    const hdrHandler = () => setIsHdrSupported(mql?.matches ?? false);
    if (mql) {
      queueMicrotask(() => setIsHdrSupported(mql.matches));
      mql.addEventListener('change', hdrHandler);
    }
    const onFSChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) setDismissedFullscreen(false);
    };
    const onKeydown = (e: KeyboardEvent) => {
      if (e.code === 'Space') { setUiVisible(prev => !prev); e.preventDefault(); }
    };
    document.addEventListener('fullscreenchange', onFSChange);
    document.addEventListener('keydown', onKeydown);
    return () => {
      document.removeEventListener('fullscreenchange', onFSChange);
      document.removeEventListener('keydown', onKeydown);
      mql?.removeEventListener('change', hdrHandler);
    };
  }, []);

  useEffect(() => {
    if (currentMode !== 'animation') return;
    let lastTime = 0;
    let frameId: number;
    const loop = (time: number) => {
      const delay = 200 - (animationSpeed * 1.84);
      if (time - lastTime >= delay) {
        lastTime = time;
        let maxPos = 1;
        if (animationType === 'scan-h') maxPos = cols;
        if (animationType === 'scan-v') maxPos = rows;
        if (animationType === 'single') maxPos = totalZones;
        animPosRef.current += animDirRef.current;
        if (animPosRef.current > maxPos) animPosRef.current = 1;
        else if (animPosRef.current < 1) { animPosRef.current = 2; animDirRef.current = 1; }
        const newActive = new Set<number>();
        const p = animPosRef.current;
        if (animationType === 'scan-h') { for (let r = 0; r < rows; r++) newActive.add(r * cols + p); }
        else if (animationType === 'scan-v') { const start = (p - 1) * cols + 1; for (let c = 0; c < cols; c++) newActive.add(start + c); }
        else if (animationType === 'single') { newActive.add(p); }
        setAnimActiveZones(newActive);
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [currentMode, animationSpeed, animationType, cols, rows, totalZones]);

  useEffect(() => {
    if (currentMode !== 'blooming' || !bloomingAutoMove) return;
    let frameId: number;
    const loop = () => {
      setBloomingPos(prev => {
        const w = window.innerWidth, h = window.innerHeight;
        let { x, y } = prev;
        let { x: vx, y: vy } = bloomingVelocity.current;
        x += vx; y += vy;
        const radius = bloomingShape === 'cross' ? 0 : bloomingSize / 2;
        if (x <= radius || x >= w - radius) { vx *= -1; x = x <= radius ? radius : w - radius; }
        if (y <= radius || y >= h - radius) { vy *= -1; y = y <= radius ? radius : h - radius; }
        bloomingVelocity.current = { x: vx, y: vy };
        return { x, y };
      });
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [currentMode, bloomingAutoMove, bloomingShape, bloomingSize]);

  const handleMouseMoveBlooming = useCallback((e: React.MouseEvent) => {
    if (currentMode === 'blooming' && !bloomingAutoMove) setBloomingPos({ x: e.clientX, y: e.clientY });
  }, [currentMode, bloomingAutoMove]);

  useEffect(() => {
    if (currentMode !== 'starfield') return;
    let starsArr: typeof stars = [];
    for (let j = 0; j < starCount; j++) {
      starsArr.push({ id: j, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * starSize + 0.5,
        baseOpacity: Math.random() * 0.5 + 0.5, opacity: 1, speedX: (Math.random() - 0.5) * (starSpeed / 500), speedY: (Math.random() - 0.5) * (starSpeed / 500) });
    }
    let frameId: number;
    const loop = (time: number) => {
      starsArr = starsArr.map(star => {
        let { x, y, opacity } = star;
        const { baseOpacity, speedX, speedY } = star;
        x += speedX; y += speedY;
        if (x < 0) x = 100; if (x > 100) x = 0; if (y < 0) y = 100; if (y > 100) y = 0;
        if (starTwinkleRate > 0) { const tw = (Math.sin(time * 0.001 * (starTwinkleRate / 10) + star.id) + 1) / 2; opacity = baseOpacity * 0.2 + baseOpacity * 0.8 * tw; }
        else opacity = baseOpacity;
        return { ...star, x, y, opacity };
      });
      setStars(starsArr);
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [currentMode, starCount, starSize, starSpeed, starTwinkleRate]);

  const applyPreset = (id: string) => {
    setSelectedPreset(id);
    if (id === 'custom') return;
    const p = presets.find(x => x.id === id);
    if (p) { setCols(p.cols); setRows(p.rows); setCustomCols(p.cols); setCustomRows(p.rows); animPosRef.current = 1; }
  };
  const applyCustomDimensions = () => {
    if (customCols > 0 && customRows > 0) { setCols(customCols); setRows(customRows); setSelectedPreset('custom'); animPosRef.current = 1; }
  };

  return (
    <div className="relative w-full h-full bg-black" onMouseMove={handleMouseMoveBlooming}>

      <div aria-hidden="true" style={{
        position: 'fixed', top: 0, left: 0, width: 1, height: 1,
        backgroundImage: 'var(--hdr-white)', backgroundSize: 'cover',
        opacity: 0.01, pointerEvents: 'none', zIndex: -1
      }} />

      <div
        className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
        style={{ opacity: showOverlay ? 1 : 0, transition: 'opacity 0.4s ease', pointerEvents: showOverlay ? 'auto' : 'none' }}
      >
        <div className="bg-gray-900/80 p-8 rounded-2xl border border-gray-700 text-center max-w-md shadow-2xl">
          <BsArrowsFullscreen className="w-12 h-12 mx-auto mb-4 text-teal-400" />
          <h2 className="text-2xl font-bold mb-4">{i.recommendFullscreen}</h2>
          <p className="text-gray-300 mb-6 text-sm leading-relaxed">
            {i.fullscreenDesc}<br /><br />
            {i.fullscreenTip}
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={enterFullscreen} className="px-6 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg font-medium transition-colors">{i.enterFullscreen}</button>
            <button onClick={() => setDismissedFullscreen(true)} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors">{i.dismiss}</button>
          </div>
        </div>
      </div>

      <div
        className="absolute inset-0 z-[45] flex items-center justify-center bg-black/90 backdrop-blur-sm"
        style={{ opacity: showHdrWarning ? 1 : 0, transition: 'opacity 0.4s ease', pointerEvents: showHdrWarning ? 'auto' : 'none' }}
      >
        <div className="bg-gray-900/90 p-8 rounded-2xl border border-amber-700/50 text-center max-w-md shadow-2xl">
          <BsExclamationTriangle className="w-12 h-12 mx-auto mb-4 text-amber-400" />
          <h2 className="text-2xl font-bold mb-4 text-amber-400">{i.hdrWarningTitle}</h2>
          <p className="text-gray-300 mb-6 text-sm leading-relaxed">{i.hdrWarningBody}</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => setHdrWarningAccepted(true)} className="px-6 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg font-medium transition-colors">{i.hdrWarningConfirm}</button>
            <button onClick={() => setCurrentMode('grid')} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors">{i.hdrWarningCancel}</button>
          </div>
        </div>
      </div>

      <div
        className="absolute inset-0 z-[55] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        style={{ opacity: showAbout ? 1 : 0, transition: 'opacity 0.35s ease', pointerEvents: showAbout ? 'auto' : 'none' }}
        onClick={() => setShowAbout(false)}
      >
        <div
          className="bg-gray-900 p-8 rounded-2xl border border-gray-700 max-w-lg shadow-2xl w-[420px]"
          onClick={e => e.stopPropagation()}
          style={{ transform: showAbout ? 'translateY(0)' : 'translateY(12px)', transition: 'transform 0.35s ease' }}
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-xl bg-gray-800 border border-gray-600 p-2 flex-shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 32 32" width="36" height="36">
                <rect width="32" height="32" rx="6" fill="#1f2937"/>
                <rect x="3" y="5" width="6" height="6" rx="1" fill="#4b5563"/>
                <rect x="11" y="5" width="6" height="6" rx="1" fill="#4b5563"/>
                <rect x="19" y="5" width="6" height="6" rx="1" fill="#6b7280"/>
                <rect x="3" y="13" width="6" height="6" rx="1" fill="#4b5563"/>
                <rect x="11" y="13" width="6" height="6" rx="1" fill="#14b8a6"/>
                <rect x="19" y="13" width="6" height="6" rx="1" fill="#6b7280"/>
                <rect x="3" y="21" width="6" height="6" rx="1" fill="#4b5563"/>
                <rect x="11" y="21" width="6" height="6" rx="1" fill="#6b7280"/>
                <rect x="19" y="21" width="6" height="6" rx="1" fill="#4b5563"/>
                <circle cx="14" cy="16" r="2.5" fill="#fff" opacity="0.9"/>
                <rect x="27" y="5" width="2" height="22" rx="1" fill="#14b8a6" opacity="0.6"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-cyan-300 bg-clip-text text-transparent">{i.aboutTitle}</h2>
              <p className="text-xs text-gray-400 mt-0.5">v1.0.0</p>
            </div>
          </div>
          <p className="text-sm text-gray-300 mb-5 leading-relaxed">{i.aboutDesc}</p>
          <div className="mb-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{i.aboutFeatures}</h3>
            <ul className="text-sm text-gray-300 space-y-1.5">
              <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5">•</span>{i.aboutFeature1}</li>
              <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5">•</span>{i.aboutFeature2}</li>
              <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5">•</span>{i.aboutFeature3}</li>
            </ul>
          </div>
          <div className="border-t border-gray-700 pt-4 mb-5">
            <div className="flex items-center gap-3">
              <Image src="https://avatars.githubusercontent.com/u/118198354?v=4" alt="ZackMount" width={36} height={36} unoptimized className="rounded-full border-2 border-gray-600" />
              <div className="flex-1">
                <span className="text-sm text-white font-medium">ZackMount</span>
                <p className="text-[11px] text-gray-500">{i.aboutAuthor}</p>
              </div>
              <a href="https://github.com/ZackMount/miniled-tester" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-teal-400 hover:text-teal-300 transition-colors bg-gray-800 px-3 py-1.5 rounded-lg">
                <BsGithub className="w-4 h-4" />{i.aboutRepo}
              </a>
            </div>
          </div>
          <button onClick={() => setShowAbout(false)} className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors text-sm">{i.aboutClose}</button>
        </div>
      </div>

      <div
        className="absolute left-4 top-4 z-40 w-80 bg-gray-900 shadow-2xl rounded-xl border border-gray-700 overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          opacity: uiVisible ? 1 : 0,
          transform: uiVisible ? 'translateX(0) scale(1)' : 'translateX(-28px) scale(0.95)',
          transition: 'opacity 0.35s cubic-bezier(0.4,0,0.2,1), transform 0.35s cubic-bezier(0.4,0,0.2,1)',
          pointerEvents: uiVisible ? 'auto' : 'none', willChange: 'opacity, transform'
        }}
      >
        <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center shrink-0">
          <h1 className="text-lg font-bold bg-gradient-to-r from-teal-400 to-cyan-300 bg-clip-text text-transparent">{i.title}</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setLocale(l => l === 'zh' ? 'en' : 'zh')} className="text-gray-400 hover:text-white transition-colors p-1" title={i.language}>
              <BsGlobe className="w-4 h-4" />
            </button>
            <button onClick={() => setShowAbout(true)} className="text-gray-400 hover:text-white transition-colors p-1" title={i.about}>
              <BsInfoCircle className="w-4 h-4" />
            </button>
            <button onClick={toggleFullscreen} className="text-gray-400 hover:text-white transition-colors p-1" title={i.toggleFullscreen}>
              {isFullscreen ? <BsFullscreenExit className="w-4.5 h-4.5" /> : <BsArrowsFullscreen className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto custom-scrollbar flex-1 bg-gray-900">
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{i.testMode}</label>
            <div className="space-y-2">
              {modeIds.map(m => {
                const Icon = modeIcons[m];
                return (
                  <button key={m} onClick={() => handleModeChange(m)} className={modeBtn(currentMode === m)}>
                    <Icon className="w-5 h-5 flex-shrink-0" /><span>{i.modes[m]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {(currentMode === 'grid' || currentMode === 'animation') && (
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{i.zoneSettings}</label>
              <select value={selectedPreset} onChange={(e) => applyPreset(e.target.value)} className="w-full bg-gray-800 text-sm text-white border border-gray-700 rounded-lg px-3 py-2 mb-3 outline-none focus:border-teal-500">
                {presets.map((p, idx) => <option key={p.id} value={p.id}>{i.presetNames[idx]}</option>)}
                <option value="custom">{i.custom} (Custom)</option>
              </select>
              {selectedPreset === 'custom' && (
                <div className="flex gap-2 mb-2">
                  <div className="flex-1"><label className="text-xs text-gray-500">{i.colsW}</label><input type="number" value={customCols} onChange={e => setCustomCols(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm outline-none" /></div>
                  <div className="flex-1"><label className="text-xs text-gray-500">{i.rowsH}</label><input type="number" value={customRows} onChange={e => setCustomRows(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm outline-none" /></div>
                  <div className="flex items-end pb-0.5"><button onClick={applyCustomDimensions} className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-sm transition-colors">{i.apply}</button></div>
                </div>
              )}
              <div className="text-xs text-gray-500 mb-2 mt-1">{i.currentZones}: <span className="text-teal-400 font-mono">{cols * rows}</span> ({cols}×{rows})</div>
              <p className="text-[10px] text-amber-400/70 leading-tight mb-3 p-2 bg-amber-900/10 rounded border border-amber-800/20">{i.zoneDisclaimer}</p>

              {currentMode === 'grid' && (
                <div className="border-t border-gray-700 pt-3 mt-1 mb-3">
                  <p className="text-[10px] text-gray-400 mb-2">{i.clickLockTip}</p>
                  <button onClick={() => setLockedZones(new Set())} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors">
                    <BsTrash className="w-3.5 h-3.5" />{i.clearAll}
                  </button>
                </div>
              )}

              <div className="border-t border-gray-700 pt-3 mt-1">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={bloomingAddGlow} onChange={e => setBloomingAddGlow(e.target.checked)} className="accent-teal-500 w-4 h-4" />{i.addGlow}
                </label>
                <p className="text-[10px] text-gray-500 mt-1">* {i.glowTip}</p>
              </div>

              <SceneHdrPanel i={i} isHdrSupported={isHdrSupported} sceneHdrEnabled={sceneHdrEnabled} setSceneHdrEnabled={setSceneHdrEnabled} sceneHdrNits={sceneHdrNits} setSceneHdrNits={setSceneHdrNits} sceneAvifUrl={sceneAvifUrl} />
            </div>
          )}

          {currentMode === 'animation' && (
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{i.animType}</label>
              <div className="flex gap-2 mb-3">
                <button onClick={() => setAnimationType('scan-h')} className={accentBtn(animationType === 'scan-h')}>{i.scanH}</button>
                <button onClick={() => setAnimationType('scan-v')} className={accentBtn(animationType === 'scan-v')}>{i.scanV}</button>
                <button onClick={() => setAnimationType('single')} className={accentBtn(animationType === 'single')}>{i.single}</button>
              </div>
              <label className="block text-xs text-gray-500 mb-1">{i.speed}</label>
              <input type="range" value={animationSpeed} onChange={e => setAnimationSpeed(Number(e.target.value))} min="1" max="100" className="w-full" />
            </div>
          )}

          {currentMode === 'hdr-step' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">{i.hdrRealBrightness}</label>
                {isHdrSupported === false && <span className="text-[10px] text-red-400 font-bold px-1.5 py-0.5 rounded bg-red-900/30">{i.hdrNotSupported}</span>}
                {isHdrSupported === true && <span className="text-[10px] text-green-400 font-bold px-1.5 py-0.5 rounded bg-green-900/30">{i.hdrEnabled}</span>}
              </div>
              <select value={selectedHdrPreset} onChange={(e) => { const v = e.target.value; setSelectedHdrPreset(v === 'custom' ? 'custom' : Number(v)); }} className="w-full bg-gray-800 text-sm text-white border border-gray-700 rounded-lg px-3 py-2 mb-3 outline-none focus:border-teal-500">
                {i.hdrPresets.map((name, idx) => <option key={idx} value={idx}>{name}</option>)}
                <option value="custom">{i.customSteps} (Custom)</option>
              </select>
              {selectedHdrPreset === 'custom' && (
                <div className="mb-3">
                  <label className="block text-[10px] text-gray-500 mb-1">{i.customNitsLabel}</label>
                  <input type="text" value={customHdrNits} onChange={e => setCustomHdrNits(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm outline-none font-mono" placeholder={i.customNitsPlaceholder} />
                </div>
              )}
              <div className="flex gap-2 mb-3">
                <button onClick={() => setHdrDirection('row')} className={accentBtn(hdrDirection === 'row')}>{i.horizontal}</button>
                <button onClick={() => setHdrDirection('col')} className={accentBtn(hdrDirection === 'col')}>{i.vertical}</button>
              </div>
              <div className="border-t border-gray-700 pt-3 mt-1 mb-2">
                <label className="block text-xs text-gray-500 mb-1">{i.windowRatio}</label>
                <input type="range" value={hdrWindowSize} onChange={e => setHdrWindowSize(Number(e.target.value))} min="1" max="100" className="w-full" />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>{i.windowSmall}</span><span className="text-white font-mono">{hdrWindowSize}%</span><span>{i.windowFull}</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 leading-tight p-2 bg-gray-800/50 rounded">* {i.hdrNote}</p>
              {isHdrSupported === false && (
                <p className="text-[10px] text-red-300 mt-2 leading-tight bg-red-900/20 p-2 rounded border border-red-900/50">{i.hdrSdrWarning}</p>
              )}
            </div>
          )}

          {currentMode === 'blooming' && (
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{i.bloomingTest}</label>
              <div className="flex gap-2 mb-3">
                <button onClick={() => setBloomingShape('circle')} className={accentBtn(bloomingShape === 'circle')}>{i.circle}</button>
                <button onClick={() => setBloomingShape('square')} className={accentBtn(bloomingShape === 'square')}>{i.square}</button>
                <button onClick={() => setBloomingShape('cross')} className={accentBtn(bloomingShape === 'cross')}>{i.cross}</button>
              </div>
              {bloomingShape !== 'cross' ? (
                <>
                  <label className="block text-xs text-gray-500 mb-1 mt-3">{i.objSize}: <span className="text-gray-300 float-right">{bloomingSize}px</span></label>
                  <input type="range" value={bloomingSize} onChange={e => setBloomingSize(Number(e.target.value))} min="10" max="400" className="w-full mb-4" />
                </>
              ) : (
                <>
                  <label className="block text-xs text-gray-500 mb-1 mt-3">{i.crossThickness}: <span className="text-gray-300 float-right">{bloomingThickness}px</span></label>
                  <input type="range" value={bloomingThickness} onChange={e => setBloomingThickness(Number(e.target.value))} min="1" max="30" className="w-full mb-4" />
                </>
              )}
              <label className="flex items-center gap-2 text-sm text-gray-300 mb-3 cursor-pointer">
                <input type="checkbox" checked={bloomingAutoMove} onChange={e => setBloomingAutoMove(e.target.checked)} className="accent-teal-500 w-4 h-4" />{i.autoBounce}
              </label>
              <div className="border-t border-gray-700 pt-3 mt-1">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={bloomingAddGlow} onChange={e => setBloomingAddGlow(e.target.checked)} className="accent-teal-500 w-4 h-4" />{i.addGlow}
                </label>
                <p className="text-[10px] text-gray-500 mt-1">* {i.glowTip}</p>
              </div>
              <SceneHdrPanel i={i} isHdrSupported={isHdrSupported} sceneHdrEnabled={sceneHdrEnabled} setSceneHdrEnabled={setSceneHdrEnabled} sceneHdrNits={sceneHdrNits} setSceneHdrNits={setSceneHdrNits} sceneAvifUrl={sceneAvifUrl} />
            </div>
          )}

          {currentMode === 'starfield' && (
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{i.starTest}</label>
              <label className="block text-xs text-gray-500 mb-1 mt-2">{i.starCount}: <span className="text-gray-300 float-right">{starCount}</span></label>
              <input type="range" value={starCount} onChange={e => setStarCount(Number(e.target.value))} min="10" max="1000" className="w-full mb-3" />
              <label className="block text-xs text-gray-500 mb-1">{i.starSizeLabel}</label>
              <input type="range" value={starSize} onChange={e => setStarSize(Number(e.target.value))} min="1" max="10" className="w-full mb-3" />
              <label className="block text-xs text-gray-500 mb-1">{i.moveSpeed}</label>
              <input type="range" value={starSpeed} onChange={e => setStarSpeed(Number(e.target.value))} min="0" max="100" className="w-full mb-3" />
              <label className="block text-xs text-gray-500 mb-1">{i.twinkleRate}</label>
              <input type="range" value={starTwinkleRate} onChange={e => setStarTwinkleRate(Number(e.target.value))} min="0" max="100" className="w-full" />
              <p className="text-[10px] text-gray-500 mt-1">{i.twinkleOff}</p>
              <SceneHdrPanel i={i} isHdrSupported={isHdrSupported} sceneHdrEnabled={sceneHdrEnabled} setSceneHdrEnabled={setSceneHdrEnabled} sceneHdrNits={sceneHdrNits} setSceneHdrNits={setSceneHdrNits} sceneAvifUrl={sceneAvifUrl} />
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-700 bg-gray-800 text-xs text-center text-gray-400 shrink-0">
          {i.spaceHint}
        </div>
      </div>

      <div className="w-full h-full absolute inset-0 z-0 bg-black"
        style={sceneAvifUrl ? { '--scene-hdr': `url("${sceneAvifUrl}")` } as React.CSSProperties : undefined}>

        {(currentMode === 'grid' || currentMode === 'animation') && (
          <div className="w-full h-full grid-container" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
            {Array.from({ length: totalZones }).map((_, idx) => {
              const n = idx + 1;
              const isLocked = lockedZones.has(n);
              const isActive = currentMode === 'grid'
                ? (activeZone === n || isLocked)
                : animActiveZones.has(n);
              return (
                <div key={n}
                  className={`zone-cell ${isActive ? (bloomingAddGlow ? 'active zone-cell-glow' : 'active') : ''}`}
                  onMouseEnter={() => currentMode === 'grid' && setActiveZone(n)}
                  onMouseLeave={() => currentMode === 'grid' && setActiveZone(null)}
                  onClick={() => currentMode === 'grid' && toggleLockedZone(n)}
                />
              );
            })}
          </div>
        )}

        {currentMode === 'hdr-step' && !showHdrWarning && (
          <div className="w-full h-full relative flex items-center justify-center bg-black overflow-hidden">
            <div className={`relative flex bg-black ${hdrDirection === 'row' ? 'flex-row' : 'flex-col'}`}
              style={{ width: `${Math.sqrt(hdrWindowSize / 100) * 100}%`, height: `${Math.sqrt(hdrWindowSize / 100) * 100}%`, transition: 'all 0.3s ease' }}>
              {currentHdrNitsList.map((nits, idx) => {
                const avifUrl = isHdrSupported ? getHdrAvif(nits) : null;
                return (
                  <div key={idx} className={`hdr-block flex-1 flex justify-center ${hdrDirection === 'row' ? 'items-end pb-10' : 'items-center'}`}
                    style={avifUrl ? { backgroundImage: `url("${avifUrl}")` } : undefined}>
                    <span className="nits-label" style={{ opacity: hdrWindowSize < 5 ? 0 : 1 }}>
                      {nits} Nits{isHdrSupported ? '' : ' (SDR)'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentMode === 'blooming' && (
          <div className="w-full h-full relative cursor-none overflow-hidden bg-black">
            {bloomingShape === 'cross' ? (
              <>
                <div className={`blooming-obj ${bloomingAddGlow ? 'blooming-obj-glow' : ''}`}
                  style={{ position: 'absolute', width: bloomingThickness, height: '100%', left: bloomingPos.x - bloomingThickness / 2, top: 0 }} />
                <div className={`blooming-obj ${bloomingAddGlow ? 'blooming-obj-glow' : ''}`}
                  style={{ position: 'absolute', width: '100%', height: bloomingThickness, left: 0, top: bloomingPos.y - bloomingThickness / 2 }} />
              </>
            ) : (
              <div className={`blooming-obj ${bloomingShape === 'circle' ? 'rounded-full' : ''} ${bloomingAddGlow ? 'blooming-obj-glow' : ''}`}
                style={{ position: 'absolute', width: bloomingSize, height: bloomingSize,
                  left: bloomingPos.x - bloomingSize / 2, top: bloomingPos.y - bloomingSize / 2,
                  overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {sceneAvifUrl && <img src={sceneAvifUrl} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ borderRadius: 'inherit' }} />}
              </div>
            )}
          </div>
        )}

        {currentMode === 'starfield' && (
          <div className="w-full h-full relative overflow-hidden bg-black">
            {stars.map(star => (
              <div key={star.id} className="absolute rounded-full blooming-obj"
                style={{ left: `${star.x}%`, top: `${star.y}%`, width: `${star.size}px`, height: `${star.size}px`, opacity: star.opacity }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
