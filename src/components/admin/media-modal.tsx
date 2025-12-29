"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Loader2, X, Check } from "lucide-react";

interface MediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
}

interface MediaFile {
    name: string;
    url: string;
}

export function MediaModal({ isOpen, onClose, onSelect }: MediaModalProps) {
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = useCallback(async (selectedFiles: FileList | null) => {
        if (!selectedFiles || selectedFiles.length === 0) return;

        setIsUploading(true);

        try {
            const uploadPromises = Array.from(selectedFiles).map(async (file) => {
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("/api/admin/media/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) throw new Error("Upload failed");

                const data = await response.json();
                return {
                    name: data.name,
                    url: data.url,
                };
            });

            const uploadedFiles = await Promise.all(uploadPromises);
            setFiles((prev) => [...uploadedFiles, ...prev]);
        } catch (error) {
            console.error("Upload error:", error);
            // Valid valid feedback to user would be better here
        } finally {
            setIsUploading(false);
        }
    }, [files]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleSelect = (url: string) => {
        onSelect(url);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Bild auswählen</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[60vh]">
                    {/* Drop Zone */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/25"
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleFiles(e.target.files)}
                            className="hidden"
                        />
                        <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-muted rounded-full">
                                <Upload className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium">
                                    {isDragging ? "Loslassen zum Hochladen" : "Bilder hierher ziehen"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    oder klicken zum Auswählen
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Wird hochgeladen...
                                    </>
                                ) : (
                                    "Dateien auswählen"
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Files Grid */}
                    {files.length > 0 && (
                        <div className="mt-4">
                            <p className="text-sm font-medium mb-3">Hochgeladene Bilder</p>
                            <div className="grid grid-cols-4 gap-3">
                                {files.map((file) => (
                                    <button
                                        key={file.url}
                                        type="button"
                                        onClick={() => handleSelect(file.url)}
                                        className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                                    >
                                        <img
                                            src={file.url}
                                            alt={file.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Check className="h-6 w-6 text-white" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {files.length === 0 && (
                        <div className="mt-4 text-center text-muted-foreground py-8">
                            <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Noch keine Bilder hochgeladen</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-muted/30">
                    <p className="text-xs text-muted-foreground">
                        <strong>Hinweis:</strong> Aus Datenschutzgründen dürfen keine Bilder von externen Quellen verlinkt werden.
                    </p>
                </div>
            </div>
        </div>
    );
}
