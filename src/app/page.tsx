'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, FileText, Search, Plus, Loader2, Trash2, Mic, Square, Volume2, X } from 'lucide-react';
import type { Message, Conversation, Role } from '@/types';

// ── Inline AudioRecorder ──────────────────────────────────────────────────────
function AudioRecorder({ onRecordingComplete, disabled }: { onRecordingComplete: (b: Blob) => void; disabled?: boolean }) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        onRecordingComplete(new Blob(chunksRef.current, { type: 'audio/webm' }));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch { alert('Could not access microphone.'); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <button
      type="button"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
        isRecording
          ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse'
          : 'bg-white/5 border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-400/50'
      }`}
    >
      {isRecording ? <Square className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-cyan-400" />}
    </button>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ message, highlight }: { message: Message; highlight?: string }) {
  const isDoctor = message.role === 'DOCTOR';

  const highlightText = (text: string, term?: string) => {
    if (!term) return <>{text}</>;
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return <>{parts.map((p, i) => p.toLowerCase() === term.toLowerCase()
      ? <mark key={i} className="bg-cyan-400/30 text-cyan-200 rounded px-0.5">{p}</mark>
      : p
    )}</>;
  };

  const playAudio = () => { if (message.audioUrl) new Audio(message.audioUrl).play(); };
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex w-full mb-4 ${isDoctor ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[78%] ${isDoctor ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`flex items-center gap-2 px-1 ${isDoctor ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: isDoctor ? '#22d3ee' : '#a78bfa' }}>
            {isDoctor ? '⚕ Doctor' : '✦ Patient'}
          </span>
          <span className="text-[10px] text-white/30">{time}</span>
        </div>

        <div className={`relative rounded-2xl px-4 py-3 ${
          isDoctor
            ? 'bg-gradient-to-br from-cyan-950/80 to-blue-950/80 border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
            : 'bg-gradient-to-br from-violet-950/80 to-purple-950/80 border border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.1)]'
        }`}>
          <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
            {highlightText(message.originalText, highlight)}
          </p>

          {message.translatedText && (
            <div className={`mt-2 pt-2 border-t ${isDoctor ? 'border-cyan-500/20' : 'border-violet-500/20'}`}>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: isDoctor ? '#67e8f9' : '#c4b5fd' }}>
                → {message.targetLang === 'hi' ? 'Hindi' : 'English'}
              </p>
              <p className="text-sm italic text-white/60 leading-relaxed">
                {highlightText(message.translatedText, highlight)}
              </p>
            </div>
          )}

          {message.audioUrl && (
            <button onClick={playAudio} className="mt-2 flex items-center gap-1.5 text-xs text-white/40 hover:text-cyan-400 transition-colors">
              <Volume2 className="w-3 h-3" /> Play recording
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Summary Dialog ────────────────────────────────────────────────────────────
function SummaryDialog({ open, onClose, summary }: { open: boolean; onClose: () => void; summary: any }) {
  if (!open || !summary) return null;
  const Section = ({ icon, title, items, empty }: { icon: string; title: string; items: string[]; empty: string }) => (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-3">{icon} {title}</h3>
      {items.length === 0
        ? <p className="text-sm text-white/30 italic">{empty}</p>
        : <ul className="space-y-1">{items.map((item, i) => (
            <li key={i} className="text-sm text-white/80 flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">▸</span>{item}
            </li>
          ))}</ul>
      }
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0a0f] shadow-[0_0_60px_rgba(6,182,212,0.2)]"
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between p-5 border-b border-white/10 bg-[#0a0a0f]/95 backdrop-blur-sm">
          <div>
            <h2 className="text-lg font-bold text-white">Consultation Summary</h2>
            <p className="text-xs text-white/40 mt-0.5">AI-generated medical report</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">Overview</h3>
            <p className="text-sm text-white/80 leading-relaxed">{summary.summary}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Section icon="🤒" title="Symptoms" items={summary.medicalHighlights?.symptoms || []} empty="None recorded" />
            <Section icon="🩺" title="Diagnoses" items={summary.medicalHighlights?.diagnoses || []} empty="None recorded" />
            <Section icon="💊" title="Medications" items={summary.medicalHighlights?.medications || []} empty="None prescribed" />
            <Section icon="📋" title="Follow-up" items={summary.medicalHighlights?.followUp || []} empty="None specified" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('DOCTOR');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { if (currentConversation) loadMessages(currentConversation.id); }, [currentConversation]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadConversations = async () => {
    try {
      const data = await fetch('/api/conversations').then(r => r.json());
      setConversations(data);
    } catch { console.error('Failed to load conversations'); }
  };

  const loadMessages = async (conversationId: string, search?: string) => {
    try {
      const url = new URL('/api/messages', window.location.origin);
      url.searchParams.set('conversationId', conversationId);
      if (search) url.searchParams.set('search', search);
      const data = await fetch(url.toString()).then(r => r.json());
      setMessages(data);
    } catch { console.error('Failed to load messages'); }
  };

  const createNewConversation = async () => {
    try {
      const newConv = await fetch('/api/conversations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Consultation' }),
      }).then(r => r.json());
      setConversations([newConv, ...conversations]);
      setCurrentConversation(newConv);
      setMessages([]);
    } catch { console.error('Failed to create conversation'); }
  };

  const deleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    if (!confirm('Delete this consultation?')) return;
    setDeletingId(convId);
    try {
      const res = await fetch(`/api/conversations/${convId}`, { method: 'DELETE' });
      if (res.ok) {
        setConversations(conversations.filter(c => c.id !== convId));
        if (currentConversation?.id === convId) { setCurrentConversation(null); setMessages([]); }
      }
    } finally { setDeletingId(null); }
  };

  const sendMessage = async (text: string, audioUrl?: string) => {
    if (!currentConversation || !text.trim()) return;
    setIsLoading(true);
    try {
      const targetLang = selectedRole === 'DOCTOR' ? 'hi' : 'en';
      const originalLang = selectedRole === 'DOCTOR' ? 'en' : 'hi';
      const newMessage = await fetch('/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: currentConversation.id, role: selectedRole, text, originalLang, targetLang, audioUrl }),
      }).then(r => r.json());
      setMessages([...messages, newMessage]);
      setInputText('');
    } catch { alert('Failed to send message.'); }
    finally { setIsLoading(false); }
  };

  const handleAudioRecording = async (audioBlob: Blob) => {
    if (!currentConversation) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      const { text } = await fetch('/api/transcribe', { method: 'POST', body: formData }).then(r => r.json());
      await sendMessage(text, URL.createObjectURL(audioBlob));
    } catch { alert('Failed to process audio.'); }
    finally { setIsLoading(false); }
  };

  const generateSummary = async () => {
    if (!currentConversation) return;
    setIsLoading(true);
    try {
      const summary = await fetch('/api/summary', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: currentConversation.id }),
      }).then(r => r.json());
      setSummaryData(summary);
      setShowSummary(true);
    } catch { alert('Failed to generate summary.'); }
    finally { setIsLoading(false); }
  };

  const handleSearch = () => { if (currentConversation) loadMessages(currentConversation.id, searchQuery); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #06060a; font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .glow-cyan { box-shadow: 0 0 30px rgba(6,182,212,0.15); }
        .glow-violet { box-shadow: 0 0 30px rgba(139,92,246,0.15); }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .msg-appear { animation: fadeSlideUp 0.25s ease forwards; }
        @keyframes gridPulse { 0%,100% { opacity: 0.03; } 50% { opacity: 0.06; } }
        .bg-grid { animation: gridPulse 4s ease-in-out infinite; }
      `}</style>

      <div className="flex h-screen overflow-hidden" style={{ background: '#06060a', color: '#fff' }}>

        {/* Background grid */}
        <div className="fixed inset-0 pointer-events-none bg-grid" style={{
          backgroundImage: 'linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        {/* ── Sidebar ── */}
        <div className="relative z-10 w-72 flex flex-col border-r" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(6,6,15,0.95)' }}>
          {/* Logo */}
          <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}>⚕</div>
              <span className="font-bold text-sm tracking-wider" style={{ fontFamily: 'Space Mono, monospace', color: '#22d3ee' }}>MEDTRANSLATE</span>
            </div>
            <p className="text-[10px] tracking-widest uppercase text-white/20 ml-9">AI-Powered Consultations</p>
          </div>

          {/* New conversation button */}
          <div className="p-4">
            <button onClick={createNewConversation}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(6,182,212,0.3)', color: '#22d3ee' }}>
              <Plus className="w-4 h-4" /> New Consultation
            </button>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {conversations.length === 0 && (
              <p className="text-xs text-white/20 text-center mt-8">No consultations yet</p>
            )}
            {conversations.map((conv) => (
              <div key={conv.id}
                onClick={() => setCurrentConversation(conv)}
                className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  currentConversation?.id === conv.id
                    ? 'border border-cyan-500/30 glow-cyan'
                    : 'border border-transparent hover:border-white/10'
                }`}
                style={{ background: currentConversation?.id === conv.id ? 'rgba(6,182,212,0.08)' : 'rgba(255,255,255,0.03)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
                  style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>💬</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{conv.title || 'Consultation'}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">{new Date(conv.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={(e) => deleteConversation(e, conv.id)}
                  disabled={deletingId === conv.id}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/20 shrink-0">
                  {deletingId === conv.id
                    ? <Loader2 className="w-3 h-3 animate-spin text-white/30" />
                    : <Trash2 className="w-3 h-3 text-red-400/70" />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main area ── */}
        <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
          {currentConversation ? (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(6,6,15,0.95)' }}>
                <div>
                  <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'Space Mono, monospace' }}>
                    {currentConversation.title || 'Consultation'}
                  </h1>
                  <p className="text-xs text-white/30 mt-0.5 tracking-widest uppercase">English ↔ Hindi · Real-time Translation</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Search className="w-3.5 h-3.5 text-white/30" />
                    <input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      className="bg-transparent outline-none text-sm text-white/70 placeholder-white/20 w-32"
                    />
                  </div>
                  {/* Summary button */}
                  <button
                    onClick={generateSummary}
                    disabled={isLoading || messages.length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}>
                    <FileText className="w-3.5 h-3.5" />
                    Summary
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-4"
                      style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>⚕️</div>
                    <p className="text-white/30 text-sm">Start the consultation</p>
                    <p className="text-white/15 text-xs mt-1">Select Doctor or Patient role below and type a message</p>
                  </div>
                )}
                {messages.map((message, i) => (
                  <div key={message.id} className="msg-appear" style={{ animationDelay: `${i * 0.03}s` }}>
                    <MessageBubble message={message} highlight={searchQuery} />
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="px-6 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(6,6,15,0.95)' }}>
                {/* Role toggle */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setSelectedRole('DOCTOR')}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200"
                    style={selectedRole === 'DOCTOR'
                      ? { background: 'rgba(6,182,212,0.2)', border: '1px solid rgba(6,182,212,0.5)', color: '#22d3ee' }
                      : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
                    ⚕ Doctor
                  </button>
                  <button
                    onClick={() => setSelectedRole('PATIENT')}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200"
                    style={selectedRole === 'PATIENT'
                      ? { background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.5)', color: '#a78bfa' }
                      : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
                    ✦ Patient
                  </button>
                </div>

                {/* Message input */}
                <div className="flex items-center gap-2 rounded-2xl px-4 py-2" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${selectedRole === 'DOCTOR' ? 'rgba(6,182,212,0.25)' : 'rgba(139,92,246,0.25)'}` }}>
                  <input
                    placeholder={`Message as ${selectedRole === 'DOCTOR' ? 'Doctor (English)' : 'Patient (Hindi/English)'}...`}
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !isLoading && sendMessage(inputText)}
                    disabled={isLoading}
                    className="flex-1 bg-transparent outline-none text-sm text-white/80 placeholder-white/20"
                  />
                  <AudioRecorder onRecordingComplete={handleAudioRecording} disabled={isLoading} />
                  <button
                    onClick={() => sendMessage(inputText)}
                    disabled={isLoading || !inputText.trim()}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:opacity-30"
                    style={{ background: selectedRole === 'DOCTOR' ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Welcome screen */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md px-6">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6"
                  style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(6,182,212,0.3)', boxShadow: '0 0 40px rgba(6,182,212,0.15)' }}>
                  ⚕️
                </div>
                <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Space Mono, monospace' }}>MedTranslate</h1>
                <p className="text-sm text-white/40 mb-2">Real-time English ↔ Hindi translation</p>
                <p className="text-xs text-white/20 mb-8">for doctor-patient consultations</p>
                <button onClick={createNewConversation}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold mx-auto transition-all duration-200 hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', color: '#fff', boxShadow: '0 0 30px rgba(6,182,212,0.3)' }}>
                  <Plus className="w-4 h-4" /> Start New Consultation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <SummaryDialog open={showSummary} onClose={() => setShowSummary(false)} summary={summaryData} />
    </>
  );
}