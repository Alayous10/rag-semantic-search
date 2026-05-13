'use client';

import { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, Send, Loader2, Bot, User, FileText } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: 'أهلاً بك في محرك البحث الدلالي. الرجاء رفع مستند (PDF/TXT/DOCX) ثم اسألني أي سؤال حوله!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('http://localhost:8000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadSuccess(true);
      setMessages((prev) => [...prev, { role: 'bot', text: `تم رفع ومعالجة الملف "${file.name}" بنجاح. ما الذي تريد معرفته؟` }]);
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء رفع الملف');
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
      const res = await axios.post('http://localhost:8000/api/chat', { message: userMsg });
      setMessages((prev) => [...prev, { role: 'bot', text: res.data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'bot', text: 'حدث خطأ أثناء الاتصال بالخادم.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#e0e0e0] flex flex-col items-center py-10 px-4" dir="rtl">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-[#0ff] cyber-glow">
            محرك البحث الدلالي الذكي
          </h1>
          <p className="text-[#888]">قم برفع أي مستند واطرح أسئلة لفهم محتواه باستخدام الذكاء الاصطناعي</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="col-span-1 cyber-border bg-[#0f0f13] rounded-xl p-6 flex flex-col items-center justify-center space-y-4">
            <div 
              className="w-full h-40 border-2 border-dashed border-[#1f1f2e] hover:border-[#0ff] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.txt,.doc,.docx"
              />
              <UploadCloud className="w-10 h-10 text-[#555] mb-2" />
              <p className="text-sm text-[#888] text-center px-2">
                {file ? file.name : "اضغط لرفع ملف (PDF, TXT, DOCX)"}
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
              {uploadSuccess ? 'تم الرفع' : 'معالجة الملف'}
            </button>
          </div>

          {/* Chat Section */}
          <div className="col-span-1 md:col-span-2 cyber-border bg-[#0f0f13] rounded-xl flex flex-col h-[600px] overflow-hidden">
            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#8a2be2]' : 'bg-[#0ff] text-black'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#1f1f2e] text-white rounded-tr-none' : 'bg-[#0a0a0f] border border-[#1f1f2e] rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#0ff] text-black">
                    <Bot size={16} />
                  </div>
                  <div className="max-w-[80%] rounded-2xl p-4 bg-[#0a0a0f] border border-[#1f1f2e] rounded-tl-none flex items-center gap-2 text-sm text-[#888]">
                    <Loader2 className="w-4 h-4 animate-spin" /> جاري التفكير...
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
                  placeholder={uploadSuccess ? "اسألني عن محتوى المستند..." : "الرجاء رفع ملف أولاً..."}
                  disabled={!uploadSuccess || loading}
                  className="w-full bg-[#15151a] border border-[#1f1f2e] rounded-full py-3 px-6 pr-12 outline-none focus:border-[#0ff] transition-colors text-sm disabled:opacity-50"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || !uploadSuccess || loading}
                  className="absolute right-2 w-10 h-10 flex items-center justify-center rounded-full bg-[#8a2be2] text-white disabled:opacity-50 transition-opacity hover:bg-[#9d4edd]"
                >
                  <Send size={16} className="mr-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
