"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Image as ImageIcon, Loader2, Trash2, Copy, Check } from "lucide-react";

interface MediaFile {
    name: string;
    url: string;
    uploadedAt: Date;
}

export default function MediaLibraryPage() {
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        setIsUploading(true);

        // In a real implementation, you would upload to a storage service
        // For now, we'll create object URLs as a demo
        const newFiles: MediaFile[] = Array.from(selectedFiles).map((file) => ({
            name: file.name,
            url: URL.createObjectURL(file),
            uploadedAt: new Date(),
        }));

        setFiles([...newFiles, ...files]);
        setIsUploading(false);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    const handleDelete = (url: string) => {
        setFiles(files.filter((f) => f.url !== url));
        URL.revokeObjectURL(url); // Clean up object URL
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Mediathek</h1>
                    <p className="text-muted-foreground">
                        Laden Sie Produktbilder hoch und verwalten Sie diese hier
                    </p>
                </div>
            </div>

            {/* Upload Area */}
            <div className="bg-card rounded-xl border-2 border-dashed p-8 text-center">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUpload}
                    className="hidden"
                    id="file-upload"
                />
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-muted rounded-full">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="font-medium">Bilder hochladen</p>
                        <p className="text-sm text-muted-foreground">
                            PNG, JPG oder WebP bis 5MB
                        </p>
                    </div>
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Wird hochgeladen...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                Dateien auswählen
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Hinweis:</strong> Aus Datenschutzgründen dürfen keine Bilder von externen
                    Quellen wie Amazon verlinkt werden. Bitte laden Sie alle Produktbilder hier hoch.
                </p>
            </div>

            {/* Files Grid */}
            {files.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {files.map((file) => (
                        <div
                            key={file.url}
                            className="group bg-card rounded-xl border overflow-hidden"
                        >
                            <div className="aspect-square relative">
                                <img
                                    src={file.url}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        onClick={() => handleCopyUrl(file.url)}
                                    >
                                        {copiedUrl === file.url ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        onClick={() => handleDelete(file.url)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="p-3">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {file.uploadedAt.toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-card rounded-xl border p-12 text-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Noch keine Bilder hochgeladen</p>
                    <p className="text-sm mt-1">
                        Laden Sie Bilder hoch, um sie in Produkten zu verwenden
                    </p>
                </div>
            )}
        </div>
    );
}
