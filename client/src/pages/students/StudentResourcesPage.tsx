import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Download,
  FileText,
  Video,
  FileCheck,
  AlertCircle,
  Search,
  Clock,
  Star,
  Award,
  Share2,
  Bookmark,
  Eye,
  FileDown,
  GraduationCap,
  Library,
  CheckCircle2,
  Loader2,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Resource type definitions
interface Resource {
  id: string;
  title: string;
  description: string;
  type: "pdf" | "video" | "link" | "document" | "audio" | "image";
  category: "highway-code" | "practice-tests" | "guides" | "videos" | "forms";
  size?: string;
  duration?: string;
  pages?: number;
  downloadUrl: string;
  thumbnail?: string;
  author?: string;
  dateAdded: string;
  downloads?: number;
  rating?: number;
  featured?: boolean;
  tags: string[];
}

// Mock resources data
const resources: Resource[] = [
  {
    id: "1",
    title: "The Official Highway Code",
    description:
      "Complete guide to road signs, rules, and regulations for all drivers in the UK. Updated 2024 edition.",
    type: "pdf",
    category: "highway-code",
    size: "12.5 MB",
    pages: 184,
    downloadUrl: "/books/highway-code.pdf",
    thumbnail: "/thumbnails/highway-code.jpg",
    author: "Driver and Vehicle Standards Agency",
    dateAdded: "2024-01-15",
    downloads: 15420,
    rating: 4.8,
    featured: true,
    tags: ["highway code", "rules", "signs", "regulations", "official"],
  },
  {
    id: "2",
    title: "Theory Test Practice Questions",
    description:
      "500+ official DVSA theory test questions with explanations to help you prepare.",
    type: "pdf",
    category: "practice-tests",
    size: "8.2 MB",
    pages: 256,
    downloadUrl: "/books/theory-test-questions.pdf",
    author: "DVSA",
    dateAdded: "2024-02-01",
    downloads: 8920,
    rating: 4.6,
    featured: true,
    tags: ["theory test", "practice", "questions", "dvsa"],
  },
  {
    id: "3",
    title: "Complete Guide to Driving Maneuvers",
    description:
      "Step-by-step instructions for all driving maneuvers including parallel parking, reverse bay parking, and more.",
    type: "pdf",
    category: "guides",
    size: "5.8 MB",
    pages: 92,
    downloadUrl: "/books/driving-maneuvers.pdf",
    author: "Driving Standards Agency",
    dateAdded: "2024-01-20",
    downloads: 6230,
    rating: 4.5,
    tags: ["maneuvers", "parking", "practical", "guide"],
  },
  {
    id: "4",
    title: "Road Signs and Markings",
    description:
      "Comprehensive guide to all UK road signs, traffic signals, and road markings with clear illustrations.",
    type: "pdf",
    category: "guides",
    size: "6.3 MB",
    pages: 120,
    downloadUrl: "/books/road-signs.pdf",
    author: "Department for Transport",
    dateAdded: "2024-02-10",
    downloads: 7840,
    rating: 4.7,
    tags: ["road signs", "markings", "signals", "illustrations"],
  },
  {
    id: "5",
    title: "Hazard Perception Tips & Tricks",
    description:
      "Learn how to ace the hazard perception test with our comprehensive guide and practice scenarios.",
    type: "pdf",
    category: "guides",
    size: "4.2 MB",
    pages: 68,
    downloadUrl: "/books/hazard-perception.pdf",
    author: "Driving Experts",
    dateAdded: "2024-02-15",
    downloads: 5410,
    rating: 4.4,
    tags: ["hazard perception", "tips", "practice"],
  },
  {
    id: "6",
    title: "Vehicle Safety Checklist",
    description:
      "Essential vehicle safety checks every driver should perform before and during their journey.",
    type: "pdf",
    category: "guides",
    size: "2.1 MB",
    pages: 32,
    downloadUrl: "/books/safety-checklist.pdf",
    author: "AA",
    dateAdded: "2024-01-25",
    downloads: 3890,
    rating: 4.3,
    tags: ["safety", "checks", "vehicle", "maintenance"],
  },
  {
    id: "7",
    title: "Eco-Driving Techniques",
    description:
      "Learn fuel-efficient driving techniques to save money and reduce environmental impact.",
    type: "pdf",
    category: "guides",
    size: "3.4 MB",
    pages: 48,
    downloadUrl: "/books/eco-driving.pdf",
    author: "Energy Saving Trust",
    dateAdded: "2024-02-18",
    downloads: 1780,
    rating: 4.1,
    tags: ["eco-driving", "fuel efficiency", "environment"],
  },
];

