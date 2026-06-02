"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { Upload, FileText, Loader2, X, Check, Wallet, Banknote, Image, Pencil, FileImage, Clock, CalendarDays } from "lucide-react";

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

interface UploadedFile {
  id: string;
  file: File;
  actualPages: number | null;
  userPageCount: number;
  photoPages: number;
  pageSource: "auto" | "manual";
  readingPages: boolean;
}

const defaultSizeRates: SizeRates = {
  bwSingle: 5.0,
  bwDouble: 3.0,
  colorSingle: 20.0,
  colorDouble: 15.0,
  photoSingle: 20.0,
  photoDouble: 50.0,
};

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [copies, setCopies] = useState(1);
  const [color, setColor] = useState(false);
  const [duplex, setDuplex] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"E_WALLET" | "CASH">("CASH");
  const [paperSize, setPaperSize] = useState<"SHORT" | "LONG" | "A4">("A4");
  const [pickupDate, setPickupDate] = useState<string>("");
  const [pickupTime, setPickupTime] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [pricing, setPricing] = useState<PricingConfig>({
    short: { ...defaultSizeRates },
    long: { ...defaultSizeRates, bwSingle: 7.0, bwDouble: 5.0, colorSingle: 25.0, colorDouble: 20.0, photoSingle: 40.0, photoDouble: 80.0 },
    a4: { ...defaultSizeRates },
  });

  useEffect(() => {
    fetch("/api/settings/pricing")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setPricing(data);
      })
      .catch(() => {});
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const countPdfPages = async (file: File): Promise<number> => {
    try {
      const bytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes);
      return pdfDoc.getPageCount();
    } catch {
      return 1;
    }
  };

  const countPdfPhotoPages = async (file: File): Promise<number> => {
    try {
      const bytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes);
      let imagePages = 0;
      for (let i = 0; i < pdfDoc.getPageCount(); i++) {
        const page = pdfDoc.getPage(i);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const node = (page as any).node;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resources = node?.Resources ? (node.Resources as any)() : null;
        if (resources) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const xObjects = resources.lookup?.("XObject") as any;
          if (xObjects) {
            const keys = xObjects.keys ? xObjects.keys() : Object.keys(xObjects);
            let hasImage = false;
            for (const key of keys) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const obj = xObjects.lookup ? xObjects.lookup(key) : xObjects[key];
              if (obj) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const subtype = obj.lookup ? obj.lookup("Subtype") : null;
                if (subtype && String(subtype).includes("Image")) {
                  hasImage = true;
                  break;
                }
              }
            }
            if (hasImage) imagePages++;
          }
        }
      }
      return imagePages;
    } catch {
      return 0;
    }
  };

  const countDocxPages = async (file: File): Promise<number | null> => {
    try {
      const zip = await JSZip.loadAsync(file);
      const appXml = await zip.file("docProps/app.xml")?.async("text");
      if (appXml) {
        const match = appXml.match(/<Pages>(\d+)<\/Pages>/);
        if (match) return parseInt(match[1], 10);
      }
      return null;
    } catch {
      return null;
    }
  };

  const countDocxImages = async (file: File): Promise<number> => {
    try {
      const zip = await JSZip.loadAsync(file);
      const documentXml = await zip.file("word/document.xml")?.async("text");
      if (documentXml) {
        const drawings = (documentXml.match(/<w:drawing/g) || []).length;
        const picts = (documentXml.match(/<w:pict/g) || []).length;
        return drawings + picts;
      }
      return 0;
    } catch {
      return 0;
    }
  };

  const processFile = async (selectedFile: File) => {
    const id = generateId();
    const upload: UploadedFile = {
      id,
      file: selectedFile,
      actualPages: null,
      userPageCount: 1,
      photoPages: 0,
      pageSource: "auto",
      readingPages: true,
    };
    setFiles((prev) => [...prev, upload]);

    const name = selectedFile.name.toLowerCase();
    let pages: number | null = null;
    let photos = 0;

    if (name.endsWith(".pdf")) {
      pages = await countPdfPages(selectedFile);
      photos = await countPdfPhotoPages(selectedFile);
    } else if (name.endsWith(".docx")) {
      pages = await countDocxPages(selectedFile);
      const imageCount = await countDocxImages(selectedFile);
      photos = Math.min(imageCount, pages ?? 1);
    } else if (name.match(/\.(png|jpg|jpeg)$/)) {
      // Image files count as 1 page
      pages = 1;
      photos = 1;
    }

    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        if (pages !== null && pages > 0) {
          return { ...f, actualPages: pages, userPageCount: pages, photoPages: photos, pageSource: "auto", readingPages: false };
        }
        return { ...f, actualPages: null, userPageCount: 1, photoPages: photos, pageSource: "manual", readingPages: false };
      })
    );
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      Array.from(e.dataTransfer.files).forEach((f) => processFile(f));
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((f) => processFile(f));
      e.target.value = "";
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFile = (id: string, updates: Partial<UploadedFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const getRates = () => {
    const key = paperSize.toLowerCase() as "short" | "long" | "a4";
    return pricing[key];
  };

  const getTextRate = () => {
    const rates = getRates();
    return duplex ? rates.colorDouble : rates.colorSingle;
  };

  const getPhotoRate = () => {
    const rates = getRates();
    return duplex ? rates.photoDouble : rates.photoSingle;
  };

  const getBwRate = () => {
    const rates = getRates();
    return duplex ? rates.bwDouble : rates.bwSingle;
  };

  const effectivePages = (f: UploadedFile) =>
    f.pageSource === "auto" ? (f.actualPages ?? 1) : f.userPageCount;

  const fileCost = (f: UploadedFile): number => {
    const pages = effectivePages(f);
    if (!color) {
      const rate = getBwRate();
      return pages * copies * rate;
    }
    const textPg = Math.max(0, pages - f.photoPages);
    return (textPg * getTextRate() + f.photoPages * getPhotoRate()) * copies;
  };

  const totalCost = () => {
    const total = files.reduce((sum, f) => sum + fileCost(f), 0);
    return total.toFixed(2);
  };

  const totalPagesAll = () =>
    files.reduce((sum, f) => sum + effectivePages(f), 0);

  const totalPhotoPagesAll = () =>
    files.reduce((sum, f) => sum + f.photoPages, 0);

  const anyReading = files.some((f) => f.readingPages);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    const results: { jobId: string; pages: number }[] = [];

    try {
      for (const upload of files) {
        const formData = new FormData();
        formData.append("file", upload.file);
        formData.append("copies", copies.toString());
        formData.append("color", color.toString());
        formData.append("duplex", duplex.toString());
        formData.append("paymentMethod", paymentMethod);
        formData.append("photoPages", upload.photoPages.toString());
        formData.append("paperSize", paperSize);
        if (pickupDate && pickupTime) {
          formData.append("pickupAt", new Date(`${pickupDate}T${pickupTime}`).toISOString());
        }

        const response = await fetch("/api/print", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          results.push({ jobId: data.jobId, pages: data.pages });
        }
      }

      if (results.length > 0) {
        const totalPg = results.reduce((s, r) => s + r.pages, 0);
        toast({
          title: `${results.length} print job${results.length > 1 ? "s" : ""} created!`,
          description: `${totalPg} total pages queued for printing.`,
        });
        router.push("/dashboard/jobs");
      } else {
        throw new Error("No jobs created");
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload some files. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const fileIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.match(/\.(png|jpg|jpeg)$/)) return <FileImage className="h-8 w-8 text-primary" />;
    return <FileText className="h-8 w-8 text-primary" />;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload & Print</h1>
        <p className="text-muted-foreground">Upload one or more documents and configure print settings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Drop Zone */}
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Upload PDF, DOCX, or image files</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive ? "border-primary bg-primary/5" : "border-muted"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">
                {files.length > 0 ? "Add more files" : "Drag & drop your files here"}
              </p>
              <p className="text-xs text-muted-foreground mb-3">or click to browse</p>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                className="hidden"
                id="file-upload"
                multiple
                onChange={handleFileChange}
              />
              <Button type="button" variant="outline" size="sm" asChild>
                <label htmlFor="file-upload">{files.length > 0 ? "Add Files" : "Choose Files"}</label>
              </Button>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-3">
                {files.map((upload) => {
                  const isDocx = upload.file.name.toLowerCase().endsWith(".docx");
                  const showManual = isDocx && (upload.actualPages === null || upload.actualPages <= 1);
                  const effPages = effectivePages(upload);

                  return (
                    <div key={upload.id} className="space-y-3">
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3 min-w-0">
                          {fileIcon(upload.file.name)}
                          <div className="min-w-0">
                            <p className="font-medium truncate">{upload.file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                              {upload.actualPages !== null && (
                                <span className="ml-2 text-primary font-medium">
                                  · {upload.actualPages} pages auto-detected
                                  {upload.photoPages > 0 && ` (${upload.photoPages} with images)`}
                                </span>
                              )}
                              {upload.readingPages && (
                                <span className="ml-2 text-muted-foreground">· analyzing...</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(upload.id)}
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Manual page count override for DOCX */}
                      {showManual && (
                        <div className="p-4 border border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg space-y-3">
                          <div className="flex items-start gap-3">
                            <Pencil className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-sm">Could not auto-detect page count</p>
                              <p className="text-xs text-muted-foreground">
                                DOCX files don&apos;t store page counts. Please check your document and enter the correct page count below.
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-sm">Total Pages</Label>
                              <Input
                                type="number"
                                min={1}
                                value={upload.userPageCount}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  updateFile(upload.id, { userPageCount: val, pageSource: "manual" });
                                }}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-sm">Pages with Photos</Label>
                              <Input
                                type="number"
                                min={0}
                                max={upload.userPageCount}
                                value={upload.photoPages}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  updateFile(upload.id, { photoPages: Math.min(val, upload.userPageCount) });
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* PDF or DOCX with metadata - allow editing too */}
                      {!showManual && !upload.readingPages && (
                        <div className="p-4 border rounded-lg space-y-3">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                            Verify page count
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-sm">Total Pages</Label>
                              <Input
                                type="number"
                                min={1}
                                value={upload.userPageCount}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  updateFile(upload.id, { userPageCount: val, pageSource: "manual" });
                                }}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-sm">Pages with Photos</Label>
                              <Input
                                type="number"
                                min={0}
                                max={effPages}
                                value={upload.photoPages}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  updateFile(upload.id, { photoPages: Math.min(val, effPages) });
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Print Settings</CardTitle>
            <CardDescription>Applied to all uploaded documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Copies: {copies}</Label>
              <Slider
                value={[copies]}
                onValueChange={(v) => setCopies(v[0])}
                min={1}
                max={50}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Paper Size</Label>
              <div className="grid grid-cols-3 gap-3">
                {(["SHORT", "LONG", "A4"] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPaperSize(size)}
                    className={`border-2 rounded-lg p-3 text-sm font-medium transition-colors ${
                      paperSize === size
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-muted hover:border-muted-foreground text-muted-foreground"
                    }`}
                  >
                    {size === "SHORT" && "Short (Letter)"}
                    {size === "LONG" && "Long (Legal)"}
                    {size === "A4" && "A4"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Color Printing</Label>
                <p className="text-sm text-muted-foreground">
                  ₱{getRates().colorSingle}/page text · ₱{getRates().photoSingle}/page photo
                </p>
              </div>
              <Switch checked={color} onCheckedChange={setColor} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Xerox / Standard Copy</Label>
                <p className="text-sm text-muted-foreground">
                  Use cheaper xerox rate instead of premium print
                </p>
              </div>
              <Switch checked={duplex} onCheckedChange={setDuplex} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Choose how you want to pay</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col items-center gap-2 transition-colors ${
                  paymentMethod === "E_WALLET"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground"
                }`}
                onClick={() => setPaymentMethod("E_WALLET")}
              >
                <Wallet className="h-8 w-8 text-primary" />
                <span className="font-medium">E-Wallet</span>
                <span className="text-xs text-muted-foreground text-center">
                  GCash, Maya, etc.
                </span>
              </div>
              <div
                className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col items-center gap-2 transition-colors ${
                  paymentMethod === "CASH"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground"
                }`}
                onClick={() => setPaymentMethod("CASH")}
              >
                <Banknote className="h-8 w-8 text-primary" />
                <span className="font-medium">Cash</span>
                <span className="text-xs text-muted-foreground text-center">
                  Pay at the counter
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pickup Schedule</CardTitle>
            <CardDescription>Select when you will pick up your prints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Pickup Date
                </Label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => {
                    setPickupDate(e.target.value);
                    setPickupTime("");
                  }}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Pickup Time
                </Label>
                <select
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  disabled={!pickupDate}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select time</option>
                  {(() => {
                    const slots: string[] = [];
                    for (let h = 8; h <= 18; h++) {
                      for (let m = 0; m < 60; m += 30) {
                        if (h === 18 && m > 0) continue;
                        const hour = h.toString().padStart(2, "0");
                        const minute = m.toString().padStart(2, "0");
                        slots.push(`${hour}:${minute}`);
                      }
                    }
                    const now = new Date();
                    const todayStr = now.toISOString().split("T")[0];
                    const currentMinutes = now.getHours() * 60 + now.getMinutes();
                    return slots.map((slot) => {
                      const isToday = pickupDate === todayStr;
                      const [sh, sm] = slot.split(":").map(Number);
                      const slotMinutes = sh * 60 + sm;
                      const disabled = isToday && slotMinutes <= currentMinutes;
                      return (
                        <option key={slot} value={`${slot}:00`} disabled={disabled}>
                          {slot} {disabled ? " (passed)" : ""}
                        </option>
                      );
                    });
                  })()}
                </select>
              </div>
            </div>
            {!pickupDate && (
              <p className="text-xs text-muted-foreground">
                Optional — choose a date and time for pickup. If not selected, staff will notify you when ready.
              </p>
            )}
            {pickupDate && pickupTime && (
              <p className="text-xs text-primary font-medium">
                Scheduled for {new Date(`${pickupDate}T${pickupTime}`).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Estimate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Files</span>
                <span>{files.length} document{files.length !== 1 ? "s" : ""}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Total Pages</span>
                <span>
                  {anyReading
                    ? "Analyzing..."
                    : `${totalPagesAll()} pages`}
                </span>
              </div>

              {color && totalPagesAll() > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Text Pages</span>
                    <span>{Math.max(0, totalPagesAll() - totalPhotoPagesAll())} pages × ₱{getTextRate().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Image className="h-3 w-3" />
                      Photo Pages
                    </span>
                    <span>{totalPhotoPagesAll()} pages × ₱{getPhotoRate().toFixed(2)}</span>
                  </div>
                </>
              )}

              {!color && totalPagesAll() > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Rate</span>
                  <span>₱{getBwRate().toFixed(2)}/page (B&W, {duplex ? "Xerox" : "Print"})</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span>Copies</span>
                <span>× {copies}</span>
              </div>

              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₱{totalCost()}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Price is based on total page count across all files, image detection, and current admin pricing rates.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg" disabled={files.length === 0 || uploading || anyReading}>
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading {files.length} file{files.length !== 1 ? "s" : ""}...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Submit {files.length} Print Job{files.length !== 1 ? "s" : ""}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
