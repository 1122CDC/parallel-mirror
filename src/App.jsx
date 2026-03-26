import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './components/Icon';
import { fetchAI } from './services/aiService';
import { WorldService } from './services/worldService';
import { ImageService } from './services/imageService';
import { WorldHub } from './views/WorldHub';
import { WorldDetail } from './views/WorldDetail';

// ==========================================
// 🚀 经典 V8.0 视觉参数复刻 (1:1 像素级) 🚀
// ==========================================
const V8_STYLE = {
  glassPanel: {
    background: 'rgba(23, 23, 23, 0.85)',
    backdropFilter: 'blur(30px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '3.5rem',
    boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 20px rgba(168,85,247,0.05)'
  },
  input: {
    backgroundColor: '#0c0c0e',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '1.5rem',
    padding: '1.25rem',
    fontSize: '12px',
    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
    color: '#e5e7eb'
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    borderRadius: '2rem',
    height: '4.5rem',
    fontWeight: '900',
    fontSize: '0.9rem',
    letterSpacing: '0.1em',
    boxShadow: '0 15px 35px rgba(124,58,237,0.4)',
    border: '1px solid rgba(255,255,255,0.1)'
  }
};

const INITIAL_ATTRS = { wealth: 50, intellect: 50, happiness: 50, stress: 10, social: 50 };
const CURRENT_YEAR = 2026;

