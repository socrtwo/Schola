import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Phone,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  User,
  Mail,
  BookOpen,
  ClipboardCheck,
  PartyPopper,
  Pencil,
  Printer,
  Clock,
  MapPin,
  DollarSign,
  Users,
  HelpCircle,
} from 'lucide-react';
import type { Course } from '../data/sampleData';
import { useOfferings } from '../utils/offerings';

type Step = 'welcome' | 'personal' | 'contact' | 'courses' | 'review' | 'success';

interface FormData {
  firstName: string;
  lastName: string;
  dobMonth: string;
  dobDay: string;
  dobYear: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zip: string;
  selectedCourses: string[];
}

const BLANK: FormData = {
  firstName: '',
  lastName: '',
  dobMonth: '',
  dobDay: '',
  dobYear: '',
  email: '',
  phone: '',
  city: '',
  state: 'OK',
  zip: '',
  selectedCourses: [],
};

const STEPS: { id: Step; label: string; icon: typeof User }[] = [
  { id: 'personal', label: 'About You', icon: User },
  { id: 'contact',  label: 'Contact',   icon: Mail },
  { id: 'courses',  label: 'Courses',   icon: BookOpen },
  { id: 'review',   label: 'Review',    icon: ClipboardCheck },
];

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

const HELP_PHONE = '(405) 555-0100';

