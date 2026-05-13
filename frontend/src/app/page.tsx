'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud, Send, Loader2, Bot, User, FileText, Globe } from 'lucide-react';

const translations = {
  en: {
    welcome: 'Welcome to the Semantic Search Engine. Please upload a document (PDF/TXT/DOCX) and ask me any question about it!',
    uploadSuccess: 'File "{name}" uploaded and processed successfully. What would you like to know?',
    uploadError: 'An error occurred while uploading the file',
    serverError: 'An error occurred while connecting to the server.',
    title: 'Smart Semantic Search Engine',
    subtitle: 'Upload any document and ask questions to understand its content using AI',
    dropText: 'Drop the file here...',
    uploadPrompt: 'Click or Drag & Drop a file (PDF, TXT, DOCX)',
    uploadedBtn: 'Uploaded',
    processBtn: 'Process File',
    thinking: 'Thinking...',
    askPlaceholder: 'Ask me about the document content...',
    uploadFirst: 'Please upload a file first...',
  },
  ar: {
    welcome: 'أهلاً بك في محرك البحث الدلالي. الرجاء رفع مستند (PDF/TXT/DOCX) ثم اسألني أي سؤال حوله!',
    uploadSuccess: 'تم رفع ومعالجة الملف "{name}" بنجاح. ما الذي تريد معرفته؟',
    uploadError: 'حدث خطأ أثناء رفع الملف',
    serverError: 'حدث خطأ أثناء الاتصال بالخادم.',
    title: 'محرك البحث الدلالي الذكي',
    subtitle: 'قم برفع أي مستند واطرح أسئلة لفهم محتواه باستخدام الذكاء الاصطناعي',
    dropText: 'أفلت الملف هنا...',
    uploadPrompt: 'اضغط أو اسحب وأفلت ملف (PDF, TXT, DOCX)',
    uploadedBtn: 'تم الرفع',
    processBtn: 'معالجة الملف',
    thinking: 'جاري التفكير...',
    askPlaceholder: 'اسألني عن محتوى المستند...',
    uploadFirst: 'الرجاء رفع ملف أولاً...',
  }
};

export default function Home() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const t = translations[lang];

  const handleSetLang = (newLang: 'en' | 'ar') => {
    setLang(newLang);
    setMessages(prev => {
      if (prev.length === 1 && (prev[0].text === translations.en.welcome || prev[0].text === translations.ar.welcome)) {
        return [{ role: 'bot', text: translations[newLang].welcome }];
      }
      return prev;
    });
  };

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: translations.en.welcome }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleFile = (selectedFile: File) => {
    setFile(selectedFile);
    setUploadSuccess(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const validTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (validTypes.includes(droppedFile.type) || droppedFile.name.match(/\.(pdf|txt|doc|docx)$/i)) {
        handleFile(droppedFile);
      }
    }
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadSuccess(true);
      setMessages((prev) => [...prev, { role: 'bot', text: t.uploadSuccess.replace('{name}', file.name) }]);
    } catch (error) {
      console.error(error);
      alert(t.uploadError);
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !uploadSuccess) return;
    
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/chat`, { message: userMsg });
      setMessages((prev) => [...prev, { role: 'bot', text: res.data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'bot', text: t.serverError }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#e0e0e0] flex flex-col items-center py-10 px-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Language Toggle */}
      <button 
        onClick={() => handleSetLang(lang === 'en' ? 'ar' : 'en')}
        className="absolute top-4 right-4 md:top-8 md:right-8 bg-[#1f1f2e] hover:bg-[#2a2a3c] text-white px-4 py-2 rounded-full flex items-center justify-center transition-colors shadow-lg z-10"
        title="Toggle Language"
      >
        <Globe size={18} className={lang === 'ar' ? 'ml-2' : 'mr-2'} />
        <span className="font-semibold text-sm">{lang === 'en' ? 'العربية' : 'English'}</span>
      </button>

      <div className="w-full max-w-4xl space-y-8 mt-12 md:mt-0">
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-[#0ff] cyber-glow">
            {t.title}
          </h1>
          <p className="text-[#888]">{t.subtitle}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="col-span-1 cyber-border bg-[#0f0f13] rounded-xl p-6 flex flex-col items-center justify-center space-y-4">
            <div 
              className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragging ? 'border-[#8a2be2] bg-[#8a2be2]/10 scale-105' : 'border-[#1f1f2e] hover:border-[#0ff]'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.txt,.doc,.docx"
              />
              <UploadCloud className={`w-10 h-10 mb-2 ${isDragging ? 'text-[#8a2be2] animate-bounce' : 'text-[#555]'}`} />
              <p className="text-sm text-[#888] text-center px-2">
                {isDragging ? t.dropText : (file ? file.name : t.uploadPrompt)}
              </p>
            </div>
            <button 
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: file && !uploadSuccess ? 'linear-gradient(90deg, #0ff, #8a2be2)' : '#1f1f2e',
                color: file && !uploadSuccess ? '#000' : '#888'
              }}
            >
              {uploading ? <Loader2 className="animate-spin w-5 h-5" /> : <FileText className="w-5 h-5" />}
              {uploadSuccess ? t.uploadedBtn : t.processBtn}
            </button>
          </div>

          {/* Chat Section */}
          <div className="col-span-1 md:col-span-2 cyber-border bg-[#0f0f13] rounded-xl flex flex-col h-[600px] overflow-hidden">
            {/* Chat History */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#8a2be2]' : 'bg-[#0ff] text-black'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? `bg-[#1f1f2e] text-white ${lang === 'ar' ? 'rounded-tl-none' : 'rounded-tr-none'}` 
                      : `bg-[#0a0a0f] border border-[#1f1f2e] ${lang === 'ar' ? 'rounded-tr-none' : 'rounded-tl-none'}`
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#0ff] text-black">
                    <Bot size={16} />
                  </div>
                  <div className={`max-w-[80%] rounded-2xl p-4 bg-[#0a0a0f] border border-[#1f1f2e] ${lang === 'ar' ? 'rounded-tr-none' : 'rounded-tl-none'} flex items-center gap-2 text-sm text-[#888]`}>
                    <Loader2 className="w-4 h-4 animate-spin" /> {t.thinking}
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-[#1f1f2e] bg-[#0a0a0f]">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={uploadSuccess ? t.askPlaceholder : t.uploadFirst}
                  disabled={!uploadSuccess || loading}
                  className={`w-full bg-[#15151a] border border-[#1f1f2e] rounded-full py-3 px-6 ${lang === 'ar' ? 'pl-12' : 'pr-12'} outline-none focus:border-[#0ff] transition-colors text-sm disabled:opacity-50`}
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || !uploadSuccess || loading}
                  className={`absolute ${lang === 'ar' ? 'left-2' : 'right-2'} w-10 h-10 flex items-center justify-center rounded-full bg-[#8a2be2] text-white disabled:opacity-50 transition-opacity hover:bg-[#9d4edd]`}
                >
                  <Send size={16} className={lang === 'ar' ? 'ml-1 transform rotate-180' : 'mr-1'} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
