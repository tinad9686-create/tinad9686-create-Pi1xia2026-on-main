import React, { useState } from 'react';
import { Video } from '../types';
import { generateId } from '../utils';
import { MessageCircle, Send, Plus, X, Shield, Users, LogOut, Trash2, Maximize, Zap, Smartphone, Rocket, Activity, Mail, Instagram, Twitter, Building } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface VideoHubViewProps {
  videos: Video[];
  setVideos: React.Dispatch<React.SetStateAction<Video[]>>;
}

export default function VideoHubView({ videos, setVideos }: VideoHubViewProps) {
  const { currentUser, allUsers, login, logout, updateUserStatus } = useAuth();
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [videoExpiration, setVideoExpiration] = useState<string>('never');
  
  const [loginUsername, setLoginUsername] = useState('');
  const [loginRole, setLoginRole] = useState<'owner' | 'director' | 'coach'>('coach');
  const [passwordOrLicense, setPasswordOrLicense] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showAuthTooltip, setShowAuthTooltip] = useState(false);
  const [showOwnerLogin, setShowOwnerLogin] = useState(false);
  const [ownerUsername, setOwnerUsername] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginUsername.trim()) return;
    const result = login(loginUsername.trim(), loginRole, passwordOrLicense);
    if (!result.success && result.error) {
      setLoginError(result.error);
      return;
    }
    setLoginUsername('');
    setPasswordOrLicense('');
  };

  const handleOwnerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const result = login(ownerUsername.trim(), 'owner', ownerPassword);
    if (!result.success && result.error) {
      setLoginError(result.error);
      return;
    }
    setOwnerUsername('');
    setOwnerPassword('');
    setShowOwnerLogin(false);
  };

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoTitle.trim() || !newVideoUrl.trim() || !currentUser) return;

    // Convert standard youtube URLs to embed urls if user pasted normal links
    let embedUrl = newVideoUrl.trim();
    if (embedUrl.includes('youtube.com/watch?v=')) {
      embedUrl = embedUrl.replace('watch?v=', 'embed/');
    } else if (embedUrl.includes('youtu.be/')) {
      embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
    } else if (embedUrl.includes('youtube.com/shorts/')) {
      embedUrl = embedUrl.replace('youtube.com/shorts/', 'youtube.com/embed/');
    }
    
    // Setup parameters for youtube videos (enable controls)
    if (embedUrl.includes('youtube.com/embed/')) {
      const separator = embedUrl.includes('?') ? '&' : '?';
      embedUrl = `${embedUrl}${separator}controls=1&modestbranding=1&rel=0`;
    }

    let expiresAt: number | undefined;
    if (videoExpiration === '4hours') {
      expiresAt = Date.now() + 4 * 60 * 60 * 1000;
    } else if (videoExpiration === '1day') {
      expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    } else if (videoExpiration === '7days') {
      expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    }

    setVideos(prev => [
      {
        id: generateId(),
        title: newVideoTitle.trim(),
        url: embedUrl,
        uploaderId: currentUser.id,
        uploaderName: currentUser.username,
        comments: [],
        expiresAt
      },
      ...prev
    ]);
    
    setNewVideoTitle('');
    setNewVideoUrl('');
    setVideoExpiration('never');
    setIsAddingVideo(false);
  };

  const handleDeleteVideo = (videoId: string) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      setVideos(prev => prev.filter(v => v.id !== videoId));
    }
  };

  const handleAddComment = (videoId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = newComment[videoId];
    if (!text?.trim()) return;
    
    const authorName = currentUser ? currentUser.username : 'Anonymous Fan';

    setVideos(prev => prev.map(v => {
      if (v.id === videoId) {
        return {
          ...v,
          comments: [
            ...v.comments,
            { id: generateId(), author: authorName, text: text.trim(), timestamp: new Date() }
          ]
        };
      }
      return v;
    }));

    setNewComment(prev => ({ ...prev, [videoId]: '' }));
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      
      {/* Hero Section */}
      <div className="px-2 pt-6 pb-8 text-center flex flex-col items-center">
        <h1 className="text-5xl sm:text-[5rem] font-black uppercase leading-[0.85] tracking-tighter mix-blend-multiply mb-10 w-full drop-shadow-sm break-words" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          <span className="text-[#A39A96] block text-center">DON'T JUST</span>
          <span className="text-[#A39A96] block text-center mb-1">PLAY.</span>
          <span className="text-[#4DAA2B] block text-center">OUTSMART</span>
          <span className="text-[#4DAA2B] block text-center">THE GAME.</span>
        </h1>
        
        <div className="w-full text-left">
          <div className="mt-8">
            <div className="bg-[#BD9F53] rounded-[2rem] sm:rounded-[2.5rem] px-5 py-6 sm:p-10 flex flex-col shadow-sm relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full border-[3px] border-[#A2A48E]/50 bg-[#A2A48E]/40" />
              <div className="absolute -bottom-12 -right-8 w-48 h-48 rounded-full border-[3px] border-[#A2A48E]/50 bg-[#A2A48E]/40" />
              
              <div className="relative z-10">
                <h3 className="text-2xl sm:text-[2.2rem] font-black tracking-tight text-white mb-6 sm:mb-8 px-1">Key Features</h3>
                
                <div className="flex flex-col gap-2 sm:gap-4">
                  {/* Feature 1 */}
                  <div className="bg-[#F0FAFD] border-[1.5px] border-[#BDEAF8] rounded-2xl sm:rounded-3xl px-3 sm:px-6 py-3 sm:py-5 flex items-start gap-2 sm:gap-4 shadow-sm">
                    <Zap className="flex-shrink-0 w-4 h-4 sm:w-6 sm:h-6 mt-0.5 text-[#7CBFCD]" />
                    <div className="flex flex-col gap-0.5 sm:gap-1.5 w-full">
                      <span className="font-black text-[10px] sm:text-[13px] tracking-widest uppercase text-[#156D84]">Zero Friction Setup</span>
                      <span className="font-medium text-[12px] sm:text-[15px] leading-snug text-[#156D84]/80 pr-1">Launch and manage brackets instantly with no complex training required.</span>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="bg-[#FFF8EE] border-[1.5px] border-[#F6E3B4] rounded-2xl sm:rounded-3xl px-3 sm:px-6 py-3 sm:py-5 flex items-start gap-2 sm:gap-4 shadow-sm">
                    <Smartphone className="flex-shrink-0 w-4 h-4 sm:w-6 sm:h-6 mt-0.5 text-[#C7873D]" />
                    <div className="flex flex-col gap-0.5 sm:gap-1.5 w-full">
                      <span className="font-black text-[10px] sm:text-[13px] tracking-widest uppercase text-[#B15810]">Mobile-First Design</span>
                      <span className="font-medium text-[12px] sm:text-[15px] leading-snug text-[#B15810]/80 pr-1">Optimized for handheld devices so you can manage matches while on the move.</span>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="bg-[#FCF6FF] border-[1.5px] border-[#ECDBFA] rounded-2xl sm:rounded-3xl px-3 sm:px-6 py-3 sm:py-5 flex items-start gap-2 sm:gap-4 shadow-sm">
                    <Rocket className="flex-shrink-0 w-4 h-4 sm:w-6 sm:h-6 mt-0.5 text-[#AF6ADB]" />
                    <div className="flex flex-col gap-0.5 sm:gap-1.5 w-full">
                      <span className="font-black text-[10px] sm:text-[13px] tracking-widest uppercase text-[#7729C2]">100% Free & Lightweight</span>
                      <span className="font-medium text-[12px] sm:text-[15px] leading-snug text-[#7729C2]/80 pr-1">Skip the expensive, bloated legacy software and use a tool built for speed.</span>
                    </div>
                  </div>

                  {/* Feature 4 */}
                  <div className="bg-[#F1FDF6] border-[1.5px] border-[#BBF2D4] rounded-2xl sm:rounded-3xl px-3 sm:px-6 py-3 sm:py-5 flex items-start gap-2 sm:gap-4 shadow-sm">
                    <Activity className="flex-shrink-0 w-4 h-4 sm:w-6 sm:h-6 mt-0.5 text-[#6BCA94]" />
                    <div className="flex flex-col gap-0.5 sm:gap-1.5 w-full">
                      <span className="font-black text-[10px] sm:text-[13px] tracking-widest uppercase text-[#1C7840]">Real-Time On-Court Control</span>
                      <span className="font-medium text-[12px] sm:text-[15px] leading-snug text-[#1C7840]/80 pr-1">Seamlessly update scores, tracks draws, and keep your tournament moving smoothly.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end items-end mb-2 px-2 text-center pt-2">
        {(currentUser?.role === 'owner' || ((currentUser?.role === 'coach' || currentUser?.role === 'director') && currentUser?.status === 'approved')) && (
          <button 
            onClick={() => setIsAddingVideo(!isAddingVideo)}
            className="bg-[#AED743] hover:bg-[#9cc13c] text-[#173414] px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            {isAddingVideo ? <><X size={16} strokeWidth={3} /> Cancel</> : <><Plus size={16} strokeWidth={3} /> Add Video</>}
          </button>
        )}
      </div>

      {isAddingVideo && (currentUser?.role === 'owner' || ((currentUser?.role === 'coach' || currentUser?.role === 'director') && currentUser?.status === 'approved')) && (
        <form onSubmit={handleAddVideo} className="bg-[#F6EFE9] rounded-[2rem] shadow-sm border border-[#E5DACD] p-6 lg:p-8 space-y-4">
          <h3 className="font-bold text-[#5A4537] text-sm uppercase tracking-wide">Add New embedded Video</h3>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Video Title (e.g. Finals Highlight)" 
              value={newVideoTitle}
              onChange={e => setNewVideoTitle(e.target.value)}
              className="w-full border border-[#D8CCBD] bg-white/50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#AED743] hover:bg-white focus:bg-white focus:outline-none transition-colors"
              required
            />
            <input 
              type="url" 
              placeholder="YouTube URL (e.g. https://www.youtube.com/watch?v=...)" 
              value={newVideoUrl}
              onChange={e => setNewVideoUrl(e.target.value)}
              className="w-full border border-[#D8CCBD] bg-white/50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#AED743] hover:bg-white focus:bg-white focus:outline-none transition-colors"
              required
            />
            <div className="flex gap-2 items-center">
              <label className="text-sm font-bold text-[#5A4537]">Display Duration:</label>
              <select
                value={videoExpiration}
                onChange={e => setVideoExpiration(e.target.value)}
                className="flex-1 border border-[#D8CCBD] bg-white/50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#AED743] hover:bg-white focus:bg-white focus:outline-none transition-colors"
              >
                <option value="never">Permanent (Don't expire)</option>
                <option value="4hours">4 Hours</option>
                <option value="1day">1 Day</option>
                <option value="7days">7 Days</option>
              </select>
            </div>
            <p className="text-xs text-[#7D6C60] leading-relaxed">
              Paste a YouTube link. It will be converted into an embedded video for players to watch.<br/>
              <strong className="text-[#5A4537]">Note:</strong> When uploading to YouTube, make sure the video's visibility is set to <strong>Public</strong> or <strong>Unlisted</strong> so others can view it here.
            </p>
            <button 
              type="submit"
              className="w-full bg-[#1A4B29] hover:bg-[#13371e] text-white font-medium py-3 rounded-xl text-sm transition-colors shadow-sm"
            >
              Post Video
            </button>
          </div>
        </form>
      )}

      {videos.filter(v => !v.expiresAt || v.expiresAt > Date.now()).length === 0 ? (
        <div className="p-10 text-center bg-[#F6EFE9] border-2 border-dashed border-[#D8CCBD] rounded-[2rem] text-[#95887D] mt-8">
          <p className="font-medium text-lg">No videos uploaded yet.</p>
          <p className="text-sm mt-1">Check back later or upload your own!</p>
        </div>
      ) : (
        videos
          .filter(v => !v.expiresAt || v.expiresAt > Date.now())
          .map(video => (
          <div key={video.id} id={`video-container-${video.id}`} className="bg-[#F6EFE9] rounded-[2rem] shadow-sm border border-[#E5DACD] overflow-hidden group relative">
            {/* Video Embed */}
            <div className="aspect-video bg-black relative overflow-hidden">
              <iframe 
                src={video.url.includes('youtube.com/embed/') ? video.url.replace('controls=0', 'controls=1').replace('mute=1', 'mute=0') : video.url} 
                className="w-full h-full absolute inset-0 text-white flex items-center justify-center text-sm font-medium opacity-80 pointer-events-auto"
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>

              {/* Barrage Comments Overlay (Marquee) */}
              <div className="absolute inset-0 pt-10 pb-20 pointer-events-none z-20 overflow-hidden">
                 {video.comments.length > 0 && video.comments.map((comment, index) => (
                   <div 
                     key={comment.id} 
                     className="absolute whitespace-nowrap animate-marquee flex items-center px-4 py-2"
                     style={{ 
                       top: `${(index % 5) * 15 + 10}%`, 
                       animationDuration: `${10 + (index % 4) * 2}s`,
                       animationDelay: `${(index % 5) * 0.5}s`
                     }}
                   >
                     <span className="text-white font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-lg sm:text-xl">{comment.text}</span>
                   </div>
                 ))}
              </div>

              {/* Overlay with Comments Input and Controls */}
              <div className="absolute inset-x-0 bottom-0 top-[40%] flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" style={{ backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)' }}>
                <div className="flex flex-col justify-end pointer-events-auto w-full max-w-[280px]">
                   <form 
                     onSubmit={(e) => handleAddComment(video.id, e)}
                     className="flex gap-2 w-full max-w-[280px] group relative"
                   >
                     <input 
                       type="text" 
                       placeholder="Add a comment... (no sign-in needed)"
                       value={newComment[video.id] || ''}
                       onChange={e => setNewComment(prev => ({ ...prev, [video.id]: e.target.value }))}
                       className="flex-1 bg-white/95 border border-white/20 text-sm font-medium rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#AED743] hover:bg-white focus:bg-white focus:outline-none transition-colors shadow-lg text-[#1C1816]"
                     />
                     <button 
                       type="submit"
                       disabled={!newComment[video.id]?.trim()}
                       className="bg-[#1A4B29] text-white rounded-xl p-2.5 hover:bg-[#13371e] disabled:bg-[#A3978D] disabled:opacity-70 transition-all active:scale-95 shadow-lg shrink-0 flex items-center justify-center"
                     >
                       <Send size={16} />
                     </button>
                     <div className="absolute left-0 bottom-full mb-2 bg-[#1C1816] text-white text-[10px] px-2 py-1.5 font-bold rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 hidden md:block">
                       Anyone can comment! Just type and send.
                     </div>
                   </form>
                </div>
              </div>

              <div className="absolute top-0 right-0 left-0 p-4 pointer-events-none z-10 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
                <div>
                  {video.expiresAt && (
                     <p className="text-xs font-bold text-white bg-black/50 px-2 py-1 rounded backdrop-blur-sm shadow-sm border border-white/10">
                       Expires in {Math.max(1, Math.round((video.expiresAt - Date.now()) / (1000 * 60 * 60)))}h
                     </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-end gap-2 pointer-events-auto">
                    <button 
                      onClick={() => {
                        const container = document.getElementById(`video-container-${video.id}`);
                        if (container) {
                          if (document.fullscreenElement) {
                            document.exitFullscreen();
                          } else {
                            container.requestFullscreen();
                          }
                        }
                      }}
                      className="text-white hover:text-[#AED743] p-2.5 transition-colors rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md shadow-sm border border-white/10"
                      title="Fullscreen"
                    >
                      <Maximize size={16} />
                    </button>
                    {(currentUser?.role === 'owner') && (
                      <button 
                        onClick={() => handleDeleteVideo(video.id)}
                        className="text-white hover:text-red-400 p-2.5 transition-colors rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md shadow-sm border border-white/10"
                        title="Delete Video"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Auth Section */}
      <div className="bg-white/20 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-5 sm:p-6 mt-6 relative z-30">
        {/* Subtle inner glow to enhance glass effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50 pointer-events-none rounded-[2rem]"></div>
        <div className="relative z-10">
        {!currentUser ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex justify-between items-center pr-1">
              <h3 className="font-bold text-[#5A4537] text-sm uppercase tracking-wide">Sign In to Add Your Video</h3>
              <div className="relative flex items-center justify-center">
                <button 
                  type="button"
                  onClick={() => setShowAuthTooltip(!showAuthTooltip)}
                  onMouseEnter={() => setShowAuthTooltip(true)}
                  onMouseLeave={() => setShowAuthTooltip(false)}
                  className="bg-[#E5DACD] hover:bg-[#D8CCBD] text-[#5A4537] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold transition-colors focus:outline-none"
                >
                  ?
                </button>
                {showAuthTooltip && (
                  <div 
                    onClick={() => setShowAuthTooltip(false)}
                    className="absolute bottom-full right-0 mb-2 w-48 sm:w-56 bg-[#1C1816] text-white text-xs p-2.5 rounded-lg shadow-xl z-50 cursor-pointer leading-relaxed animate-in fade-in zoom-in-95 duration-200"
                  >
                    Anyone can comment without an account. You only need to sign in and be approved to upload your own video.
                  </div>
                )}
              </div>
            </div>
            
            {loginError && (
              <div className="bg-red-50 text-red-600 p-2 rounded-lg text-sm border border-red-100">
                {loginError}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              <input 
                type="text" 
                placeholder="Choose a username..." 
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                className="flex-1 border border-[#D8CCBD] bg-white/50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#AED743] hover:bg-white focus:bg-white focus:outline-none transition-colors"
                required
              />
              <select 
                value={loginRole} 
                onChange={(e: any) => setLoginRole(e.target.value)}
                className="border border-[#D8CCBD] bg-white/50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#AED743] hover:bg-white focus:bg-white focus:outline-none transition-colors hidden sm:block"
              >
                <option value="coach">Coach (Other App Member)</option>
                <option value="director">Tournament Director</option>
              </select>
              <input 
                type="text"
                placeholder="App License #" 
                value={passwordOrLicense}
                onChange={e => setPasswordOrLicense(e.target.value)}
                className="flex-1 border border-[#D8CCBD] bg-white/50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#AED743] hover:bg-white focus:bg-white focus:outline-none transition-colors"
                required
              />
              <button 
                type="submit"
                className="bg-[#1A4B29] hover:bg-[#13371e] text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap shadow-sm"
              >
                Sign In
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${currentUser.role === 'owner' ? 'bg-[#BC9F5E] text-white shadow-sm' : 'bg-[#E07A5F] text-white shadow-sm'}`}>
                {currentUser.role === 'owner' ? <Shield size={18} /> : <Users size={18} />}
              </div>
              <div>
                <p className="text-sm font-bold text-[#5A4537]">{currentUser.username}</p>
                <p className="text-xs text-[#7D6C60] capitalize">{currentUser.role} Account</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="text-[#95887D] hover:text-[#E07A5F] p-2 transition-colors rounded-xl hover:bg-white/50"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Upgrade Notice */}
      <div className="mt-6 bg-gradient-to-br from-[#8E9CA3] via-[#D9AD6A] to-[#DF8D79] rounded-[1.5rem] p-4 sm:p-5 text-left border border-white/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-50 pointer-events-none rounded-[1.5rem]"></div>
        <div className="relative z-10">
          <h4 className="font-bold text-white flex items-center gap-2 mb-2 text-base sm:text-lg tracking-tight drop-shadow-sm">
            <span className="text-xl">🤖</span> Do you have the best partner for your game?
          </h4>
          <p className="text-white/95 font-medium text-[14px] sm:text-[15px] leading-relaxed mb-0 drop-shadow-sm">
            Let AI analyze your team dynamics. <a href="https://ascepd.com" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-[#F8FDF0] transition-colors">Pi1xia AI</a> assesses your individual skill levels and personalizes a growth plan so you and your partner can truly master the court together.
          </p>
        </div>
      </div>

      {/* Support Section */}
      <div className="bg-[#E2F1C3]/10 backdrop-blur-xl bg-gradient-to-br from-white/40 to-[#E2F1C3]/20 rounded-[1.5rem] p-4 sm:p-5 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-2 text-center sm:text-left relative overflow-hidden mt-4">
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-50 pointer-events-none rounded-[1.5rem]"></div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#E2F1C3]/40 to-transparent blur-3xl rounded-full" />
        
        <div className="relative z-10 w-full">
          <h3 className="text-lg sm:text-xl font-bold text-[#1C1816] tracking-tight leading-[1.1]">
            Questions? Let's Chat.
          </h3>
        </div>

        <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-1 relative z-10">
          <div className="bg-white border border-[#E5E0DA] rounded-full p-2 shadow-sm">
            <Mail size={16} className="text-[#A39A96] fill-[#A39A96]" strokeWidth={1} />
          </div>
          <a href="mailto:ascepd.pi1xia@gmail.com" className="font-bold text-[#5A4537] text-sm hover:text-[#AED743] transition-colors tracking-tight">
            ascepd.pi1xia@gmail.com
          </a>
        </div>
      </div>

      {currentUser?.role === 'owner' && (
        <div className="bg-[#BC9F5E]/10 border border-[#BC9F5E]/30 rounded-[2rem] p-6 shadow-sm text-sm space-y-4 mt-8">
          <h3 className="font-bold text-[#6D5A2E] flex items-center gap-2 text-base">
            <Shield size={18} /> Owner Dashboard
          </h3>
          <p className="text-[#6D5A2E]"><strong>Total Registered Users:</strong> {allUsers.length}</p>

          {/* Pending Approvals Section */}
          <div className="bg-white/60 rounded-[1.5rem] border border-[#BC9F5E]/20 p-4">
            <p className="font-bold text-xs text-[#6D5A2E] uppercase tracking-wider mb-3">Pending Access Requests</p>
            {allUsers.filter(u => u.status === 'pending').length === 0 ? (
               <p className="text-xs text-[#8A7954] italic">No pending requests.</p>
            ) : (
               <ul className="space-y-3">
                 {allUsers.filter(u => u.status === 'pending').map(u => (
                    <li key={`pending-${u.id}`} className="flex justify-between items-center text-xs bg-white/40 p-2.5 rounded-xl border border-white/50">
                      <div>
                        <span className="font-bold text-[#5A4537]">{u.username}</span>
                        <span className="ml-2 text-[#6D5A2E] bg-[#BC9F5E]/20 px-2 py-0.5 rounded-md capitalize font-medium">{u.role}</span>
                        {u.licenseNumber && <span className="ml-2 text-[#8A7954]">License: {u.licenseNumber}</span>}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => updateUserStatus(u.id, 'approved')}
                          className="bg-[#AED743] hover:bg-[#9cc13c] text-[#173414] font-medium px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                        >Approve</button>
                      </div>
                    </li>
                 ))}
               </ul>
            )}
          </div>

          {/* Video Log Section */}
          <div className="bg-white/60 rounded-[1.5rem] border border-[#BC9F5E]/20 p-4 max-h-40 overflow-y-auto">
            <p className="font-bold text-xs text-[#6D5A2E] uppercase tracking-wider mb-3">Video Upload Log</p>
            {videos.filter(v => v.uploaderName).length === 0 ? (
              <p className="text-xs text-[#8A7954] italic">No user-uploaded videos yet.</p>
            ) : (
              <ul className="space-y-2 text-xs text-[#5A4537]">
                {videos.filter(v => v.uploaderName).map(v => (
                  <li key={`log-${v.id}`} className="flex justify-between items-center bg-white/40 p-2 rounded-lg border border-white/50">
                    <span className="font-medium truncate pr-2 max-w-[60%]">{v.title}</span>
                    <span className="text-[#6D5A2E] font-medium bg-[#BC9F5E]/20 px-2 py-0.5 rounded-md">by {v.uploaderName}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {(currentUser?.status === 'pending') && (
        <div className="bg-[#DFECB7]/40 border border-[#DFECB7] rounded-[2rem] p-6 shadow-sm text-sm text-[#1A4B29] mt-8">
          <strong>Pending Approval:</strong> Your {currentUser.role} account is pending approval from the Tournament Director. Once approved, you will be able to comment and upload videos.
        </div>
      )}

      {/* Copyright Footer (Terms) */}
      <div className="text-[#7D6C60] pt-4 pb-4 text-center flex flex-col gap-4 w-full">
        <div className="flex justify-center gap-6 text-[10px] sm:text-[11px] font-black tracking-widest text-[#7D6C60]">
          <a href="#" className="hover:text-[#5A4537] transition-colors">TERMS</a>
          <a href="#" className="hover:text-[#5A4537] transition-colors">PRIVACY</a>
          <a href="#" className="hover:text-[#5A4537] transition-colors">WAIVER</a>
        </div>

        <div className="flex justify-center items-center gap-6 opacity-80 mb-2">
          <a href="#" className="text-[#7D6C60] hover:text-[#5A4537] transition-all hover:scale-110">
            <Twitter size={20} fill="currentColor" strokeWidth={0} />
          </a>
          <a href="#" className="text-[#7D6C60] hover:text-[#5A4537] transition-all hover:scale-110">
            <Instagram size={22} strokeWidth={2} />
          </a>
          <a href="#" className="text-[#7D6C60] hover:text-[#5A4537] transition-all hover:scale-110">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.589 6.686a4.793 4.793 0 01-3.966-1.898 4.765 4.765 0 01-.63-2.788h-3.418v16.147a5.008 5.008 0 01-5.02 4.975 5.008 5.008 0 01-5.02-4.975 5.008 5.008 0 015.02-4.975c.074 0 .148.002.222.006v3.541a1.536 1.536 0 00-.222-.016 1.58 1.58 0 00-1.583 1.565 1.58 1.58 0 001.583 1.565 1.58 1.58 0 001.583-1.565V0h3.541a8.196 8.196 0 002.408 5.753 8.188 8.188 0 005.502 2.148V11.4a11.666 11.666 0 01-3.456-.632v-4.082z"/>
            </svg>
          </a>
        </div>
        
        <div className="mt-auto pt-4 pb-6 text-center select-none opacity-90 print:hidden w-full px-2 overflow-hidden">
          <p className="text-[#C49A4C] text-[10px] sm:text-xs font-bold tracking-widest uppercase break-words inline">
            © 2026 ASCEP WELL-BEING DESIGN. ALL RIGHTS RESERVED.
          </p>
          {!currentUser && (
            <button 
              onClick={() => setShowOwnerLogin(true)}
              className="text-lg font-bold text-[#D8CCBD] hover:text-[#A3978D] focus:outline-none transition-colors ml-1 inline"
            >
              $
            </button>
          )}
        </div>
      </div>

      {/* Owner Login Modal */}
      {showOwnerLogin && !currentUser && (
        <div className="fixed inset-0 bg-[#5A4537]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#F6EFE9] rounded-[2rem] shadow-2xl p-8 max-w-sm w-full relative border border-[#E5DACD]">
            <button 
              onClick={() => { setShowOwnerLogin(false); setLoginError(''); }}
              className="absolute top-5 right-5 text-[#A3978D] hover:text-[#5A4537] transition-colors"
            >
              <X size={24} strokeWidth={2.5} />
            </button>
            <h3 className="font-black text-[#5A4537] text-xl mb-6 flex items-center gap-2">
              <Shield size={24} className="text-[#BC9F5E]" /> Director Access
            </h3>
            
            {loginError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 mb-5 font-medium">
                {loginError}
              </div>
            )}
            
            <form onSubmit={handleOwnerLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7D6C60] uppercase tracking-wider mb-2">Username</label>
                <input 
                  type="text" 
                  value={ownerUsername}
                  onChange={e => setOwnerUsername(e.target.value)}
                  className="w-full border border-[#D8CCBD] bg-white/50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#AED743] hover:bg-white focus:bg-white focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#7D6C60] uppercase tracking-wider mb-2">Password</label>
                <input 
                  type="password" 
                  placeholder="Enter director password" 
                  value={ownerPassword}
                  onChange={e => setOwnerPassword(e.target.value)}
                  className="w-full border border-[#D8CCBD] bg-white/50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#AED743] hover:bg-white focus:bg-white focus:outline-none transition-colors"
                  required
                />
              </div>
              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-[#BC9F5E] hover:bg-[#a68c51] text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
                >
                  Access Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
