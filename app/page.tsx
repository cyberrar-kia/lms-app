"use client";
import { useState } from "react";
import PaystackButton from "@/components/PaystackButton";
import Link from "next/link";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const curriculum = [
    { title: "Module 1 — Introduction & Setup", lessons: 4 },
    { title: "Module 2 — Core Concepts", lessons: 6 },
    { title: "Module 3 — Practical Application", lessons: 5 },
    { title: "Module 4 — Advanced Techniques", lessons: 7 },
    { title: "Module 5 — Final Project", lessons: 3 },
  ];

  const faqs = [
    { q: "How long do I have access?", a: "Lifetime access — once you're in, you're in forever." },
    { q: "Can I get a refund?", a: "We offer a 7-day money-back guarantee if you're not satisfied." },
    { q: "Is this for beginners?", a: "Yes! The course is structured to take you from zero to confident." },
    { q: "How do I access the course after payment?", a: "You'll receive an email with login instructions immediately after payment." },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full bg-white border-b border-gray-100 z-50 px-6 py-4 flex justify-between items-center">
        <span className="font-bold text-xl text-brand">LearnHub</span>
        <Link href="/login" className="text-sm text-gray-600 hover:text-brand transition-colors">
          Already enrolled? Log in →
        </Link>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 max-w-4xl mx-auto text-center">
        <span className="inline-block bg-brand-light text-brand text-sm font-semibold px-4 py-1 rounded-full mb-6">
          Now Enrolling
        </span>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Master the Skills That<br />
          <span className="text-brand">Actually Pay You</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          A comprehensive, step-by-step course designed to take you from beginner to confident professional — at your own pace.
        </p>
        <PaystackButton />
        <p className="text-sm text-gray-400 mt-4">Secure payment · Instant access · 7-day money-back guarantee</p>
      </section>

      {/* WHAT YOU'LL LEARN */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What You'll Learn</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["In-demand skills from industry professionals", "Real-world projects you can add to your portfolio", "Step-by-step guidance from zero to advanced", "Access to a private student community", "Lifetime access to all course materials", "Certificate of completion"].map((item) => (
              <div key={item} className="flex items-start gap-3 bg-white p-4 rounded-xl border border-gray-100">
                <span className="text-brand text-xl">✓</span>
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CURRICULUM */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Course Curriculum</h2>
        <div className="space-y-3">
          {curriculum.map((mod, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-5 flex justify-between items-center hover:border-brand transition-colors">
              <span className="font-medium text-gray-800">{mod.title}</span>
              <span className="text-sm text-gray-400">{mod.lessons} lessons</span>
            </div>
          ))}
        </div>
      </section>

      {/* INSTRUCTOR */}
      <section className="bg-brand py-20 px-6">
        <div className="max-w-3xl mx-auto text-center text-white">
          <div className="w-24 h-24 bg-white/20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl">👨‍💻</div>
          <h2 className="text-3xl font-bold mb-4">Meet Your Instructor</h2>
          <p className="text-white/80 text-lg leading-relaxed">
            An experienced professional with years of hands-on industry experience. This course is built from real-world lessons — not theory.
          </p>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-20 px-6 max-w-lg mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Simple Pricing</h2>
        <p className="text-gray-500 mb-10">One payment. Lifetime access. No hidden fees.</p>
        <div className="border-2 border-brand rounded-2xl p-10 shadow-lg">
          <p className="text-5xl font-bold text-brand mb-2">₦25,000</p>
          <p className="text-gray-400 mb-8">One-time payment</p>
          <PaystackButton />
          <p className="text-sm text-gray-400 mt-4">7-day money-back guarantee</p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What Students Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Amaka O.", text: "This course completely changed my career trajectory. Worth every kobo." },
              { name: "Tunde B.", text: "Clear, practical, and straight to the point. I landed my first client in week 3." },
              { name: "Chioma E.", text: "The instructor actually cares. Best investment I've made this year." },
            ].map((t) => (
              <div key={t.name} className="bg-white p-6 rounded-xl border border-gray-100">
                <p className="text-gray-600 mb-4 italic">"{t.text}"</p>
                <p className="font-semibold text-gray-800">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex justify-between items-center p-5 text-left font-medium text-gray-800 hover:bg-gray-50"
              >
                {faq.q}
                <span className="text-brand">{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-gray-600">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} LearnHub. All rights reserved.
      </footer>
    </main>
  );
}