export default function Registration() {
  const courses = useOfferings();
  const [step, setStep] = useState<Step>('welcome');
  const [data, setData] = useState<FormData>(BLANK);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData(d => ({ ...d, [key]: value }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  const selectedCourseObjs = useMemo(
    () => courses.filter(c => data.selectedCourses.includes(c.id)),
    [courses, data.selectedCourses],
  );

  const totalFee = selectedCourseObjs.reduce((sum, c) => sum + c.fee, 0);

  const validate = (forStep: Step): boolean => {
    const next: Partial<Record<keyof FormData, string>> = {};

    if (forStep === 'personal') {
      if (!data.firstName.trim()) next.firstName = 'Please enter your first name.';
      if (!data.lastName.trim())  next.lastName  = 'Please enter your last name.';
      if (!data.dobMonth)         next.dobMonth  = 'Please choose your birth month.';
      if (!data.dobDay)           next.dobDay    = 'Please choose the day.';
      if (!data.dobYear)          next.dobYear   = 'Please choose the year.';
    }

    if (forStep === 'contact') {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim());
      if (!data.email.trim())    next.email = 'Please enter your email address.';
      else if (!emailOk)         next.email = 'That email address doesn\'t look right.';

      const digits = data.phone.replace(/\D/g, '');
      if (!digits)               next.phone = 'Please enter a phone number.';
      else if (digits.length < 10) next.phone = 'Please enter a 10-digit phone number.';

      if (!data.city.trim())     next.city = 'Please enter your city.';
      if (!data.zip.trim())      next.zip  = 'Please enter your ZIP code.';
      else if (!/^\d{5}$/.test(data.zip.trim())) next.zip = 'ZIP code should be 5 digits.';
    }

    if (forStep === 'courses') {
      if (data.selectedCourses.length === 0) {
        next.selectedCourses = 'Please choose at least one course.';
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (step === 'welcome')   { setStep('personal'); window.scrollTo(0, 0); return; }
    if (step === 'personal')  { if (validate('personal')) { setStep('contact'); window.scrollTo(0, 0); } return; }
    if (step === 'contact')   { if (validate('contact'))  { setStep('courses'); window.scrollTo(0, 0); } return; }
    if (step === 'courses')   { if (validate('courses'))  { setStep('review');  window.scrollTo(0, 0); } return; }
    if (step === 'review')    { setStep('success'); window.scrollTo(0, 0); return; }
  };

  const goBack = () => {
    const order: Step[] = ['welcome','personal','contact','courses','review','success'];
    const idx = order.indexOf(step);
    if (idx > 0) { setStep(order[idx - 1]); window.scrollTo(0, 0); }
  };

  const resetAll = () => {
    setData(BLANK);
    setErrors({});
    setStep('welcome');
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-full bg-schola-cream flex flex-col">
      <PublicHeader />

      <main className="flex-1 w-full px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-3xl mx-auto">
          {step !== 'welcome' && step !== 'success' && (
            <StepIndicator current={step} />
          )}

          {step === 'welcome'  && <WelcomeStep onStart={goNext} />}
          {step === 'personal' && <PersonalStep data={data} set={set} errors={errors} onNext={goNext} onBack={goBack} />}
          {step === 'contact'  && <ContactStep  data={data} set={set} errors={errors} onNext={goNext} onBack={goBack} />}
          {step === 'courses'  && (
            <CoursesStep
              data={data}
              set={set}
              errors={errors}
              courses={courses}
              totalFee={totalFee}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 'review'   && (
            <ReviewStep
              data={data}
              selectedCourses={selectedCourseObjs}
              totalFee={totalFee}
              onSubmit={goNext}
              onBack={goBack}
              onEdit={setStep}
            />
          )}
          {step === 'success'  && (
            <SuccessStep
              data={data}
              selectedCourses={selectedCourseObjs}
              totalFee={totalFee}
              onReset={resetAll}
            />
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

/* ---------------- Shared layout pieces ---------------- */

function PublicHeader() {
  return (
    <header className="bg-white border-b-2 border-gray-100 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
        <Link to="/register" className="flex items-center gap-3 group">
          <div className="w-11 h-11 bg-schola-navy rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900 leading-tight">Schola Academy</div>
            <div className="text-sm text-gray-500 leading-tight">Course Registration</div>
          </div>
        </Link>

        <a
          href={`tel:${HELP_PHONE.replace(/\D/g, '')}`}
          className="hidden sm:flex items-center gap-2 px-4 h-11 rounded-xl
                     bg-blue-50 text-blue-800 font-semibold border-2 border-blue-100
                     hover:bg-blue-100 transition-colors"
        >
          <Phone className="w-5 h-5" />
          <span>Need help? {HELP_PHONE}</span>
        </a>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="border-t-2 border-gray-100 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-600">
        <div>© 2026 Schola Academy of Continuing Education</div>
        <a
          href={`tel:${HELP_PHONE.replace(/\D/g, '')}`}
          className="flex items-center gap-2 font-medium text-blue-700 hover:underline sm:hidden"
        >
          <Phone className="w-4 h-4" />
          Need help? {HELP_PHONE}
        </a>
        <Link to="/dashboard" className="text-gray-400 hover:text-gray-600">
          Staff sign-in
        </Link>
      </div>
    </footer>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.findIndex(s => s.id === current);

  return (
    <ol className="flex items-center justify-between mb-8" aria-label="Registration progress">
      {STEPS.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        const Icon = s.icon;
        return (
          <li key={s.id} className="flex-1 flex items-center">
            <div className="flex flex-col items-center flex-1">
              <div
                className={[
                  'w-11 h-11 rounded-full flex items-center justify-center border-2 transition-colors',
                  done && 'bg-blue-600 border-blue-600 text-white',
                  active && 'bg-white border-blue-600 text-blue-600 ring-4 ring-blue-100',
                  !done && !active && 'bg-white border-gray-300 text-gray-400',
                ].filter(Boolean).join(' ')}
                aria-current={active ? 'step' : undefined}
              >
                {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span
                className={[
                  'mt-2 text-xs sm:text-sm font-semibold text-center',
                  active ? 'text-blue-700' : done ? 'text-gray-700' : 'text-gray-400',
                ].join(' ')}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={['h-0.5 flex-1 -mt-6', done ? 'bg-blue-600' : 'bg-gray-200'].join(' ')}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function StepCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">{title}</h1>
      {subtitle && <p className="mt-3 text-lg text-gray-600">{subtitle}</p>}
      <div className="mt-8 space-y-6">{children}</div>
    </section>
  );
}

function StepNav({
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  backLabel = 'Go Back',
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  backLabel?: string;
}) {
  return (
    <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
      {onBack ? (
        <button type="button" onClick={onBack} className="btn-xl-secondary">
          <ChevronLeft className="w-5 h-5" />
          {backLabel}
        </button>
      ) : <span />}
      <button type="button" onClick={onNext} disabled={nextDisabled} className="btn-xl-primary">
        {nextLabel}
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="error-text" role="alert">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      {message}
    </p>
  );
}

/* ---------------- Steps ---------------- */

function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
      <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
        <GraduationCap className="w-10 h-10 text-blue-700" />
      </div>
      <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
        Welcome to Schola Academy
      </h1>
      <p className="mt-4 text-lg sm:text-xl text-gray-700 max-w-xl mx-auto">
        Registering for a course takes just a few minutes.
        We'll ask for your name, how to reach you, and which classes you'd like to take.
      </p>

      <ul className="mt-8 text-left max-w-lg mx-auto space-y-3 text-gray-700">
        <ChecklistItem>You can go back to any step at any time.</ChecklistItem>
        <ChecklistItem>Payment is handled in person or by phone — no card details here.</ChecklistItem>
        <ChecklistItem>If you get stuck, call us at <strong>{HELP_PHONE}</strong>.</ChecklistItem>
      </ul>

      <div className="mt-10">
        <button type="button" onClick={onStart} className="btn-xl-primary w-full sm:w-auto">
          Start Registration
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}

function ChecklistItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-base sm:text-lg">
      <span className="mt-0.5 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
        <Check className="w-4 h-4" />
      </span>
      <span>{children}</span>
    </li>
  );
}

interface StepProps {
  data: FormData;
  set: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  errors: Partial<Record<keyof FormData, string>>;
  onNext: () => void;
  onBack: () => void;
}

function PersonalStep({ data, set, errors, onNext, onBack }: StepProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 90 }, (_, i) => currentYear - 50 - i); // birth years 50–139 yrs ago
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <StepCard title="About you" subtitle="Tell us your name and date of birth.">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="firstName" className="label-lg">First name</label>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            value={data.firstName}
            onChange={e => set('firstName', e.target.value)}
            className={`input-lg ${errors.firstName ? 'input-lg-error' : ''}`}
            aria-invalid={!!errors.firstName}
            aria-describedby={errors.firstName ? 'firstName-err' : undefined}
          />
          <FieldError message={errors.firstName} />
        </div>

        <div>
          <label htmlFor="lastName" className="label-lg">Last name</label>
          <input
            id="lastName"
            type="text"
            autoComplete="family-name"
            value={data.lastName}
            onChange={e => set('lastName', e.target.value)}
            className={`input-lg ${errors.lastName ? 'input-lg-error' : ''}`}
            aria-invalid={!!errors.lastName}
          />
          <FieldError message={errors.lastName} />
        </div>
      </div>

      <fieldset>
        <legend className="label-lg">Date of birth</legend>
        <p className="help-text mb-3">
          We use this only to confirm your identity and to offer age-appropriate programs.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="dobMonth" className="sr-only">Month</label>
            <select
              id="dobMonth"
              value={data.dobMonth}
              onChange={e => set('dobMonth', e.target.value)}
              className={`input-lg ${errors.dobMonth ? 'input-lg-error' : ''}`}
            >
              <option value="">Month</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dobDay" className="sr-only">Day</label>
            <select
              id="dobDay"
              value={data.dobDay}
              onChange={e => set('dobDay', e.target.value)}
              className={`input-lg ${errors.dobDay ? 'input-lg-error' : ''}`}
            >
              <option value="">Day</option>
              {days.map(d => <option key={d} value={String(d).padStart(2, '0')}>{d}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="dobYear" className="sr-only">Year</label>
            <select
              id="dobYear"
              value={data.dobYear}
              onChange={e => set('dobYear', e.target.value)}
              className={`input-lg ${errors.dobYear ? 'input-lg-error' : ''}`}
            >
              <option value="">Year</option>
              {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>
        </div>
        <FieldError message={errors.dobMonth || errors.dobDay || errors.dobYear} />
      </fieldset>

      <StepNav onBack={onBack} onNext={onNext} backLabel="Back to Welcome" />
    </StepCard>
  );
}

function formatPhoneInput(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3)  return d;
  if (d.length <= 6)  return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function ContactStep({ data, set, errors, onNext, onBack }: StepProps) {
  return (
    <StepCard title="How can we reach you?" subtitle="We'll send your registration confirmation by email.">
      <div>
        <label htmlFor="email" className="label-lg">Email address</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={data.email}
          onChange={e => set('email', e.target.value)}
          className={`input-lg ${errors.email ? 'input-lg-error' : ''}`}
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
        />
        <FieldError message={errors.email} />
        {!errors.email && <p className="help-text">We'll email your receipt and class reminders here.</p>}
      </div>

      <div>
        <label htmlFor="phone" className="label-lg">Phone number</label>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          value={data.phone}
          onChange={e => set('phone', formatPhoneInput(e.target.value))}
          className={`input-lg ${errors.phone ? 'input-lg-error' : ''}`}
          placeholder="(405) 555-0123"
          aria-invalid={!!errors.phone}
        />
        <FieldError message={errors.phone} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-6 gap-5">
        <div className="sm:col-span-3">
          <label htmlFor="city" className="label-lg">City</label>
          <input
            id="city"
            type="text"
            autoComplete="address-level2"
            value={data.city}
            onChange={e => set('city', e.target.value)}
            className={`input-lg ${errors.city ? 'input-lg-error' : ''}`}
            aria-invalid={!!errors.city}
          />
          <FieldError message={errors.city} />
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="state" className="label-lg">State</label>
          <select
            id="state"
            autoComplete="address-level1"
            value={data.state}
            onChange={e => set('state', e.target.value)}
            className="input-lg"
          >
            {US_STATES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="zip" className="label-lg">ZIP code</label>
          <input
            id="zip"
            type="text"
            autoComplete="postal-code"
            inputMode="numeric"
            maxLength={5}
            value={data.zip}
            onChange={e => set('zip', e.target.value.replace(/\D/g, ''))}
            className={`input-lg ${errors.zip ? 'input-lg-error' : ''}`}
            placeholder="73102"
            aria-invalid={!!errors.zip}
          />
          <FieldError message={errors.zip} />
        </div>
      </div>

      <StepNav onBack={onBack} onNext={onNext} backLabel="Back" />
    </StepCard>
  );
}

function CoursesStep({
  data, set, errors, courses, totalFee, onNext, onBack,
}: StepProps & { courses: Course[]; totalFee: number }) {
  const toggle = (id: string, full: boolean) => {
    if (full) return;
    const already = data.selectedCourses.includes(id);
    set(
      'selectedCourses',
      already
        ? data.selectedCourses.filter(x => x !== id)
        : [...data.selectedCourses, id],
    );
  };

  return (
    <StepCard
      title="Pick your courses"
      subtitle="Select as many as you'd like. You can change your mind before you submit."
    >
      {/* Sticky running total */}
      <div className="sticky top-[72px] z-[1] -mx-6 sm:-mx-10 px-6 sm:px-10 py-3
                      bg-blue-50 border-y border-blue-100 flex items-center justify-between">
        <div className="text-base sm:text-lg font-semibold text-blue-900">
          {data.selectedCourses.length === 0
            ? 'No courses selected yet'
            : `${data.selectedCourses.length} course${data.selectedCourses.length === 1 ? '' : 's'} selected`}
        </div>
        <div className="text-lg sm:text-xl font-bold text-blue-900">
          ${totalFee.toFixed(0)}
        </div>
      </div>

      <FieldError message={errors.selectedCourses} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map(c => {
          const selected = data.selectedCourses.includes(c.id);
          const spotsLeft = c.capacity - c.enrolled;
          const full = spotsLeft <= 0;
          return (
            <button
              key={c.id}
              type="button"
              role="checkbox"
              aria-checked={selected}
              aria-disabled={full}
              onClick={() => toggle(c.id, full)}
              className={[
                'course-tile',
                selected && 'course-tile-selected',
                full && 'course-tile-full',
              ].filter(Boolean).join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 leading-snug">{c.title}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">{c.instructor}</p>
                </div>
                <div
                  className={[
                    'w-7 h-7 rounded-md border-2 flex items-center justify-center flex-shrink-0',
                    selected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {selected && <Check className="w-4 h-4" />}
                </div>
              </div>

              <dl className="mt-4 space-y-1.5 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{c.day} · {c.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{c.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-semibold text-gray-900">${c.fee}</span>
                </div>
              </dl>

              <div className="mt-3 flex items-center gap-2 text-xs">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                {full ? (
                  <span className="font-semibold text-red-700">Class is full</span>
                ) : spotsLeft <= 3 ? (
                  <span className="font-semibold text-amber-700">Only {spotsLeft} spots left</span>
                ) : (
                  <span className="text-gray-500">{spotsLeft} spots left</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <StepNav onBack={onBack} onNext={onNext} backLabel="Back" />
    </StepCard>
  );
}

function ReviewStep({
  data, selectedCourses, totalFee, onSubmit, onBack, onEdit,
}: {
  data: FormData;
  selectedCourses: Course[];
  totalFee: number;
  onSubmit: () => void;
  onBack: () => void;
  onEdit: (s: Step) => void;
}) {
  const fullName = `${data.firstName} ${data.lastName}`.trim();
  const dob = data.dobMonth && data.dobDay && data.dobYear
    ? `${MONTHS[Number(data.dobMonth) - 1]} ${Number(data.dobDay)}, ${data.dobYear}`
    : '—';

  return (
    <StepCard title="Please review" subtitle="Double-check everything below, then submit your registration.">
      <ReviewSection title="About you" onEdit={() => onEdit('personal')}>
        <ReviewRow label="Name" value={fullName || '—'} />
        <ReviewRow label="Date of birth" value={dob} />
      </ReviewSection>

      <ReviewSection title="Contact" onEdit={() => onEdit('contact')}>
        <ReviewRow label="Email" value={data.email || '—'} />
        <ReviewRow label="Phone" value={data.phone || '—'} />
        <ReviewRow label="City" value={`${data.city}, ${data.state} ${data.zip}`} />
      </ReviewSection>

      <ReviewSection title={`Courses (${selectedCourses.length})`} onEdit={() => onEdit('courses')}>
        {selectedCourses.length === 0 ? (
          <p className="text-gray-500">No courses selected.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {selectedCourses.map(c => (
              <li key={c.id} className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-900">{c.title}</div>
                  <div className="text-sm text-gray-500">{c.day} · {c.time}</div>
                </div>
                <div className="font-semibold text-gray-900">${c.fee}</div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 pt-3 border-t-2 border-gray-200 flex items-center justify-between text-lg">
          <span className="font-semibold text-gray-700">Total due</span>
          <span className="font-bold text-gray-900">${totalFee.toFixed(0)}</span>
        </div>
      </ReviewSection>

      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <HelpCircle className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5" />
        <p className="text-sm sm:text-base text-amber-900">
          Payment is not required now. A member of our staff will contact you at
          <strong className="px-1">{data.phone || 'your phone'}</strong>
          to arrange payment by check, cash, or card.
        </p>
      </div>

      <StepNav
        onBack={onBack}
        onNext={onSubmit}
        backLabel="Back"
        nextLabel="Submit Registration"
      />
    </StepCard>
  );
}

function ReviewSection({
  title, onEdit, children,
}: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 text-blue-700 font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"
        >
          <Pencil className="w-4 h-4" />
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-base">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900 text-right">{value}</span>
    </div>
  );
}

function SuccessStep({
  data, selectedCourses, totalFee, onReset,
}: {
  data: FormData;
  selectedCourses: Course[];
  totalFee: number;
  onReset: () => void;
}) {
  const confirmation = useMemo(
    () => `KS-${Date.now().toString().slice(-6)}`,
    [],
  );

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
      <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
        <PartyPopper className="w-10 h-10 text-green-700" />
      </div>
      <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
        You're registered!
      </h1>
      <p className="mt-4 text-lg sm:text-xl text-gray-700 max-w-xl mx-auto">
        Thank you, {data.firstName}. A confirmation has been sent to
        <strong className="px-1">{data.email}</strong>.
      </p>

      <div className="mt-8 mx-auto max-w-md bg-gray-50 border border-gray-200 rounded-xl p-5 text-left">
        <div className="flex justify-between text-base">
          <span className="text-gray-600">Confirmation</span>
          <span className="font-mono font-semibold text-gray-900">{confirmation}</span>
        </div>
        <div className="flex justify-between text-base mt-2">
          <span className="text-gray-600">Courses</span>
          <span className="font-semibold text-gray-900">{selectedCourses.length}</span>
        </div>
        <div className="flex justify-between text-base mt-2 pt-2 border-t border-gray-200">
          <span className="text-gray-600">Total due</span>
          <span className="font-bold text-gray-900">${totalFee.toFixed(0)}</span>
        </div>
      </div>

      <p className="mt-6 text-gray-600 max-w-xl mx-auto">
        A staff member will call you within 2 business days to arrange payment.
        If you'd like to reach us first, call <strong>{HELP_PHONE}</strong>.
      </p>

      <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-xl-secondary"
        >
          <Printer className="w-5 h-5" />
          Print receipt
        </button>
        <button
          type="button"
          onClick={onReset}
          className="btn-xl-primary"
        >
          Register another person
        </button>
      </div>
    </section>
  );
}
