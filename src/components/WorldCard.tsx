import React from 'react';
import { WorldRecord, calculateTier } from '../types/world';
import { Map, Trash2, ArrowRight } from 'lucide-react';

interface WorldCardProps {
  world: WorldRecord;
  onClick: (world: WorldRecord) => void;
  onDelete: (id: string) => void;
}

export const WorldCard: React.FC<WorldCardProps> = ({ world, onClick, onDelete }) => {
  const tier = calculateTier(world.attrs);
  
  return (
    <div 
      onClick={() => onClick(world)}
      className="group relative bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-4 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer overflow-hidden shadow-xl"
    >
      {/* 背景装饰发光 */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full group-hover:bg-purple-500/20 transition-all"></div>
      
      <div className="relative aspect-[4/5] rounded-[2rem] bg-neutral-800 border border-white/5 overflow-hidden mb-6 flex items-center justify-center shadow-2xl">
        {world.imageUrl ? (
          <img 
            src={world.imageUrl} 
            alt={world.personaLabel} 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
          />
        ) : (
          <div className="flex flex-col items-center gap-4 opacity-20">
            <Map className="w-16 h-16 text-white" />
            <span className="text-[10px] font-black uppercase tracking-widest">Dimension Lost</span>
          </div>
        )}
        
        {/* Tier Badge: 复刻 V8.0 紫色悬浮层 */}
        <div className="absolute top-4 right-4 px-4 py-2 bg-purple-600/90 backdrop-blur-xl rounded-2xl text-[10px] font-black italic text-white shadow-lg border border-white/20">
          RANK {tier}
        </div>

        {/* 底部遮罩：提升文字对比度 */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent" />
        
        <div className="absolute inset-x-0 bottom-0 p-6">
           <h3 className="text-sm font-black text-white uppercase truncate tracking-[0.2em] mb-1">
              {world.personaLabel}
            </h3>
            <p className="text-[10px] text-white/50 line-clamp-1 leading-relaxed italic">
              {world.summary}
            </p>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between px-1">
        <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest">
          DIMENSION #{(parseInt(world.id || '0', 16) % 9999).toString().padStart(4, '0')}
        </span>
        <ArrowRight size={12} className="text-purple-500 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
      </div>
    </div>
  );
};
