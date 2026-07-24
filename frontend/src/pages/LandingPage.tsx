import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRight, GraduationCap, Award, TrendingUp, Bot, 
  FilePieChart, Activity, Building2, Users, CheckCircle, 
  MessageSquare, Send, Github, Linkedin, MapPin, Mail, Phone,
  ChevronDown, Star, Sparkles
} from 'lucide-react'

// Custom hook to animate numbers on scroll/mount
function useAnimatedCounter(target: number, duration: number = 2000, trigger: boolean = true) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!trigger) return
    let start = 0
    const end = target
    const range = end - start
    const increment = end > start ? 1 : -1
    const stepTime = Math.abs(Math.floor(duration / range))
    
    // Fallback if stepTime is 0 or range is too large
    if (stepTime === 0 || range > 1000) {
      const step = Math.ceil(range / 60) // 60 fps
      const timer = setInterval(() => {
        start += step
        if (start >= end) {
          setCount(end)
          clearInterval(timer)
        } else {
          setCount(start)
        }
      }, 1000 / 60)
      return () => clearInterval(timer)
    }

    const timer = setInterval(() => {
      start += increment
      setCount(start)
      if (start === end) {
        clearInterval(timer)
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [target, duration, trigger])

  return count
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({})
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [statsTrigger, setStatsTrigger] = useState(false)

  // Trigger counters after 500ms
  useEffect(() => {
    const timer = setTimeout(() => setStatsTrigger(true), 400)
    return () => clearTimeout(timer)
  }, [])

  const studentsCount = useAnimatedCounter(20000, 1500, statsTrigger)
  const facultyCount = useAnimatedCounter(24, 1500, statsTrigger)
  const deptCount = useAnimatedCounter(8, 1500, statsTrigger)
  const placementRate = useAnimatedCounter(14, 1500, statsTrigger)

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}
    if (!contactForm.name.trim()) errors.name = 'Name is required'
    if (!contactForm.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(contactForm.email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (!contactForm.subject.trim()) errors.subject = 'Subject is required'
    if (!contactForm.message.trim()) errors.message = 'Message is required'

    if (Object.keys(errors).length > 0) {
      setContactErrors(errors)
      return
    }

    setContactErrors({})
    setFormSubmitted(true)
    setTimeout(() => {
      setFormSubmitted(false)
      setContactForm({ name: '', email: '', subject: '', message: '' })
    }, 4000)
  }

  const features = [
    { icon: GraduationCap, title: "AI Academic Analytics", desc: "Granular statistics mapping student performance distributions and term metrics." },
    { icon: Activity, title: "Risk Prediction", desc: "Flag at-risk students automatically using LightGBM machine learning models." },
    { icon: Award, title: "Placement Prediction", desc: "Calculate placement probability and recommend targeted job search actions." },
    { icon: TrendingUp, title: "Attendance Analytics", desc: "Visualize and forecast cumulative attendance using seasonal forecasters." },
    { icon: Bot, title: "Explainable AI & RAG", desc: "Hybrid semantic chatbot answering complex academic queries using SQL + FAISS." },
    { icon: FilePieChart, title: "PDF & Excel Reports", desc: "Download high-fidelity Excel department reports and student PDF report cards." },
  ]

  const faqs = [
    { q: "What is CampusIQ AI?", a: "CampusIQ AI is an enterprise-grade academic intelligence dashboard designed to predict student outcomes, analyze placement metrics, and assist educational leaders with ML-based forecasts." },
    { q: "How does the AI Risk predictor work?", a: "It utilizes a LightGBM classification model trained on cumulative CGPA, attendance rates, backlogs, and test marks to assign risk probabilities to students." },
    { q: "Can I download department summaries?", a: "Yes, administrators and principals can download comprehensive department summaries in Excel format containing structural KPIs and placement lists." },
    { q: "How is the AI assistant context-aware?", a: "It implements a Retrieval-Augmented Generation (RAG) framework using FAISS to vectorize student profiles and answer queries combined with structured SQL database fetches." }
  ]

  const testimonials = [
    { name: "Dr. Rajesh Kumar", role: "HOD Computer Science", quote: "The predictive metrics allowed us to identify students needing special assistance two months before examinations.", stars: 5 },
    { name: "Prof. Amit Verma", role: "Faculty Coordinator", quote: "Generating department Excel lists and student reports is now automated, saving hours of manual compilation.", stars: 5 }
  ]

  const techs = ["React", "FastAPI", "MySQL", "XGBoost", "CatBoost", "LightGBM", "LangChain", "TailwindCSS"]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Header / Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-600 rounded-xl">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 bg-clip-text text-transparent">
              CampusIQ AI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')} 
              className="text-sm font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/login')} 
              className="btn-primary flex items-center gap-1.5 py-1.5 px-4 rounded-xl text-sm"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-gradient-to-br from-indigo-50/40 via-purple-50/20 to-slate-50 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-full border border-indigo-100 dark:border-indigo-900 mb-6"
          >
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">AI-Powered Academic Intelligence Platform</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black tracking-tight text-slate-950 dark:text-white max-w-4xl mx-auto leading-[1.1]"
          >
            Maximize Student Success with{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 bg-clip-text text-transparent">
              Explainable Predictive AI
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mt-6"
          >
            Predict performance, optimize placements, and forecast retention using high-fidelity model explanations, RAG assistants, and administrative metrics.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center gap-4 mt-10"
          >
            <button onClick={() => navigate('/login')} className="btn-primary px-8 py-3 rounded-2xl flex items-center gap-2 text-base shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all">
              Launch Platform <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/login')} className="btn-secondary px-8 py-3 rounded-2xl text-base bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              Developer Demo
            </button>
          </motion.div>
        </div>
      </section>

      {/* Statistics Counters */}
      <section className="py-12 border-y border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Active Students", value: studentsCount, suffix: "+" },
            { label: "Faculty Mentors", value: facultyCount, suffix: "" },
            { label: "Academic Departments", value: deptCount, suffix: "" },
            { label: "Placement Rate", value: placementRate, suffix: "%" }
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {stat.value.toLocaleString()}{stat.suffix}
              </div>
              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">Full Features Integration</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Everything you need to orchestrate administrative and student decisions.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon
            return (
              <motion.div 
                whileHover={{ y: -5 }}
                key={idx} 
                className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center mb-5 border border-indigo-100/50 dark:border-indigo-900/50">
                  <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Tech Stack Animated List */}
      <section className="py-16 bg-slate-100/50 dark:bg-slate-900/30 border-y border-slate-200/40 dark:border-slate-800/40">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 mb-8">Technology Stack Powering CampusIQ AI</h3>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
            {techs.map((tech, idx) => (
              <span 
                key={idx} 
                className="text-lg font-bold tracking-tight text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Slider */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 items-center">
          <div className="md:col-span-1">
            <h2 className="text-3xl font-bold tracking-tight">Voices of Administrators</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Hear from leaders managing student pathways with AI explanations.</p>
          </div>
          <div className="md:col-span-2 grid sm:grid-cols-2 gap-6">
            {testimonials.map((test, idx) => (
              <div key={idx} className="p-6 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-sm relative">
                <div className="flex gap-1 mb-4">
                  {[...Array(test.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm italic text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">"{test.quote}"</p>
                <div>
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white">{test.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{test.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Accordion */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button 
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between font-semibold text-left"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {activeFaq === idx && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4 pt-1 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/50 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12">
          
          {/* Info and Icons */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Get in Touch</h2>
              <p className="text-slate-600 dark:text-slate-400 mt-2">Have a question or request regarding predictive analytics integrations?</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <span className="text-sm">CampusIQ HQ, Academic Sector, Block-A</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-indigo-600" />
                <span className="text-sm">support@campusiq.ai</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-indigo-600" />
                <span className="text-sm">+1 (555) 234-5678</span>
              </div>
            </div>

            <div className="flex gap-4">
              <a href="#" className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"><Github className="w-5 h-5" /></a>
              <a href="#" className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
            {formSubmitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-12"
              >
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950 rounded-2xl flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold">Message Sent Successfully!</h3>
                <p className="text-sm text-slate-500 mt-1">Thank you. We will get back to you shortly.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Your Name</label>
                  <input
                    value={contactForm.name}
                    onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                    className="input"
                    placeholder="Enter your name"
                  />
                  {contactErrors.name && <p className="text-xs text-red-500 mt-1">{contactErrors.name}</p>}
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    value={contactForm.email}
                    onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                    className="input"
                    placeholder="name@university.edu"
                  />
                  {contactErrors.email && <p className="text-xs text-red-500 mt-1">{contactErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
                  <input
                    value={contactForm.subject}
                    onChange={e => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="input"
                    placeholder="How can we help?"
                  />
                  {contactErrors.subject && <p className="text-xs text-red-500 mt-1">{contactErrors.subject}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Message</label>
                  <textarea
                    rows={4}
                    value={contactForm.message}
                    onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                    className="input py-2.5 resize-none"
                    placeholder="Your message details..."
                  />
                  {contactErrors.message && <p className="text-xs text-red-500 mt-1">{contactErrors.message}</p>}
                </div>

                <button type="submit" className="btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-1.5">
                  <Send className="w-4 h-4" /> Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-100 dark:bg-slate-900 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500 dark:text-slate-400">
          <div>© {new Date().getFullYear()} CampusIQ AI. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-indigo-600">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
