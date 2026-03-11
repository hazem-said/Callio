import Link from 'next/link'
import {
  Phone,
  CalendarDays,
  ShoppingBag,
  MessageSquare,
  Mic,
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
  Shield,
  Clock,
  BarChart3,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  {
    icon: Phone,
    title: 'Answers Every Call',
    description: 'Never miss a call again. Callio picks up instantly, 24/7, including holidays and after hours.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    icon: CalendarDays,
    title: 'Books Reservations',
    description: 'Checks availability in real-time, collects guest details, and confirms bookings — all automatically.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: ShoppingBag,
    title: 'Takes Orders',
    description: 'Handles pickup and delivery orders over the phone, reads the menu, and places them directly into your dashboard.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: MessageSquare,
    title: 'Answers Questions',
    description: 'Knows your hours, address, menu, specials, parking, and more. Handles FAQs instantly.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: BarChart3,
    title: 'Call Analytics',
    description: 'Track call volume, reservations booked, orders placed, and more from a beautiful dashboard.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    icon: Globe,
    title: 'Multi-Language',
    description: 'Serve more customers with support for multiple languages. Configure your preferred language per restaurant.',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
]

const steps = [
  {
    step: '01',
    title: 'Connect a Twilio Number',
    description: 'Get a phone number from Twilio and paste your webhook URL. Takes 2 minutes.',
  },
  {
    step: '02',
    title: 'Set Up Your Restaurant',
    description: 'Add your menu, hours, address, and customize your AI receptionist\'s name and personality.',
  },
  {
    step: '03',
    title: 'Start Taking Calls',
    description: 'Your AI goes live immediately — booking tables, taking orders, and answering questions around the clock.',
  },
]

const plans = [
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    description: 'Perfect for small cafes and bistros',
    features: [
      '100 calls/month',
      'Reservations & orders',
      'Call transcripts',
      'Basic analytics',
      'Email support',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$149',
    period: '/month',
    description: 'For busy restaurants handling high call volume',
    features: [
      '500 calls/month',
      'Everything in Starter',
      'Priority response',
      'Advanced analytics',
      'Custom AI personality',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For restaurant groups and chains',
    features: [
      'Unlimited calls',
      'Multiple locations',
      'White-label options',
      'API access',
      'Dedicated support',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

const testimonials = [
  {
    quote: "Callio handles about 80% of our incoming calls now. My staff can actually focus on the guests in front of them instead of being stuck on the phone.",
    name: "Maria Gonzalez",
    role: "Owner, Casa Bella Italian",
    rating: 5,
  },
  {
    quote: "We were losing reservations every night because calls went unanswered. Since Callio, we've seen a 40% increase in bookings.",
    name: "David Park",
    role: "Manager, Seoul Garden",
    rating: 5,
  },
  {
    quote: "The AI is shockingly good at handling our complex menu questions. Guests often don't realize they're talking to an AI.",
    name: "Emma Richardson",
    role: "Owner, The Riverside Grill",
    rating: 5,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">Callio</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 rounded-full px-4 py-2 text-sm text-indigo-300 mb-8">
            <Zap size={14} className="text-indigo-400" />
            Powered by GPT-4o + Twilio Voice
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
            Your AI Receptionist,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Always Available
            </span>
          </h1>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Callio answers your restaurant&apos;s phone calls 24/7 — books reservations, takes orders, 
            and answers questions. No more missed calls, no more overwhelmed staff.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/register">
              <Button size="xl" className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/30">
                Start Free 14-Day Trial <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="xl" variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                View Demo Dashboard
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { value: '24/7', label: 'Always On' },
              { value: '<2s', label: 'Response Time' },
              { value: '95%+', label: 'Satisfaction Rate' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-400 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Everything your phone needs to do
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Callio handles the full spectrum of restaurant phone calls so your team can focus on what they do best.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-200 group"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Live in under 10 minutes</h2>
            <p className="text-lg text-slate-500">No complex setup, no developers needed.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-indigo-200 z-0 -translate-x-1/2" />
                )}
                <div className="relative z-10">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold text-xl mb-4 shadow-lg shadow-indigo-500/30">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-slate-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Loved by restaurant owners</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-600 italic mb-4 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="font-semibold text-slate-900">{t.name}</p>
                <p className="text-sm text-slate-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-slate-50" id="pricing">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-slate-500">Start free for 14 days. No credit card required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 scale-105'
                    : 'bg-white border border-slate-200'
                }`}
              >
                <div className="mb-6">
                  <h3 className={`text-xl font-bold mb-1 ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-4 ${plan.highlighted ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-extrabold ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className={`text-sm ${plan.highlighted ? 'text-indigo-200' : 'text-slate-500'}`}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5">
                      <CheckCircle
                        size={16}
                        className={plan.highlighted ? 'text-indigo-200' : 'text-indigo-600'}
                      />
                      <span className={`text-sm ${plan.highlighted ? 'text-indigo-100' : 'text-slate-600'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href="/register" className="block">
                  <Button
                    className={`w-full ${
                      plan.highlighted
                        ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                        : ''
                    }`}
                    variant={plan.highlighted ? 'secondary' : 'default'}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 mx-auto mb-6">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Stop missing calls. Start growing.
          </h2>
          <p className="text-xl text-indigo-200 mb-8">
            Join hundreds of restaurants using Callio to deliver a better guest experience around the clock.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="xl" className="bg-white text-indigo-600 hover:bg-indigo-50">
                Start Free Trial <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
          <p className="text-indigo-300 text-sm mt-4 flex items-center justify-center gap-2">
            <Clock size={14} />
            14-day free trial · No credit card · Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Mic className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">Callio</span>
          </div>
          <p className="text-sm text-slate-400">
            © 2025 Callio. Built with Next.js, OpenAI & Twilio.
          </p>
          <div className="flex gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