const categories = [
  { id: "all", label: "All Resources", icon: Library },
  { id: "highway-code", label: "Highway Code", icon: BookOpen },
  { id: "practice-tests", label: "Practice Tests", icon: FileCheck },
  { id: "guides", label: "Guides & Tips", icon: GraduationCap },
  { id: "forms", label: "Forms & Documents", icon: FileText },
];

const StudentResourcesPage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null,
  );
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);
  const [bookmarked, setBookmarked] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  if (!user) return null;

  // Filter resources based on search and category
  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    const matchesCategory =
      selectedCategory === "all" || resource.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const featuredResources = resources.filter((r) => r.featured);
  const recentResources = [...resources]
    .sort(
      (a, b) =>
        new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime(),
    )
    .slice(0, 4);

  const handleDownload = async (resource: Resource) => {
    setDownloading(resource.id);
    try {
      // Simulate download delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create a link element and trigger download
      const link = document.createElement("a");
      link.href = resource.downloadUrl;
      link.download =
        resource.title.replace(/\s+/g, "_").toLowerCase() + ".pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Track download
      console.log(`Downloaded: ${resource.title}`);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setDownloading(null);
    }
  };

  const handleViewPdf = (resource: Resource) => {
    setSelectedResource(resource);
    setPdfDialogOpen(true);
    setRecentlyViewed((prev) =>
      [resource.id, ...prev.filter((id) => id !== resource.id)].slice(0, 10),
    );
  };

  const toggleBookmark = (resourceId: string) => {
    setBookmarked((prev) =>
      prev.includes(resourceId)
        ? prev.filter((id) => id !== resourceId)
        : [...prev, resourceId],
    );
  };

  const ResourceCard = ({
    resource,
    featured = false,
  }: {
    resource: Resource;
    featured?: boolean;
  }) => {
    const isDownloading = downloading === resource.id;
    const isBookmarked = bookmarked.includes(resource.id);
    const isRecentlyViewed = recentlyViewed.includes(resource.id);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "group relative rounded-xl border bg-card hover:shadow-xl transition-all duration-300",
          featured && "lg:col-span-2 md:flex",
          isRecentlyViewed && "ring-2 ring-primary/20",
        )}
      >
        {featured && (
          <Badge className="absolute top-3 left-3 z-10 bg-yellow-500 text-white border-0">
            <Star className="h-3 w-3 mr-1 fill-current" /> Featured
          </Badge>
        )}

        <div className={cn("p-5", featured && "md:w-1/2")}>
          <div className="flex items-start justify-between mb-3">
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                resource.type === "pdf"
                  ? "bg-red-100 text-red-600 dark:bg-red-900/20"
                  : resource.type === "video"
                    ? "bg-purple-100 text-purple-600"
                    : "bg-blue-100 text-blue-600",
              )}
            >
              {resource.type === "pdf" ? (
                <FileText className="h-5 w-5" />
              ) : resource.type === "video" ? (
                <Video className="h-5 w-5" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => toggleBookmark(resource.id)}
              >
                <Bookmark
                  className={cn(
                    "h-4 w-4",
                    isBookmarked && "fill-primary text-primary",
                  )}
                />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <h3 className="font-display font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
            {resource.title}
          </h3>

          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {resource.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {resource.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
            {resource.size && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {resource.size}
              </span>
            )}
            {resource.pages && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {resource.pages} pages
              </span>
            )}
            {resource.downloads && (
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {resource.downloads.toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => handleViewPdf(resource)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => handleDownload(resource)}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </>
              )}
            </Button>
          </div>
        </div>

        {featured && (
          <div className="hidden md:block md:w-1/2 bg-muted/30 rounded-r-xl p-5 border-l">
            <div className="h-full flex flex-col justify-center">
              <h4 className="font-medium mb-2">Why this resource?</h4>
              <p className="text-sm text-muted-foreground mb-4">
                This is one of our most popular resources among students
                preparing for their driving test.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Official DVSA approved</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Updated for 2024</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Includes all recent changes</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Student Resources
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <Library className="h-4 w-4" />
            Access study materials, guides, and official documents
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <FileText className="h-4 w-4 mr-2" />
            {resources.length} Resources
          </Badge>
        </div>
      </div>

      {/* Search and Categories */}
      <Card className="border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources by title, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>

            {/* Category Tabs - Desktop */}
            <Tabs
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              className="hidden lg:block"
            >
              <TabsList className="grid grid-cols-5 w-[600px]">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <TabsTrigger key={cat.id} value={cat.id} className="gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="hidden xl:inline">{cat.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            {/* Category Select - Mobile */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="lg:hidden px-3 py-2 rounded-lg border bg-background"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Featured Resources */}
      {featuredResources.length > 0 &&
        selectedCategory === "all" &&
        searchQuery === "" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Featured Resources
              </h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {featuredResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} featured />
              ))}
            </div>
          </section>
        )}

      {/* Recently Added */}
      {selectedCategory === "all" && searchQuery === "" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recently Added
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </section>
      )}

      {/* All Resources */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold flex items-center gap-2">
            <Library className="h-5 w-5 text-primary" />
            {selectedCategory === "all"
              ? "All Resources"
              : categories.find((c) => c.id === selectedCategory)?.label}
          </h2>
          <Badge variant="outline">{filteredResources.length} items</Badge>
        </div>

        {filteredResources.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-muted-foreground">
                No resources found
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or category filter
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResources
              .filter((r) => !r.featured || selectedCategory !== "all")
              .map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
          </div>
        )}
      </section>

      {/* Quick Stats */}
      <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {resources.length}
              </p>
              <p className="text-xs text-muted-foreground">Total Resources</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">
                {resources
                  .reduce((sum, r) => sum + (r.downloads || 0), 0)
                  .toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Total Downloads</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">
                {resources.filter((r) => r.type === "pdf").length}
              </p>
              <p className="text-xs text-muted-foreground">PDF Documents</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-500">
                {resources
                  .reduce((sum, r) => sum + (r.pages || 0), 0)
                  .toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Total Pages</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF Viewer Dialog */}
      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0">
          <DialogHeader className="p-4 border-b">
            <div className="flex flex-wrap items-center justify-between">
              <div>
                <DialogTitle>{selectedResource?.title}</DialogTitle>
                <DialogDescription>
                  {selectedResource?.description}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                  disabled={zoomLevel <= 50}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm min-w-[60px] text-center">
                  {zoomLevel}%
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
                  disabled={zoomLevel >= 200}
                  className="hidden md:flex"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setFullscreen(!fullscreen)}
                >
                  {fullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>

                {selectedResource && (
                  <Button
                    onClick={() => handleDownload(selectedResource)}
                    disabled={downloading === selectedResource.id}
                  >
                    {downloading === selectedResource.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <FileDown className="h-4 w-4 mr-2" />
                        Download PDF
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 p-4 overflow-auto bg-muted/30">
            {selectedResource && (
              <div className="relative min-h-full flex items-center justify-center">
                {/* PDF Embed */}
                <object
                  data={`${selectedResource.downloadUrl}#toolbar=0&navpanes=0&scrollbar=1&zoom=${zoomLevel}`}
                  type="application/pdf"
                  className="w-full h-full min-h-[70vh] rounded-lg shadow-lg"
                  style={{
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: "center",
                  }}
                >
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">
                      Unable to display PDF
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your browser doesn't support embedded PDF viewing.
                    </p>
                    <Button onClick={() => handleDownload(selectedResource)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF Instead
                    </Button>
                  </div>
                </object>
              </div>
            )}
          </div>

          {/* PDF Info Footer */}
          <div className="p-3 border-t bg-muted/50 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {selectedResource?.size}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {selectedResource?.pages} pages
              </span>
              {selectedResource?.downloads && (
                <span className="flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  {selectedResource.downloads.toLocaleString()} downloads
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedResource?.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{selectedResource.rating}</span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentResourcesPage;