export default function App() {
  const [appState, setAppState] = useState('init');
  const [profile, setProfile] = useState({ 
    name: '大哥', birthYear: 1990, hometown: '广西河池', industry: '互联网/IT', jobRole: '技术专家', childhoodVibe: '县城小康' 
  });
  const [preStory, setPreStory] = useState('');
  const [branchAge, setBranchAge] = useState(10);
  const [realityDecision, setRealityDecision] = useState('');
  const [parallelDecision, setParallelDecision] = useState('');
  const [currentAge, setCurrentAge] = useState(0);
  const [simLogs, setSimLogs] = useState([]);
  const [attrs, setAttrs] = useState(INITIAL_ATTRS);
  const [isPaused, setIsPaused] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentPivot, setCurrentPivot] = useState(null);
  const [activeWorld, setActiveWorld] = useState(null);
  // 固定 ID 以实现基本持久化 (生产环境应接入 Auth)
  const [userId] = useState(() => {
    const saved = localStorage.getItem('hmw_user_id');
    if (saved) return saved;
    const newId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('hmw_user_id', newId);
    return newId;
  });
  
  const processingAge = useRef(-1);
  const scrollRef = useRef(null);
  const userCurrentAge = useMemo(() => CURRENT_YEAR - profile.birthYear, [profile.birthYear]);

  // 计算模拟年份（出生年 + 当前年龄）
  const getSimYear = (age) => profile.birthYear + age;

  // AI 润色还原
  const handleBeautify = async (field) => {
    const rawValue = { preStory, realityDecision, parallelDecision }[field];
    if (!rawValue) return;
    setIsThinking(true);
    const prompt = `补全描述。平实大白话，不夸张。50字内。原话：${rawValue}`;
    const beautified = await fetchAI(prompt, false);
    if (beautified) {
      if (field === 'preStory') setPreStory(beautified);
      else if (field === 'realityDecision') setRealityDecision(beautified);
      else if (field === 'parallelDecision') setParallelDecision(beautified);
    }
    setIsThinking(false);
  };

  // 核心逻辑推演
  useEffect(() => {
    if (appState !== 'simulating' || isPaused || isThinking || currentAge >= userCurrentAge) {
        if (currentAge >= userCurrentAge && appState === 'simulating') setAppState('finished');
        return;
    }
    const timer = setTimeout(async () => {
      const nextAge = currentAge + 1;
      if (processingAge.current === nextAge) return;
      processingAge.current = nextAge;

      if (nextAge > branchAge && nextAge % 5 === 0) {
        setIsThinking(true);
        const prompt = `【分歧】${nextAge}岁。轨迹：【${parallelDecision}】。JSON: {"title": "命运的十字路口", "options": [{"text": "A", "desc": "后果", "impact": {"wealth":5}}, {"text": "B", "desc": "后果", "impact": {"wealth":-5}}]}`;
        const p = await fetchAI(prompt, true);
        setIsThinking(false);
        if (p?.options) { setIsPaused(true); setCurrentPivot({ age: nextAge, ...p }); return; }
      }

      setIsThinking(true);
      const factPrompt = `【日志】${nextAge}岁。轨迹：【${parallelDecision}】。大白话。JSON: {"story": "内容", "impact": {"wealth":2}}`;
      const d = await fetchAI(factPrompt, true);
      setIsThinking(false);
      if (d) {
        setAttrs(p => ({ ...p, wealth: Math.max(0, p.wealth + (d.impact?.wealth || 0)) }));
        setSimLogs(prev => [...prev, { age: nextAge, content: d.story }]);
      }
      setCurrentAge(nextAge);
    }, 1000);
    return () => clearTimeout(timer);
  }, [appState, isPaused, isThinking, currentAge]);

  const startSim = () => { if (realityDecision && parallelDecision) { setSimLogs([{ age: branchAge, content: `【源起锚点】：${preStory}\n【选择了】：${parallelDecision}` }]); setCurrentAge(branchAge); setAppState('simulating'); } };
  const handleChoice = (opt) => { setSimLogs(prev => [...prev, { age: currentPivot.age, content: `修正：${opt.text}。结果：${opt.desc}` }]); setCurrentAge(currentPivot.age); setCurrentPivot(null); setIsPaused(false); };

  // 定格并存入世界档案
  const saveToWorld = async () => {
    if (isThinking) return;
    setIsThinking(true);
    console.log("开始定格流程...");
    
    try {
      // 1. 生成人格总结 (增加超时控制的思想，防止 fetch 挂起)
      const personaPromise = fetchAI(`定格。返回 JSON: {"personaLabel": "No.${Math.floor(Math.random()*999)} 人格", "oneLiner": "此生由于选择了${parallelDecision}，终究走向了不凡。", "moments": ["定格时刻"]} `, true);

      // 2. 为了防止生图过慢阻塞流程，我们给生图设置一个 15 秒超时
      const imagePromise = ImageService.generateImage(parallelDecision).catch(e => {
        console.error("核心生图流程报错:", e);
        return null;
      });

      // 并发执行文本和图片生成，缩短等待时间
      const [persona, imageUrl] = await Promise.all([personaPromise, imagePromise]);
      
      console.log("AI 数据准备就绪，准备存入数据库...", { persona, imageUrl });

      // 3. 持久化存储 (无论是否有图，都要保存)
      await WorldService.saveWorld(userId, {
        profile,
        attrs,
        logs: JSON.stringify(simLogs),
        preStory,
        parallelDecision,
        personaLabel: persona?.personaLabel || `维度 #${Math.floor(Math.random()*999)}`,
        summary: persona?.oneLiner || "一段隐秘的平行记忆",
        moments: persona?.moments || ["一段不凡的人生路径"],
        imageUrl: imageUrl || undefined
      });
      
      console.log("存储成功！跳转至 Hub");
      setAppState('hub');
    } catch (e) {
      console.error("定格过程发生致死性错误:", e);
      alert("量子纠缠不稳定，定格失败。请重试。");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-screen text-white bg-black max-w-md mx-auto relative overflow-hidden select-none" style={{ backgroundColor: '#000' }}>
      
      {/* 扫略线动画 */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-purple-500/10 z-[60] pointer-events-none animate-[scanline_8s_linear_infinite]" style={{ animation: 'scanline 8s linear infinite' }} />
      <style>{`@keyframes scanline { 0% { transform: translateY(-100vh); } 100% { transform: translateY(100vh); } }`}</style>

      {/* 顶部属性栏 (推演模式) */}
      <AnimatePresence>
        {(appState === 'simulating' || appState === 'finished') && (
          <motion.header initial={{ y: -100 }} animate={{ y: 0 }} className="fixed top-0 inset-x-0 pt-12 pb-4 px-4 bg-black/80 backdrop-blur-xl z-[100] grid grid-cols-5 gap-1.5 border-b border-white/5">
             {['wealth', 'intellect', 'happiness', 'stress', 'social'].map(key => (
               <div key={key} className="bg-neutral-900/50 rounded-2xl p-2.5 flex flex-col items-center border border-white/5 shadow-inner">
                 <Icon name={key==='wealth'?'coins':key==='intellect'?'brain':key==='happiness'?'heart':key==='stress'?'fire':'user'} size={14} className="text-purple-500 mb-1" />
                 <span className="text-[13px] font-black">{attrs[key]}</span>
               </div>
             ))}
          </motion.header>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto no-scrollbar relative z-10" style={{ paddingBottom: '7rem' }} ref={scrollRef}>
        <AnimatePresence mode="wait">
          {appState === 'init' && (
            <motion.div key="init" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-7 pt-16 space-y-8 flex flex-col items-center min-h-full">
              
              {/* 复刻核心卡片容器：对齐原图 V8.0 */}
              <div style={V8_STYLE.glassPanel} className="w-full p-8 space-y-8 animate-in slide-in-from-bottom-8">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 italic leading-none text-neutral-400">GENAI CORE V8.0</span>
                  <button onClick={()=>setAppState('profile')} className="opacity-40 hover:opacity-100 transition-opacity"><Icon name="settings" size={16} /></button>
                </div>

                {/* 前传文本域：复刻深邃内阴影 */}
                <div className="relative group">
                  <textarea 
                    value={preStory} 
                    onChange={e=>setPreStory(e.target.value)} 
                    placeholder="记录那次决策发生时的具体情境..." 
                    style={V8_STYLE.input}
                    className="w-full h-28 outline-none resize-none transition-all focus:border-purple-500/30"
                  />
                  <button onClick={()=>handleBeautify('preStory')} className="absolute bottom-3 right-3 p-2 bg-purple-600/60 rounded-xl opacity-0 group-hover:opacity-100 transition-all active:scale-90 shadow-lg"><Icon name="fire" size={14} className="text-white"/></button>
                </div>

                {/* 岁数滑动条：18px 紫色光球 + 2px 白边 + 15px 发光 */}
                <div className="p-6 bg-black/40 rounded-[2rem] border border-white/5 space-y-4" style={{ boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.4)' }}>
                  <div className="flex justify-between items-baseline px-1">
                    <label className="text-[10px] font-black opacity-30 italic leading-none uppercase tracking-widest">分歧发生岁数</label>
                    <span className="text-2xl font-black italic text-purple-500 tracking-tighter">{branchAge}岁</span>
                  </div>
                  <div className="relative flex items-center h-4 px-1.5">
                     <input 
                       type="range" min="1" max={userCurrentAge-1} value={branchAge} 
                       onChange={e=>setBranchAge(parseInt(e.target.value))} 
                       className="w-full h-[4px] bg-white/10 rounded-full appearance-none cursor-pointer outline-none transition-all"
                       style={{ WebkitAppearance: 'none' }}
                     />
                     <style>{`
                       input[type=range]::-webkit-slider-thumb {
                         -webkit-appearance: none; height: 18px; width: 18px; 
                         border-radius: 50%; background: #A855F7; border: 2.5px solid #fff;
                         box-shadow: 0 0 15px #A855F7; cursor: pointer;
                         margin-top: -1px; transition: all 0.2s;
                       }
                       input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.2); box-shadow: 0 0 25px #A855F7; }
                     `}</style>
                  </div>
                </div>

                {/* 对比轨迹输入 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <textarea 
                      value={realityDecision} onChange={e=>setRealityDecision(e.target.value)} 
                      placeholder="现实决策轨迹" 
                      style={{ ...V8_STYLE.input, height: '6rem', padding: '1.25rem' }}
                      className="w-full outline-none resize-none"
                    />
                    <button onClick={()=>handleBeautify('realityDecision')} className="absolute bottom-2 right-2 p-1.5 bg-purple-600/40 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Icon name="fire" size={10} className="text-white"/></button>
                  </div>
                  <div className="relative group">
                    <textarea 
                      value={parallelDecision} onChange={e=>setParallelDecision(e.target.value)} 
                      placeholder="平行选择切入" 
                      style={{ ...V8_STYLE.input, height: '6rem', padding: '1.25rem' }}
                      className="w-full outline-none resize-none"
                    />
                    <button onClick={()=>handleBeautify('parallelDecision')} className="absolute bottom-2 right-2 p-1.5 bg-purple-600/40 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Icon name="fire" size={10} className="text-white"/></button>
                  </div>
                </div>

                {/* 激活按钮：复刻紫色渐变胶囊 */}
                <div className="pt-2">
                  <button 
                    onClick={startSim} 
                    style={V8_STYLE.btnPrimary}
                    className="w-full active:scale-[0.97] transition-all transform uppercase tracking-[0.2em]"
                  >
                    激活全息推演
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {(appState === 'simulating' || appState === 'finished') && (
            <motion.div key="sim" className="p-7 pt-32 space-y-12">
                {simLogs.map((log, i) => (
                    <div key={i} className="p-8 glass-panel border border-white/5 rounded-[2.5rem] bg-neutral-900/40 backdrop-blur-2xl animate-in slide-in-from-bottom-6 duration-500">
                        <div className="flex justify-between items-center mb-6 opacity-30 text-white tracking-widest">
                          <span className="text-[10px] font-black uppercase italic">YEAR {getSimYear(log.age)} · AGE {log.age}</span>
                        </div>
                        <div className="text-[15px] leading-relaxed font-light text-neutral-200 italic">{log.content}</div>
                    </div>
                ))}
                {isThinking && (
                  <div className="flex flex-col gap-4 pl-8 animate-pulse">
                    <div className="text-[10px] font-black uppercase text-purple-500 tracking-[0.4em]">DeepSeek 构建中...</div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-purple-600 to-transparent w-2/3 animate-[shimmer_2s_infinite]" /></div>
                  </div>
                )}
                <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }`}</style>
                {appState === 'finished' && (
                    <div className="p-10 border-2 border-dashed border-purple-500/20 rounded-[3rem] bg-purple-950/10 text-center space-y-8">
                        <h3 className="text-2xl font-black italic tracking-tighter uppercase">时空收束完毕</h3>
                        <button 
                          onClick={saveToWorld} 
                          disabled={isThinking}
                          className="w-full h-16 bg-purple-600 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          {isThinking && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                          {isThinking ? "正在上传维度记录..." : "定格此世并视觉成像"}
                        </button>
                    </div>
                )}
            </motion.div>
          )}

          {appState === 'profile' && (
            <motion.div key="profile" className="p-8 pt-20">
               <div style={V8_STYLE.glassPanel} className="p-8 space-y-8 text-center">
                  <div className="w-20 h-20 bg-purple-600 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl shadow-purple-500/40 border border-white/20"><Icon name="user" size={40}/></div>
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">资料局 · 基因基座</h3>
                  <div className="space-y-5 text-left">
                     {/* 第一行：观察代号 + 出生年 */}
                     <div className="grid grid-cols-2 gap-4">
                       <InputBox label="观察代号" val={profile.name} onChange={v=>setProfile({...profile, name: v})} />
                       <InputBox label="出生年" val={profile.birthYear} type="number" onChange={v=>setProfile({...profile, birthYear: parseInt(v) || 1990})} />
                     </div>
                     {/* 第二行：行业领域（下拉） + 岗位描述 */}
                     <div className="grid grid-cols-2 gap-4">
                       <SelectBox label="行业领域" val={profile.industry} onChange={v=>setProfile({...profile, industry: v})} options={['互联网/IT', '金融', '教育', '医疗', '制造业', '建筑/地产', '文化/传媒', '政府/事业单位', '农业', '自由职业', '其他']} />
                       <InputBox label="岗位描述" val={profile.jobRole} onChange={v=>setProfile({...profile, jobRole: v})} />
                     </div>
                     {/* 第三行：籍贯/家乡 + 童年底色（下拉） */}
                     <div className="grid grid-cols-2 gap-4">
                       <InputBox label="籍贯/家乡" val={profile.hometown} onChange={v=>setProfile({...profile, hometown: v})} />
                       <SelectBox label="童年底色" val={profile.childhoodVibe} onChange={v=>setProfile({...profile, childhoodVibe: v})} options={['城市精英', '县城小康', '乡镇平凡', '农村清贫', '海外背景', '军旅家庭', '单亲成长', '留守儿童']} />
                     </div>
                     {/* 第四行：性格倾向（下拉） + 学历 */}
                     <div className="grid grid-cols-2 gap-4">
                       <SelectBox label="性格倾向" val={profile.personality || '内敛沉稳'} onChange={v=>setProfile({...profile, personality: v})} options={['内敛沉稳', '外向活泼', '理性冷静', '感性浪漫', '冒险激进', '保守稳健', '社交达人', '独行侠客']} />
                       <SelectBox label="最高学历" val={profile.education || '本科'} onChange={v=>setProfile({...profile, education: v})} options={['初中及以下', '高中/中专', '大专', '本科', '硕士', '博士', '海归硕博']} />
                     </div>
                     {/* 第五行：家庭状况 + 人生信条 */}
                     <div className="grid grid-cols-2 gap-4">
                       <SelectBox label="家庭状况" val={profile.familyStatus || '未婚'} onChange={v=>setProfile({...profile, familyStatus: v})} options={['未婚', '已婚无子', '已婚有子', '离异', '丧偶']} />
                       <InputBox label="人生信条" val={profile.motto || ''} onChange={v=>setProfile({...profile, motto: v})} placeholder="一句话概括你的人生哲学" />
                     </div>
                     <button onClick={()=>setAppState('init')} style={{ ...V8_STYLE.btnPrimary, background: '#fff', color: '#000', height: '3.5rem', width: '100%', marginTop: '1.5rem', fontSize: '0.8rem' }}>保存基因档案</button>
                  </div>
               </div>
            </motion.div>
          )}

          {appState === 'hub' && (
            <motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-full">
              {activeWorld ? (
                <WorldDetail world={activeWorld} onBack={() => setActiveWorld(null)} />
              ) : (
                <WorldHub 
                  userId={userId} 
                  onSelectWorld={(w) => setActiveWorld(w)} 
                  onStartNew={() => setAppState('init')} 
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 底部导航栏：1:1 风格同步 */}
      <nav 
        style={{ 
          position: 'fixed', bottom: '0', left: '50%', transform: 'translateX(-50%)', width: '100%', 
          height: '6.5rem', background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(40px)', 
          borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', 
          justifyContent: 'space-around', alignItems: 'center', zIndex: 100,
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.9)'
        }}
      >
        <TabBtn active={appState==='init'||appState==='simulating'} icon="home" label="首页" onClick={()=>setAppState('init')} />
        <TabBtn icon="timeline" label="时间轴" />
        <TabBtn active={appState==='hub'} icon="world" label="世界" onClick={()=>setAppState('hub')} />
        <TabBtn icon="message" label="通讯" />
        <TabBtn active={appState==='profile'} icon="user" label="我的" onClick={()=>setAppState('profile')} />
      </nav>

      {/* 命运决策弹窗 */}
      {currentPivot && (
        <div className="fixed inset-0 z-[2000] bg-black/98 flex items-center justify-center p-8 backdrop-blur-xl animate-in fade-in duration-500">
            <div style={V8_STYLE.glassPanel} className="w-full max-w-sm p-10 space-y-10 text-center animate-in zoom-in-95 border-purple-500/30">
                <div className="space-y-2"><h3 className="text-2xl font-black text-purple-400 italic tracking-tighter leading-none">{currentPivot.title}</h3><p className="text-[8px] opacity-30 font-black tracking-[0.4em] uppercase">Decision Required</p></div>
                <div className="space-y-4">
                    {currentPivot.options.map((opt, i) => (
                        <button key={i} onClick={()=>handleChoice(opt)} className="w-full p-7 bg-white/5 border border-white/10 rounded-[2rem] text-left active:bg-purple-600/40 active:scale-[0.98] transition-all group shadow-inner">
                            <p className="text-[15px] font-black group-active:text-white transition-colors">{opt.text}</p>
                            <p className="text-[12px] opacity-40 italic mt-2 leading-relaxed">{opt.desc}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${active ? 'text-purple-500 scale-110 font-black' : 'text-neutral-700 hover:text-neutral-500'}`} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
      <Icon name={icon} size={22} className={active ? "drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" : ""} />
      <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{label}</span>
    </button>
  );
}

function InputBox({ label, val, onChange, type="text", placeholder="" }) {
  return (
    <div className="space-y-2 text-left">
      <label className="text-[10px] font-black uppercase opacity-30 ml-1 italic tracking-widest">{label}</label>
      <input type={type} value={val} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ ...V8_STYLE.input, height: '3rem', lineHeight: '3rem', padding: '0 1.25rem' }} className="w-full outline-none" />
    </div>
  );
}

function SelectBox({ label, val, onChange, options = [] }) {
  return (
    <div className="space-y-2 text-left">
      <label className="text-[10px] font-black uppercase opacity-30 ml-1 italic tracking-widest">{label}</label>
      <select 
        value={val} 
        onChange={e=>onChange(e.target.value)} 
        style={{
          backgroundColor: '#0c0c0e',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '1.5rem',
          padding: '0 1.25rem',
          fontSize: '12px',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
          color: '#e5e7eb',
          appearance: 'none',
          WebkitAppearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a855f7' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 1rem center',
          paddingRight: '2.5rem',
          height: '3rem',
          lineHeight: '3rem',
        }}
        className="w-full outline-none cursor-pointer"
      >
        {options.map(opt => <option key={opt} value={opt} style={{ background: '#0c0c0e', color: '#e5e7eb' }}>{opt}</option>)}
      </select>
    </div>
  );
}
