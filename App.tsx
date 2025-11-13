
import React, { useState, useCallback, useRef } from 'react';
import { editImageWithPrompt } from './services/geminiService';

// Helper function to convert a File object to a base64 string and get its MIME type.
const fileToData = (file: File): Promise<{ base64: string; mimeType: string; dataUrl: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const [header, data] = result.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
      resolve({ base64: data, mimeType, dataUrl: result });
    };
    reader.onerror = (error) => reject(error);
  });
};


// --- UI Icon Components (defined outside App to prevent re-creation on re-renders) ---

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const RegenerateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4a15.55 15.55 0 012.42-7.88C8.36 2.5 12.86 1 18 4m0 0a15.55 15.55 0 01-2.42 7.88C13.64 15.5 9.14 17 4 14" />
    </svg>
);

const Spinner = () => (
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-400"></div>
);


// --- Main Application Component ---

export default function App() {
    const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
    const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setUploadedImageFile(file);
            fileToData(file).then(({ dataUrl }) => {
                setUploadedImagePreview(dataUrl);
                setGeneratedImage(null); // Clear previous result on new upload
                setError(null);
            }).catch(err => {
                console.error(err);
                setError("Could not read the selected file.");
            })
        }
    };

    const handleGenerate = useCallback(async () => {
        if (!uploadedImageFile || !prompt.trim()) {
            setError('Please upload an image and enter a prompt.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const { base64, mimeType } = await fileToData(uploadedImageFile);
            const resultDataUrl = await editImageWithPrompt(base64, mimeType, prompt);
            setGeneratedImage(resultDataUrl);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [uploadedImageFile, prompt]);

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-6xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                        AI Image Editor
                    </h1>
                    <p className="mt-2 text-lg text-gray-400">Transform your images with a simple prompt.</p>
                </header>

                <main className="flex flex-col gap-8">
                    {/* Image Display Area */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        {/* Original Image */}
                        <div className="flex flex-col items-center bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
                            <h2 className="text-xl font-semibold mb-4 text-gray-300">Original Image</h2>
                            <div className="w-full aspect-square bg-gray-900/50 rounded-md flex items-center justify-center border-2 border-dashed border-gray-600">
                                {uploadedImagePreview ? (
                                    <img src={uploadedImagePreview} alt="Uploaded preview" className="max-w-full max-h-full object-contain rounded-md" />
                                ) : (
                                    <div className="text-center cursor-pointer p-4" onClick={triggerFileSelect}>
                                        <UploadIcon />
                                        <p className="mt-2 text-gray-400">Click to upload an image</p>
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/png, image/jpeg, image/webp"
                                className="hidden"
                            />
                        </div>

                        {/* Generated Image */}
                        <div className="flex flex-col items-center bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
                            <h2 className="text-xl font-semibold mb-4 text-gray-300">Generated Image</h2>
                            <div className="w-full aspect-square bg-gray-900/50 rounded-md flex items-center justify-center border-2 border-dashed border-gray-600 relative">
                                {isLoading && (
                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-md z-10">
                                        <Spinner />
                                        <p className="mt-4 text-white">Generating...</p>
                                    </div>
                                )}
                                {generatedImage && !isLoading && (
                                    <img src={generatedImage} alt="Generated result" className="max-w-full max-h-full object-contain rounded-md" />
                                )}
                                {!generatedImage && !isLoading && (
                                    <p className="text-gray-500">Your edited image will appear here.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Controls Area */}
                    {uploadedImagePreview && (
                        <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
                            <div className="flex flex-col gap-4">
                                <label htmlFor="prompt-input" className="text-lg font-medium text-gray-300">
                                    Enter your editing prompt:
                                </label>
                                <textarea
                                    id="prompt-input"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="e.g., make the sky look like a galaxy, add a cat wearing a spacesuit"
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 text-white resize-none"
                                    rows={3}
                                />
                                <div className="flex flex-col sm:flex-row gap-4 mt-2">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isLoading || !prompt.trim()}
                                        className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {generatedImage ? <><RegenerateIcon /> Regenerate</> : 'Generate Image'}
                                    </button>
                                    {generatedImage && !isLoading && (
                                        <a
                                            href={generatedImage}
                                            download="edited-image.png"
                                            className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-600 text-base font-medium rounded-md shadow-sm text-gray-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                                        >
                                            <DownloadIcon />
                                            Download
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative text-center" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
