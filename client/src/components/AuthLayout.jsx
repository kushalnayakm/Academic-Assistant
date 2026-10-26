import { Upload, MessageCircleQuestion, Zap, GraduationCap } from 'lucide-react';
import { BooksIllustration } from './ui';

const features = [
  { icon: Upload, label: 'Upload Documents' },
  { icon: MessageCircleQuestion, label: 'Ask Questions' },
  { icon: Zap, label: 'Get Instant Answers' },
];

function BrandMark({ light = false }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className={`shrink-0 rounded-xl p-2 ${light ? 'border border-white/20 bg-white/15' : 'border border-glow/20 bg-leaf'}`}>
        <GraduationCap className={light ? 'text-white' : 'text-glow'} size={22} />
      </span>
      <span className="min-w-0">
        <span className={`block truncate font-heading text-[15px] font-bold leading-tight ${light ? 'text-white' : 'text-mist'}`}>
          Academic Assistant
        </span>
        <span className={`block truncate text-[10px] ${light ? 'text-white/80' : 'text-soft'}`}>
          Your University Info, Simplified
        </span>
      </span>
    </div>
  );
}

/**
 * Auth shell:
 * - < xl: compact green header + centered form (no tall stacked promo)
 * - >= xl: two equal-height columns inside 100dvh; each column scrolls if needed
 */
export default function AuthLayout({ heading, subheading, children, showBooks = false }) {
  return (
    <div className="box-border flex min-h-dvh w-full flex-col bg-night bg-leaf-shape xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* Mobile / tablet / laptop compact header */}
      <header className="box-border w-full min-w-0 shrink-0 bg-glow px-4 py-4 text-white sm:px-6 xl:hidden">
        <BrandMark light />
        <p className="mt-3 text-sm leading-snug text-white/90 line-clamp-2">{subheading}</p>
      </header>

      {/* Desktop promotional column */}
      <aside className="relative hidden min-h-0 min-w-0 flex-col overflow-hidden bg-glow px-8 py-8 text-white xl:flex 2xl:px-12 2xl:py-10">
        <div className="pointer-events-none absolute -right-8 -bottom-12 h-48 w-48 rounded-full bg-violet/25 blur-2xl" aria-hidden />
        <BrandMark light />
        <div className="relative my-auto max-w-md py-6">
          <h1 className="font-heading text-4xl font-bold leading-[1.15] 2xl:text-[42px]">{heading}</h1>
          <p className="mt-4 text-sm leading-relaxed text-white/85">{subheading}</p>
          {showBooks && (
            <div className="mt-6">
              <BooksIllustration className="h-auto w-full max-w-[12rem]" />
            </div>
          )}
        </div>
        <div className="relative mt-4 grid shrink-0 grid-cols-3 gap-3 border-t border-white/20 pt-5">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="min-w-0 text-center">
              <span className="mx-auto mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <Icon size={16} />
              </span>
              <span className="block text-[10px] leading-tight text-white/80">{label}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Form column */}
      <main className="box-border flex min-h-0 min-w-0 flex-1 flex-col justify-center px-4 py-6 sm:px-6 sm:py-8 xl:overflow-y-auto xl:px-10 xl:py-8">
        <div className="card box-border mx-auto w-full min-w-0 max-w-md p-4 sm:p-6 md:p-7">
          {children}
        </div>
      </main>
    </div>
  );
}
