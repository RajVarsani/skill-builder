'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="min-h-[100dvh] bg-canvas">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-5 max-w-[1400px] mx-auto">
        <span className="text-lg font-medium tracking-tight">Skill Builder</span>
        <Link
          href="/builder"
          className="rounded-full bg-text-primary px-5 py-2 text-sm font-medium text-white hover:bg-text-primary/90 transition-colors"
        >
          Get started
        </Link>
      </header>

      {/* Hero content */}
      <div className="max-w-[1400px] mx-auto px-8 pt-16 lg:pt-24">
        <div className="bg-surface rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden grid grid-cols-1 lg:grid-cols-2 min-h-[520px]">
          {/* Left — copy */}
          <div className="flex flex-col justify-center px-10 lg:px-16 py-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl tracking-tighter leading-none font-light text-text-primary"
            >
              Make AI
              <br />
              Think Like You
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 text-base text-text-secondary leading-relaxed max-w-[45ch]"
            >
              An AI interviews you, analyzes your work, and generates an
              installable skill that makes any compatible agent think and work
              like you.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex items-center gap-4"
            >
              <Link
                href="/builder"
                className="rounded-full bg-text-primary px-7 py-3 text-sm font-medium text-white hover:bg-text-primary/90 transition-colors active:scale-[0.98]"
              >
                Build Your Skill
              </Link>
            </motion.div>

            {/* Install command preview */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-10 rounded-xl bg-zinc-900 px-5 py-3 inline-flex items-center gap-3 max-w-fit"
            >
              <code className="text-sm text-zinc-300 font-mono">
                npx skills add acting-as-you
              </code>
            </motion.div>
          </div>

          {/* Right — gradient identity card preview */}
          <div className="relative overflow-hidden min-h-[400px]">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-300 via-orange-200 to-amber-200" />
            <div className="absolute inset-0 bg-gradient-to-tl from-violet-200/40 via-transparent to-transparent" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[40%] bg-white/60 rounded-full blur-3xl" />

            {/* Sample card content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full py-12 px-8">
              <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-sm border border-white/20 mb-4" />
              <p className="text-xl font-medium text-white drop-shadow-sm">Your Name</p>
              <p className="text-sm text-white/60 mt-1">Your Role</p>
              <p className="text-5xl font-light text-white tracking-tighter mt-6">100%</p>
              <div className="flex flex-wrap gap-1.5 justify-center mt-6">
                {['Pragmatic', 'Direct', 'Simplicity-first', 'Fast shipper'].map((trait) => (
                  <span
                    key={trait}
                    className="rounded-full px-3 py-1 text-xs font-medium bg-white/25 text-white backdrop-blur-sm border border-white/15"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-[1400px] mx-auto px-8 py-20">
        <h2 className="text-2xl font-light tracking-tight text-text-primary text-center mb-12">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Conversation', desc: 'AI interviews you about your expertise, opinions, and working style' },
            { step: '02', title: 'Analysis', desc: 'Share code, docs, or artifacts. AI verifies your patterns from real work' },
            { step: '03', title: 'Validation', desc: 'Test your skill in roleplay mode. Correct anything that feels off' },
            { step: '04', title: 'Publish', desc: 'Get an installable skill anyone can add with one command' },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="space-y-3"
            >
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                {item.step}
              </span>
              <h3 className="text-lg font-medium text-text-primary">{item.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
