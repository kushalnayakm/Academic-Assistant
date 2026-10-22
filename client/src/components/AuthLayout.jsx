import { Upload, MessageCircleQuestion, Zap, GraduationCap } from 'lucide-react';
import { BooksIllustration } from './ui';

export default function AuthLayout({ heading, subheading, children, showBooks = false }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[42%_58%] bg-white">
      {/* Left navy panel — matches reference */}
      <aside className="relative bg-navy text-white px-7 sm:px-10 py-8 flex flex-col overflow-hidden">
        <div className="absolute -right-20 -bottom-24 w-72 h-72 rounded-full bg-accent/20 blur-2xl" />
        <div className="absolute right-8 top-1/3 opacity-[.07] pointer-events-none"><GraduationCap size={220} /></div>
        <div className="relative flex items-center gap-2.5">
          <span className="bg-white/10 border border-white/15 rounded-xl p-2"><GraduationCap size={26} /></span>
          <span><span className="block font-heading font-bold text-[17px] leading-tight">Academic Assistant</span><span className="block text-[10px] text-blue-200">Your University Info, Simplified</span></span>
        </div>
        <div className="relative my-10 lg:my-auto max-w-sm">
          <h1 className="font-heading text-4xl sm:text-[42px] font-bold leading-[1.15]">{heading}</h1>
          <p className="text-blue-100/85 text-sm leading-relaxed mt-4">{subheading}</p>
          {showBooks && <div className="mt-6 hidden sm:block"><BooksIllustration className="w-52" /></div>}
        </div>
        <div className="relative grid grid-cols-3 gap-3 border-t border-white/15 pt-5 mt-auto">
          {[{ icon: Upload, label: 'Upload Documents' }, { icon: MessageCircleQuestion, label: 'Ask Questions' }, { icon: Zap, label: 'Get Instant Answers' }].map(({ icon: Icon, label }) => (
            <div key={label} className="text-center"><span className="mx-auto w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-1.5"><Icon size={17} /></span><span className="block text-[10px] text-blue-100 leading-tight">{label}</span></div>
          ))}
        </div>
      </aside>
      <main className="flex items-start lg:items-center justify-center px-5 sm:px-10 py-10 bg-white">
        <div className="w-full max-w-[430px]">{children}</div>
      </main>
    </div>
  );
}
