import React from 'react';
import { WorldRecord, calculateTier, SimLog } from '../types/world';
import { ChevronLeft, Share2, Award, Calendar, BarChart3, Clock } from 'lucide-react';

interface WorldDetailProps {
  world: WorldRecord;
  onBack: () => void;
}

export const WorldDetail: React.FC<WorldDetailProps> = ({ world, onBack }) => {
  const tier = calculateTier(world.attrs);
  const logs: SimLog[] = JSON.parse(world.logs || '[]');
  
  const StatBar = ({ label, val, color }: { label: string; val: number; color: string }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between items-end px-1">
        <span className="text-[10px] font-black opacity-40 uppercase tracking-tighter text-white">{label}</span>
        <span className="text-xs font-black text-white">{val}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div 
          className={`h-full ${color} shadow-[0_0_10px_currentColor] transition-all duration-1000`} 
          style={{ width: `${val}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="p-6 pt-16 pb-32 max-w-2xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="p-3 bg-neutral-900/50 rounded-2xl border border-white/10 hover:bg-neutral-800 transition-all active:scale-95">
          <ChevronLeft size={20} className="text-purple-400" />
        </button>
        <div className="px-6 py-2 bg-purple-600/20 rounded-full border border-purple-500/30">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 font-mono">
            ARCHIVE #{ (parseInt(world.id || '0', 16) % 9999).toString().padStart(4, '0') }
          </span>
        </div>
        <button className="p-3 bg-neutral-900/50 rounded-2xl border border-white/10 opacity-50 cursor-not-allowed">
          <Share2 size={20} className="text-neutral-500" />
        </button>
      </div>

      {/* Hero Visual Section: 1:1 电影底片感 */}
      <div className="relative group">
        <div className="absolute -inset-4 bg-purple-600/20 blur-[100px] rounded-full opacity-30 animate-pulse pointer-events-none" />
        <div className="relative aspect-[3/4] md:aspect-video rounded-[3.5rem] bg-neutral-900 border border-white/10 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] group">
          {world.imageUrl ? (
            <img src={world.imageUrl} className="w-full h-full object-cover transition-transform duration-[20s] scale-110 group-hover:scale-100" alt="World Visual" />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center bg-neutral-950">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center animate-pulse"><Award size={40} className="text-white/20" /></div>
              <p className="text-[10px] font-black uppercase tracking-[0.6em] mt-8 text-white/20 italic">Visual Core Offline</p>
            </div>
          )}
          
          {/* 电影感暗角叠加 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
          
          <div className="absolute inset-x-0 bottom-0 p-12 pt-32">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 ml-1">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Chronical Archive</span>
              </div>
              <h2 className="text-5xl font-black italic tracking-tighter leading-tight text-white drop-shadow-2xl">
                {world.personaLabel}
              </h2>
              <div className="max-w-xl">
                <p className="text-lg opacity-80 font-light italic leading-relaxed text-neutral-200 indent-4">
                  {world.summary}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats & Rank Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-neutral-900/40 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/5 space-y-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <BarChart3 size={100} />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-6xl font-black italic tracking-tighter text-purple-500 leading-none drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">
              {tier}
            </span>
            <span className="text-xs font-bold opacity-30 uppercase tracking-widest text-neutral-400">Dimension Tier</span>
          </div>
          <div className="space-y-3 pt-4">
             <div className="flex items-center gap-2 text-[10px] font-black text-purple-400/80 uppercase">
               <Award size={14} />
               综合演化评价
             </div>
             <p className="text-[10px] leading-relaxed text-neutral-500 italic">
               该人格在【{world.parallelDecision}】的逻辑路径下表现稳定。基于五维权重计算，本维度稳定性等级为 {tier}。
             </p>
          </div>
        </div>

        <div className="bg-neutral-900/40 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/5 space-y-4 shadow-xl">
           <StatBar label="资产总值" val={world.attrs.wealth} color="bg-yellow-500" />
           <StatBar label="知识底蕴" val={world.attrs.intellect} color="bg-blue-400" />
           <StatBar label="幸福效用" val={world.attrs.happiness} color="bg-pink-500" />
           <StatBar label="社会资源" val={world.attrs.social} color="bg-emerald-400" />
           <div className="pt-2">
             <StatBar label="生存压力" val={world.attrs.stress} color="bg-orange-500" />
           </div>
        </div>
      </div>

      {/* Chronicle / Timeline */}
      <div className="space-y-10 py-10">
        <div className="flex items-center gap-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
          <div className="flex items-center gap-2 text-[10px] font-black opacity-30 uppercase tracking-[0.4em] text-white">
            <Clock size={12} />
            推演编年史
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
        </div>

        <div className="space-y-12 pl-6 border-l-2 border-white/5 relative">
          {logs.map((log, i) => (
            <div key={i} className="relative pl-10 group animate-in slide-in-from-left-4" style={{ animationDelay: `${i * 100}ms` }}>
              {/* Timeline Dot */}
              <div className="absolute left-[-9px] top-1.5 w-4 h-4 rounded-full border-2 border-purple-500 bg-black group-hover:scale-125 group-hover:bg-purple-500 transition-all shadow-[0_0_10px_rgba(168,85,247,0.3)]" />
              
              <div className="flex items-center gap-4 mb-3">
                <div className="px-3 py-1 bg-purple-600/10 border border-purple-500/20 rounded-full text-[10px] font-mono font-black text-purple-400 uppercase tracking-widest">
                  {world.profile.birthYear + log.age} · {log.age} AGE
                </div>
                <div className="h-px w-8 bg-white/5" />
              </div>
              
              <div className="text-base font-light leading-relaxed text-neutral-300 italic group-hover:text-white transition-colors">
                {log.content}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Bottom Spacer for Nav */}
      <div className="h-20" />
    </div>
  );
};
