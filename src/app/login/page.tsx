'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Fraunces, Crimson_Pro } from 'next/font/google';
import { useAuthContext } from '@/lib/authContext';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['opsz', 'SOFT'],
  display: 'swap',
});

const crimson = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-crimson',
  display: 'swap',
});

const INK = '#1B1A17';
const PAPER = '#F4ECDD';
const RULE = 'rgba(27,26,23,0.45)';
const RUST = '#A8442C';
const MOSS = '#3F5A3A';

function PaperGrain() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none fixed inset-0 h-full w-full opacity-[0.06] mix-blend-multiply"
    >
      <filter id="paper-noise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves="2"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paper-noise)" />
    </svg>
  );
}

type BadgeName = 'hearth' | 'lantern' | 'compass' | 'key';

function EngravedBadge({
  name,
  active = false,
}: {
  name: BadgeName;
  active?: boolean;
}) {
  const stroke = active ? RUST : INK;
  const common = {
    width: 44,
    height: 44,
    viewBox: '0 0 44 44',
    fill: 'none',
    stroke,
    strokeWidth: 1.1,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (name === 'hearth') {
    return (
      <svg {...common} aria-hidden>
        <rect x="6" y="22" width="32" height="16" />
        <path d="M6 22 L22 8 L38 22" />
        <path d="M18 38 V30 Q22 26 26 30 V38" />
        <path d="M22 22 q-2 2 0 4 q2 -2 0 -4" stroke={RUST} />
      </svg>
    );
  }
  if (name === 'lantern') {
    return (
      <svg {...common} aria-hidden>
        <path d="M14 12 H30" />
        <path d="M16 12 V14 Q16 16 18 16 H26 Q28 16 28 14 V12" />
        <rect x="14" y="16" width="16" height="18" />
        <path d="M22 16 V34" />
        <path d="M16 34 V37 M28 34 V37" />
        <circle cx="22" cy="25" r="3" stroke={RUST} />
      </svg>
    );
  }
  if (name === 'compass') {
    return (
      <svg {...common} aria-hidden>
        <circle cx="22" cy="22" r="14" />
        <path d="M22 12 L25 22 L22 32 L19 22 Z" stroke={RUST} />
        <circle cx="22" cy="22" r="1.5" fill={stroke} />
        <path d="M22 6 V9 M22 35 V38 M6 22 H9 M35 22 H38" />
      </svg>
    );
  }
  return (
    <svg {...common} aria-hidden>
      <circle cx="14" cy="22" r="7" />
      <circle cx="14" cy="22" r="2.5" fill={stroke} />
      <path d="M21 22 H38" />
      <path d="M32 22 V27 M36 22 V25" />
    </svg>
  );
}

function InkInput({
  label,
  hint,
  type = 'text',
  value,
  onChange,
  required = false,
  minLength,
  autoComplete,
  rightSlot,
}: {
  label: string;
  hint?: string | undefined;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  minLength?: number | undefined;
  autoComplete?: string | undefined;
  rightSlot?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <label className="block">
      <span
        className="mb-1.5 block text-[10px] uppercase tracking-[0.22em]"
        style={{ color: INK, opacity: 0.7, fontFeatureSettings: '"smcp"' }}
      >
        {label}
      </span>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent pb-2 pr-9 text-[19px] leading-tight outline-none placeholder:opacity-30"
          style={{
            color: INK,
            fontFamily: 'var(--font-crimson)',
            borderBottom: `1px solid ${focused ? INK : RULE}`,
            transition: 'border-color 200ms ease, padding-bottom 200ms ease',
            paddingBottom: focused ? 9 : 8,
          }}
        />
        {rightSlot ? (
          <span className="absolute right-0 top-1/2 -translate-y-1/2">
            {rightSlot}
          </span>
        ) : null}
      </div>
      {hint ? (
        <span
          className="mt-1.5 block text-[12px] italic"
          style={{
            color: INK,
            opacity: 0.55,
            fontFamily: 'var(--font-crimson)',
          }}
        >
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'parent' | 'teacher' | 'admin' | 'student'>(
    'parent'
  );
  const searchParams = useSearchParams();
  const [isSignup, setIsSignup] = useState(
    searchParams.get('mode') === 'signup'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login, signup } = useAuthContext();

  useEffect(() => {
    if (searchParams.get('message') === 'setup-complete') {
      setSuccess('Admin account ready. You may sign in.');
    }
  }, [searchParams]);

  const routeFor = (r?: string) => {
    if (r === 'admin') {
      return '/admin/dashboard';
    }
    if (r === 'teacher') {
      return '/teacher/dashboard';
    }
    if (r === 'student') {
      return '/student/dashboard';
    }
    return '/parent/dashboard';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (isSignup) {
        const result = await signup(email, password, name, role);
        if (result.success) {
          setSuccess('Account opened. Redirecting…');
          setTimeout(() => router.push(routeFor(result.user?.role)), 1400);
        } else {
          setError(result.error || 'Signup failed.');
        }
      } else {
        const result = await login(email, password);
        if (result.success) {
          router.push(routeFor(result.user?.role));
        } else {
          setError(result.error || 'Sign-in failed.');
        }
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const roles: Array<{
    id: typeof role;
    label: string;
    badge: BadgeName;
    no: string;
  }> = [
    { id: 'parent', label: 'Parent', badge: 'hearth', no: '№ 01' },
    { id: 'teacher', label: 'Teacher', badge: 'lantern', no: '№ 02' },
    { id: 'student', label: 'Student', badge: 'compass', no: '№ 03' },
    { id: 'admin', label: 'Administrator', badge: 'key', no: '№ 04' },
  ];

  return (
    <div
      className={`${fraunces.variable} ${crimson.variable} relative min-h-screen overflow-hidden`}
      style={{
        background: PAPER,
        color: INK,
        fontFamily: 'var(--font-crimson), Georgia, serif',
      }}
    >
      <PaperGrain />

      {/* Folio marks */}
      <div
        className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 text-[11px] tracking-[0.42em]"
        style={{ color: INK, opacity: 0.55 }}
      >
        GURUKOOL · HOMESCHOOL PRIMER
      </div>
      <div
        className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px]"
        style={{
          color: INK,
          opacity: 0.55,
          fontFamily: 'var(--font-fraunces)',
        }}
      >
        —&nbsp;&nbsp;<span className="italic">i</span>&nbsp;&nbsp;—
      </div>

      <main className="relative mx-auto grid min-h-screen max-w-[1180px] grid-cols-1 items-center gap-10 px-8 py-24 md:grid-cols-[1.05fr_1px_1fr] md:gap-16 md:px-12">
        {/* LEFT — frontispiece */}
        <section className="relative">
          <div
            className="mb-7 text-[11px] uppercase tracking-[0.38em]"
            style={{ opacity: 0.65 }}
          >
            Volume vii · The Door
          </div>

          {/* Monogram */}
          <div className="mb-8 flex items-end gap-3">
            <span
              className="leading-none"
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: 96,
                fontWeight: 500,
                fontStyle: 'italic',
                fontVariationSettings: '"opsz" 144, "SOFT" 50',
                letterSpacing: '-0.02em',
              }}
            >
              Gk
            </span>
            <span
              className="pb-3 text-[11px] uppercase tracking-[0.32em]"
              style={{ opacity: 0.65 }}
            >
              est.&nbsp;mmxxvi
            </span>
          </div>

          <h1
            className="mb-6 max-w-[15ch]"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'clamp(38px, 5vw, 58px)',
              fontWeight: 400,
              lineHeight: 1.02,
              letterSpacing: '-0.015em',
              fontVariationSettings: '"opsz" 144',
            }}
          >
            {isSignup ? (
              <>
                Begin a quiet,
                <br />
                <em style={{ fontStyle: 'italic', color: RUST }}>
                  considered
                </em>{' '}
                practice
                <br />
                of learning at home.
              </>
            ) : (
              <>
                The hearth is warm.
                <br />
                <em style={{ fontStyle: 'italic', color: RUST }}>Come in.</em>
              </>
            )}
          </h1>

          <p
            className="max-w-[34ch] text-[17px] leading-[1.55]"
            style={{ opacity: 0.78 }}
          >
            {isSignup
              ? 'A logbook for parents, teachers, and students keeping school at home — without the noise.'
              : 'Pick up where the day left off — your students, your lessons, your notes.'}
          </p>

          {/* Pull quote */}
          <figure
            className="mt-12 max-w-[34ch] border-l pl-5"
            style={{ borderColor: RULE }}
          >
            <blockquote
              className="text-[18px] leading-[1.45]"
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontStyle: 'italic',
                fontVariationSettings: '"opsz" 144',
                opacity: 0.85,
              }}
            >
              “Education is not the filling of a pail, but the lighting of a
              fire.”
            </blockquote>
            <figcaption
              className="mt-2 text-[12px] uppercase tracking-[0.24em]"
              style={{ opacity: 0.55 }}
            >
              — W. B. Yeats
            </figcaption>
          </figure>

          {/* Margin stamp */}
          <div
            className="absolute -left-1 top-0 hidden -rotate-90 text-[10px] uppercase tracking-[0.5em] md:block"
            style={{ opacity: 0.45, transformOrigin: 'top left' }}
          >
            Chapter&nbsp;·&nbsp;Sign-in
          </div>
        </section>

        {/* Hairline rule */}
        <div
          className="hidden h-[60%] w-px md:block"
          style={{ background: RULE }}
        />

        {/* RIGHT — the form */}
        <section className="relative">
          <div
            className="mb-8 flex items-baseline justify-between text-[10px] uppercase tracking-[0.32em]"
            style={{ opacity: 0.65 }}
          >
            <span>{isSignup ? 'Open a new ledger' : 'Return to the page'}</span>
            <span>{isSignup ? 'fol. ii' : 'fol. iii'}</span>
          </div>

          {success ? (
            <div
              className="mb-6 border-l-2 pl-3 text-[14px] italic"
              style={{ borderColor: MOSS, color: MOSS }}
            >
              {success}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignup && (
              <fieldset className="relative">
                <legend
                  className="mb-3 text-[10px] uppercase tracking-[0.22em]"
                  style={{ opacity: 0.7 }}
                >
                  Choose your station
                </legend>

                {/* Marginalia */}
                <span
                  className="absolute -right-2 -top-1 hidden text-[12px] italic md:block"
                  style={{ color: RUST, fontFamily: 'var(--font-crimson)' }}
                >
                  ↳ you may change this later
                </span>

                <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                  {roles.map(r => {
                    const isActive = role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className="group flex items-center gap-3 text-left"
                        aria-pressed={isActive}
                      >
                        <EngravedBadge name={r.badge} active={isActive} />
                        <span className="flex flex-col leading-tight">
                          <span
                            className="text-[10px] uppercase tracking-[0.28em]"
                            style={{
                              color: isActive ? RUST : INK,
                              opacity: isActive ? 1 : 0.55,
                            }}
                          >
                            {r.no}
                          </span>
                          <span
                            className="text-[18px]"
                            style={{
                              fontFamily: 'var(--font-fraunces)',
                              fontVariationSettings: '"opsz" 144',
                              color: isActive ? RUST : INK,
                              fontStyle: isActive ? 'italic' : 'normal',
                              fontWeight: isActive ? 500 : 400,
                            }}
                          >
                            {r.label}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {isSignup && (
              <InkInput
                label="Full Name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoComplete="name"
              />
            )}

            <InkInput
              label="Email Address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <InkInput
              label="Password"
              hint={isSignup ? 'At least six characters.' : undefined}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={isSignup ? 6 : undefined}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="text-[10px] uppercase tracking-[0.22em]"
                  style={{ color: INK, opacity: 0.55 }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              }
            />

            {error ? (
              <div
                className="border-l-2 pl-3 text-[14px] italic"
                style={{ borderColor: RUST, color: RUST }}
              >
                {error}
              </div>
            ) : null}

            {/* Submit — ink-outline button, fills on hover */}
            <button
              type="submit"
              disabled={loading}
              className="group relative mt-2 inline-flex items-center justify-between gap-6 px-6 py-3.5 text-[13px] uppercase tracking-[0.28em] transition-colors duration-200 disabled:opacity-50"
              style={{
                color: INK,
                border: `1px solid ${INK}`,
                background: 'transparent',
              }}
              onMouseEnter={e => {
                if (loading) {
                  return;
                }
                e.currentTarget.style.background = INK;
                e.currentTarget.style.color = PAPER;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = INK;
              }}
            >
              <span>
                {loading
                  ? isSignup
                    ? 'Opening…'
                    : 'Signing in…'
                  : isSignup
                    ? 'Open the ledger'
                    : 'Enter'}
              </span>
              <span aria-hidden style={{ letterSpacing: '0.1em' }}>
                →
              </span>
            </button>

            <div
              className="pt-2 text-[13px]"
              style={{
                fontFamily: 'var(--font-crimson)',
                opacity: 0.7,
              }}
            >
              {isSignup ? 'Already keep a ledger?' : 'No account yet?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError('');
                  setSuccess('');
                }}
                className="underline decoration-[0.5px] underline-offset-[5px] hover:opacity-100"
                style={{ color: INK, opacity: 0.9 }}
              >
                {isSignup ? 'Sign in' : 'Open one'}
              </button>
            </div>
          </form>

          {/* Colophon / ISBN-style footer */}
          <div
            className="mt-14 flex items-baseline justify-between border-t pt-4 text-[10px] uppercase tracking-[0.28em]"
            style={{ borderColor: RULE, opacity: 0.55 }}
          >
            <span>ISBN&nbsp;978-0-GK-HOME-26</span>
            <span>Privacy&nbsp;·&nbsp;Terms</span>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ background: PAPER, color: INK }}
        >
          <span
            className="text-[11px] uppercase tracking-[0.4em]"
            style={{ opacity: 0.65 }}
          >
            opening the book…
          </span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
