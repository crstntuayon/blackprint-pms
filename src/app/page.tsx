"use client";

import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  Clock,
  Shield,
  FileText,
  Banknote,
  CheckCircle,
  Menu,
  X,
  Loader2,
  Eye,
  EyeOff,
  User,
  Printer,
  Scan,
  Image,
  Layers,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import NextImage from "next/image";

interface SizeRates {
  bwSingle: number;
  bwDouble: number;
  colorSingle: number;
  colorDouble: number;
  photoSingle: number;
  photoDouble: number;
}

interface PricingConfig {
  short: SizeRates;
  long: SizeRates;
  a4: SizeRates;
}

const defaultPricing: PricingConfig = {
  short: { bwSingle: 5, bwDouble: 3, colorSingle: 20, colorDouble: 15, photoSingle: 20, photoDouble: 50 },
  long: { bwSingle: 7, bwDouble: 5, colorSingle: 25, colorDouble: 20, photoSingle: 40, photoDouble: 80 },
  a4: { bwSingle: 5, bwDouble: 3, colorSingle: 20, colorDouble: 15, photoSingle: 20, photoDouble: 50 },
};

export default function HomePage() {
  // Auth panel state
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signedInRole, setSignedInRole] = useState<string | null>(null);
  const [pricing, setPricing] = useState<PricingConfig>(defaultPricing);

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regShowConfirm, setRegShowConfirm] = useState(false);
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalDocuments: 0,
    completedJobs: 0,
    turnaroundTime: "24h",
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setStats(data);
        }
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const servicesRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/settings/pricing")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error && data.short && data.long) {
          setPricing(data);
        }
      })
      .catch(() => {});
  }, []);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
    setLoginError("");
    setRegError("");
    setRegSuccess(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const result = await signIn("credentials", {
        username: loginUsername,
        password: loginPassword,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        setLoginError("Invalid username or password");
        setLoginLoading(false);
        return;
      }

      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role || "CLIENT";
      setSignedInRole(role);

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch {
      setLoginError("Something went wrong");
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError("");
    setRegSuccess(false);

    if (regPassword !== regConfirm) {
      setRegError("Passwords do not match");
      setRegLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, username: regUsername, email: regEmail, password: regPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setRegError(data.error || "Registration failed");
        setRegLoading(false);
        return;
      }

      setRegSuccess(true);
      setRegLoading(false);
      // Pre-fill login and switch after a short delay
      setLoginUsername(regUsername);
      setTimeout(() => {
        setAuthMode("login");
        setRegSuccess(false);
      }, 1500);
    } catch {
      setRegError("Something went wrong");
      setRegLoading(false);
    }
  };

  if (signedInRole) {
    const isAdmin = signedInRole === "ADMIN";
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            {isAdmin ? <Shield className="h-10 w-10 text-primary" /> : <User className="h-10 w-10 text-primary" />}
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Signing in as {isAdmin ? "Admin" : "Client"}</h2>
            <p className="text-muted-foreground">Redirecting to your dashboard...</p>
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NextImage src="/logo.png" alt="Black Print" width={120} height={45} className="h-9 w-auto" priority />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Home
            </button>
            <button onClick={() => scrollTo(servicesRef)} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Services
            </button>
            <button onClick={() => scrollTo(aboutRef)} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </button>
            <button onClick={() => scrollTo(featuresRef)} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </button>
            <button onClick={() => scrollTo(howItWorksRef)} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </button>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => openAuth("login")}>
              Sign In
            </Button>
            <Button size="sm" onClick={() => openAuth("register")}>
              Sign Up
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background px-4 py-4 space-y-3">
            <button onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setMobileMenuOpen(false); }} className="block w-full text-left text-sm font-medium py-2">
              Home
            </button>
            <button onClick={() => scrollTo(servicesRef)} className="block w-full text-left text-sm font-medium py-2">
              Services
            </button>
            <button onClick={() => scrollTo(aboutRef)} className="block w-full text-left text-sm font-medium py-2">
              About
            </button>
            <button onClick={() => scrollTo(featuresRef)} className="block w-full text-left text-sm font-medium py-2">
              Features
            </button>
            <button onClick={() => scrollTo(howItWorksRef)} className="block w-full text-left text-sm font-medium py-2">
              How It Works
            </button>
            <Separator />
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { openAuth("login"); setMobileMenuOpen(false); }}>
                Sign In
              </Button>
              <Button className="flex-1" onClick={() => { openAuth("register"); setMobileMenuOpen(false); }}>
                Sign Up
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative border-b">
        <div className="max-w-5xl mx-auto px-4 py-20 md:py-32 text-center">
          <div className="flex justify-center mb-6">
            <NextImage src="/logo.png" alt="Black Print" width={240} height={90} className="h-24 w-auto" priority />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Fast & Affordable Printing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            High-quality printing services for students, professionals, and businesses. Upload your files, choose your options, and pick up in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => openAuth("register")}>
              Get Started
            </Button>
            <Button variant="outline" size="lg" onClick={() => scrollTo(servicesRef)}>
              View Services
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section ref={servicesRef} className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-2">Our Services</h2>
        <p className="text-muted-foreground text-center mb-10">Quality printing at competitive prices</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* B&W Print */}
          <Card className="overflow-hidden group">
            <div className="relative h-40 bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center">
              <Printer className="h-16 w-16 text-white/80 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2">B&W Print</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">Short ₱{pricing.short.bwSingle}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">Long ₱{pricing.long.bwSingle}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">A4 ₱{pricing.a4.bwSingle}</span>
              </div>
              <p className="text-sm text-muted-foreground">Add ₱1–₱3 for heavy ink coverage</p>
            </CardContent>
          </Card>

          {/* Colored Print */}
          <Card className="overflow-hidden group">
            <div className="relative h-40 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Printer className="h-16 w-16 text-white/80 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2">Colored Print</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Short ₱{pricing.short.colorSingle}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Long ₱{pricing.long.colorSingle}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">A4 ₱{pricing.a4.colorSingle}</span>
              </div>
              <p className="text-sm text-muted-foreground">Price may increase for photo/high-quality prints</p>
            </CardContent>
          </Card>

          {/* Xerox B&W */}
          <Card className="overflow-hidden group">
            <div className="relative h-40 bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center">
              <Layers className="h-16 w-16 text-white/80 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2">Xerox B&W</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Short ₱{pricing.short.bwDouble}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Long ₱{pricing.long.bwDouble}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">A4 ₱{pricing.a4.bwDouble}</span>
              </div>
              <p className="text-sm text-muted-foreground">Per page / copy</p>
            </CardContent>
          </Card>

          {/* Colored Xerox */}
          <Card className="overflow-hidden group">
            <div className="relative h-40 bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
              <Layers className="h-16 w-16 text-white/80 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2">Colored Xerox</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">Short ₱{pricing.short.colorDouble}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">Long ₱{pricing.long.colorDouble}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">A4 ₱{pricing.a4.colorDouble}</span>
              </div>
              <p className="text-sm text-muted-foreground">Per page / copy</p>
            </CardContent>
          </Card>

          {/* Scan */}
          <Card className="overflow-hidden group">
            <div className="relative h-40 bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <Scan className="h-16 w-16 text-white/80 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2">Scan</h3>
              <div className="flex gap-2 mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Short ₱10</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Long ₱15</span>
              </div>
              <p className="text-sm text-muted-foreground">Per page</p>
            </CardContent>
          </Card>

          {/* Lamination */}
          <Card className="overflow-hidden group">
            <div className="relative h-40 bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
              <Shield className="h-16 w-16 text-white/80 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2">Lamination</h3>
              <div className="flex gap-2 mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Short ₱50</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Long ₱70</span>
              </div>
              <p className="text-sm text-muted-foreground">ID Size: ₱20–₱35</p>
            </CardContent>
          </Card>

          {/* Photo Printing */}
          <Card className="overflow-hidden group sm:col-span-2 lg:col-span-1">
            <div className="relative h-40 bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <Image className="h-16 w-16 text-white/80 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2">Photo Printing</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700">Short ₱{pricing.short.photoSingle}–₱{pricing.short.photoDouble}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700">Long ₱{pricing.long.photoSingle}–₱{pricing.long.photoDouble}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700">A4 ₱{pricing.a4.photoSingle}–₱{pricing.a4.photoDouble}</span>
              </div>
              <p className="text-sm text-muted-foreground">2x2, 4R, 5R, glossy photo paper</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About Section */}
      <section ref={aboutRef} className="bg-muted/50 border-y">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-4">About Black Print</h2>
              <p className="text-muted-foreground mb-4 text-justify">
                Black Print is your trusted local printing partner based in Dauin, Negros Oriental. We provide fast, reliable, and affordable printing services for students, professionals, and businesses in the community.
              </p>
              <p className="text-muted-foreground mb-4 text-justify">
                With our modern online system, you can upload documents, configure print settings, and track your job status — all from your phone or computer. No more waiting in long queues. Visit us at Tugawe, Dauin and experience hassle-free printing today.
              </p>
              <div className="space-y-3 mt-6">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span>Tugawe, Dauin, Negros Oriental, Philippines 6217</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <span>+63 936 8726 547</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <span>nelsontuayon26@gmail.com</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 border rounded-lg bg-background text-center">
                <p className="text-3xl font-bold text-primary">
                  {statsLoading ? "..." : stats.totalCustomers}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Happy Customers</p>
              </div>
              <div className="p-6 border rounded-lg bg-background text-center">
                <p className="text-3xl font-bold text-primary">
                  {statsLoading ? "..." : stats.totalDocuments}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Documents Printed</p>
              </div>
              <div className="p-6 border rounded-lg bg-background text-center">
                <p className="text-3xl font-bold text-primary">{stats.turnaroundTime}</p>
                <p className="text-sm text-muted-foreground mt-1">Turnaround Time</p>
              </div>
              <div className="p-6 border rounded-lg bg-background text-center">
                <p className="text-3xl font-bold text-primary">
                  {statsLoading ? "..." : stats.completedJobs}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Completed Jobs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Features</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Upload className="h-6 w-6 text-primary mb-2" />
              <CardTitle>Easy Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Drag and drop PDFs, Word docs, and images. Configure copies, color, and paper size in seconds.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-6 w-6 text-primary mb-2" />
              <CardTitle>Live Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Track your print job status in real-time from upload to completion.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-6 w-6 text-primary mb-2" />
              <CardTitle>Admin Control</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Powerful admin dashboard to manage the print queue, users, pricing, and printers.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section ref={howItWorksRef} className="bg-muted/50 border-y">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">1</div>
              <h3 className="font-semibold">Upload</h3>
              <p className="text-sm text-muted-foreground">Upload your document and select print options</p>
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">2</div>
              <h3 className="font-semibold">Queue</h3>
              <p className="text-sm text-muted-foreground">Your job enters the print queue automatically</p>
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">3</div>
              <h3 className="font-semibold">Print</h3>
              <p className="text-sm text-muted-foreground">Admin processes and prints your document</p>
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">4</div>
              <h3 className="font-semibold">Pickup</h3>
              <p className="text-sm text-muted-foreground">Pay at the counter and pick up your prints</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Preview */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Built for Scale</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-6 border rounded-lg">
            <FileText className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">PDF Support</p>
            <p className="text-sm text-muted-foreground">Automatic page counting</p>
          </div>
          <div className="text-center p-6 border rounded-lg">
            <Banknote className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">Flexible Pricing</p>
            <p className="text-sm text-muted-foreground">B&W and color rates</p>
          </div>
          <div className="text-center p-6 border rounded-lg">
            <CheckCircle className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">Status Tracking</p>
            <p className="text-sm text-muted-foreground">From queue to complete</p>
          </div>
          <div className="text-center p-6 border rounded-lg">
            <Shield className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">Role Based</p>
            <p className="text-sm text-muted-foreground">Clients and Admins</p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to simplify your printing?</h2>
          <p className="text-muted-foreground mb-6">Create an account and submit your first print job in under a minute.</p>
          <Button size="lg" onClick={() => openAuth("register")}>Create Free Account</Button>
        </div>
      </section>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="flex justify-center mb-2">
          <NextImage src="/logo.png" alt="Black Print" width={80} height={30} className="h-8 w-auto opacity-70" />
        </div>
        PMS — Local-first printing management system.
      </footer>

      {/* Auth Slide-in Panel */}
      <Sheet open={authOpen} onOpenChange={setAuthOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <div className="flex justify-center mb-4">
              <NextImage src="/logo.png" alt="Black Print" width={140} height={52} className="h-12 w-auto" priority />
            </div>
            <SheetTitle className="text-center text-2xl">
              {authMode === "login" ? "Welcome Back" : "Create Account"}
            </SheetTitle>
            <p className="text-center text-sm text-muted-foreground">
              {authMode === "login" ? "Sign in to your account" : "Register as a new client"}
            </p>
          </SheetHeader>

          {authMode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4 px-4 pb-6">
              {loginError && (
                <Alert variant="destructive">
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="login-username">Username</Label>
                <Input
                  id="login-username"
                  type="text"
                  placeholder="Enter your username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={loginShowPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setLoginShowPassword(!loginShowPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {loginShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setAuthMode("register"); setLoginError(""); }}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4 px-4 pb-6">
              {regError && (
                <Alert variant="destructive">
                  <AlertDescription>{regError}</AlertDescription>
                </Alert>
              )}
              {regSuccess && (
                <Alert>
                  <AlertDescription>Account created! Redirecting to sign in...</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="reg-name">Full Name</Label>
                <Input
                  id="reg-name"
                  placeholder="John Doe"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-username">Username</Label>
                <Input
                  id="reg-username"
                  type="text"
                  placeholder="johndoe"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={regShowPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setRegShowPassword(!regShowPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {regShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-confirm">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="reg-confirm"
                    type={regShowConfirm ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setRegShowConfirm(!regShowConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {regShowConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={regLoading || regSuccess}>
                {regLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setAuthMode("login"); setRegError(""); }}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
