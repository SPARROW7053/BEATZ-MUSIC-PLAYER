import React from 'react';
import { motion } from 'framer-motion';
import { Power, Zap, Music2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

const Equalizer = () => {
  const {
    eqEnabled, eqPreset, eqGains, bassBoost,
    EQ_PRESETS, EQ_FREQUENCIES,
    setEqEnabled, applyEqPreset, setEqBand, setBassBoost,
  } = usePlayer();

  const freqLabels = ['31', '62', '125', '250', '500', '1K', '2K', '4K', '8K', '16K'];

  return (
    <div className="px-5 py-4 flex flex-col gap-6 max-w-lg mx-auto w-full">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Music2 size={20} className="text-neon-cyan" />
          <h3 className="text-lg font-bold text-white">Equalizer</h3>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setEqEnabled(!eqEnabled)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            eqEnabled
              ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30'
              : 'bg-white/5 text-gray-500 border border-white/10'
          }`}
        >
          <Power size={14} />
          {eqEnabled ? 'ON' : 'OFF'}
        </motion.button>
      </div>

      {/* ─── Presets ─── */}
      <div>
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">Presets</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(EQ_PRESETS).map(([key, preset]) => (
            <motion.button
              key={key}
              whileTap={{ scale: 0.95 }}
              onClick={() => applyEqPreset(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                eqPreset === key
                  ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
                  : 'bg-white/5 text-gray-400 border border-white/8 hover:bg-white/10 hover:text-white'
              }`}
            >
              {preset.name}
            </motion.button>
          ))}
          {eqPreset === 'custom' && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30">
              Custom
            </span>
          )}
        </div>
      </div>

      {/* ─── 10-Band Vertical Sliders ─── */}
      <div>
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">Frequency Bands</p>
        <div
          className="glass-card p-4 pt-6"
          style={{
            opacity: eqEnabled ? 1 : 0.4,
            pointerEvents: eqEnabled ? 'auto' : 'none',
            transition: 'opacity 0.3s ease',
          }}
        >
          {/* dB scale labels */}
          <div className="flex justify-between mb-[2px]">
            <span className="text-[9px] text-gray-600 w-6 text-right">+12</span>
            <span className="text-[9px] text-gray-600 flex-1" />
            <span className="text-[9px] text-gray-600 w-6">dB</span>
          </div>

          <div className="flex items-end justify-between gap-1">
            {eqGains.map((gain, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                {/* Gain value label */}
                <span className="text-[9px] text-gray-500 font-mono h-3">
                  {gain > 0 ? `+${gain}` : gain}
                </span>

                {/* Vertical slider container */}
                <div className="relative w-full flex justify-center" style={{ height: 120 }}>
                  <div className="relative w-2 h-full bg-white/5 rounded-full overflow-hidden">
                    {/* Filled portion */}
                    <div
                      className="absolute bottom-1/2 w-full rounded-full transition-all duration-150"
                      style={{
                        height: `${Math.abs(gain) / 12 * 50}%`,
                        bottom: gain >= 0 ? '50%' : 'auto',
                        top: gain < 0 ? '50%' : 'auto',
                        background: gain >= 0
                          ? 'linear-gradient(to top, #00f3ff, #b026ff)'
                          : 'linear-gradient(to bottom, #ff00ea, #b026ff)',
                      }}
                    />
                    {/* Center line */}
                    <div className="absolute left-0 right-0 top-1/2 h-px bg-white/20 -translate-y-1/2" />
                  </div>

                  {/* Invisible range input (vertical) */}
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={gain}
                    onChange={(e) => setEqBand(i, Number(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    style={{
                      writingMode: 'vertical-lr',
                      direction: 'rtl',
                      width: '100%',
                      height: '100%',
                    }}
                  />
                </div>

                {/* Frequency label */}
                <span className="text-[9px] text-gray-500 font-mono">{freqLabels[i]}</span>
              </div>
            ))}
          </div>

          {/* Zero line label */}
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-gray-600 w-6 text-right">-12</span>
            <span className="text-[9px] text-gray-600 flex-1" />
          </div>
        </div>
      </div>

      {/* ─── Bass Boost ─── */}
      <div
        style={{
          opacity: eqEnabled ? 1 : 0.4,
          pointerEvents: eqEnabled ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-neon-cyan" />
            <p className="text-xs uppercase tracking-wider text-gray-500">Bass Boost</p>
          </div>
          <span className="text-xs font-mono text-neon-cyan">
            {bassBoost > 0 ? `+${bassBoost}` : bassBoost} dB
          </span>
        </div>

        <div className="glass-card p-4">
          <div className="relative w-full h-2 bg-white/10 rounded-full">
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${(bassBoost / 12) * 100}%`,
                background: 'linear-gradient(to right, #00f3ff, #b026ff, #ff00ea)',
              }}
            />
            <input
              type="range"
              min={0}
              max={12}
              step={1}
              value={bassBoost}
              onChange={(e) => setBassBoost(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
              style={{ height: '100%' }}
            />
          </div>
          {/* Tick marks */}
          <div className="flex justify-between mt-2">
            {[0, 3, 6, 9, 12].map(v => (
              <span key={v} className="text-[9px] text-gray-600 font-mono">{v}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Equalizer;
