/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Smartphone, Wifi, Battery, Signal } from 'lucide-react';

interface DeviceFrameProps {
  children: React.ReactNode;
  title?: string;
}

export default function DeviceFrame({ children, title = "School Portal" }: DeviceFrameProps) {
  // Get current local time formatted for a phone status bar (HH:MM)
  const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div id="device-frame-container" className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm mx-auto w-full">
      {/* Device Body */}
      <div 
        id="simulated-phone-shell" 
        className="relative w-[360px] h-[720px] bg-slate-900 rounded-[40px] shadow-2xl border-8 border-slate-800 overflow-hidden flex flex-col select-none"
      >
        {/* Dynamic Notch / Camera */}
        <div id="phone-notch" className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-slate-900 rounded-b-2xl z-50 flex items-center justify-between px-6">
          <div className="w-3 h-3 bg-slate-800 rounded-full"></div>
          <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
        </div>

        {/* Status Bar */}
        <div id="phone-status-bar" className="h-10 pt-4 px-6 flex justify-between items-center text-xs text-white bg-slate-950 font-medium z-40 select-none">
          <span>{timeString}</span>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-0.5">
              <Battery className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            </div>
          </div>
        </div>

        {/* Main Phone Content Screen */}
        <div id="phone-screen-content" className="flex-1 bg-white dark:bg-slate-950 overflow-y-auto relative flex flex-col">
          {children}
        </div>

        {/* Home Indicator Bar */}
        <div id="phone-home-indicator-container" className="h-5 bg-white dark:bg-slate-950 flex items-center justify-center pb-1 z-40">
          <div className="w-28 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
        </div>
      </div>
      
      <p className="text-xs text-slate-500 mt-3 font-mono text-center">
        Simulated Teacher Mobile Viewport
      </p>
    </div>
  );
}
