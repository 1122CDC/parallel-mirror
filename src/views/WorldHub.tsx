import React, { useEffect, useState } from 'react';
import { WorldRecord } from '../types/world';
import { WorldService } from '../services/worldService';
import { WorldCard } from '../components/WorldCard';
import { Globe, Plus } from 'lucide-react';

interface WorldHubProps {
  userId: string;
  onSelectWorld: (world: WorldRecord) => void;
  onStartNew: () => void;
}

export const WorldHub: React.FC<WorldHubProps> = ({ userId, onSelectWorld, onStartNew }) => {
  const [worlds, setWorlds] = useState<WorldRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWorlds = async () => {
      try {
        const data = await WorldService.getWorlds(userId);
        setWorlds(data);
      } catch (err) {
        console.error("加载世界失败", err);
      } finally {
        setLoading(false);
      }
    };
    loadWorlds();
  }, [userId]);

  const handleDelete = async (id: string) => {
    if (confirm("确定要从这个维度抹除这段记忆吗？")) {
      await WorldService.deleteWorld(userId, id);
      setWorlds(prev => prev.filter(w => w.id !== id));
    }
  };

  return (
    <div className="p-6 pt-20 pb-32 max-w-2xl mx-auto animate-in fade-in duration-700">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter text-white">平行世界</h2>
          <p className="text-[10px] opacity-30 font-bold uppercase tracking-[0.3em] text-neutral-400 mt-1">
            Captured Lives: {worlds.length}
          </p>
        </div>
        <Globe className="text-purple-500 opacity-20" size={32} />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-[4/5] bg-neutral-900/50 rounded-[2.5rem] animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onStartNew}
            className="flex flex-col items-center justify-center aspect-[4/5] border-2 border-dashed border-white/5 rounded-[2.5rem] hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={24} className="text-purple-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest mt-4 text-neutral-500 group-hover:text-purple-400">
              开启新轮回
            </span>
          </button>

          {worlds.map(w => (
            <WorldCard 
              key={w.id} 
              world={w} 
              onClick={onSelectWorld} 
              onDelete={handleDelete} 
            />
          ))}

          {!loading && worlds.length === 0 && (
            <div className="col-span-2 py-20 text-center opacity-20">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">荒芜的多元宇宙</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
