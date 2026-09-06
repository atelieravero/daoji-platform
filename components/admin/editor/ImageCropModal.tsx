'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Loader2, Crop } from 'lucide-react';
import { 
  getAssetPresignedUploadUrlAction, 
  registerAssetAction, 
  fetchImageForCropAction,
  AssetRecord 
} from '@/app/admin/(dashboard)/assets/actions';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  aspectRatio: number; // e.g. 16/9, 16/5
  aspectRatioLabel?: string; // e.g. "16:9", "16:5"
  onCropSuccess: (asset: AssetRecord) => void;
}

export default function ImageCropModal({
  isOpen,
  onClose,
  imageUrl,
  aspectRatio = 16 / 9,
  aspectRatioLabel = '16:9',
  onCropSuccess,
}: ImageCropModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadedDataUrl, setLoadedDataUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const posStartRef = useRef({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const containerWidth = 560;
  const containerHeight = Math.round(containerWidth / aspectRatio);

  const getMinScale = useCallback(() => {
    if (!naturalSize.width || !naturalSize.height) return 1;
    const scaleX = containerWidth / naturalSize.width;
    const scaleY = containerHeight / naturalSize.height;
    return Math.max(scaleX, scaleY);
  }, [containerWidth, containerHeight, naturalSize]);

  const clampPosition = useCallback((x: number, y: number, currentZoom: number) => {
    const minScale = getMinScale();
    const currentScale = minScale * currentZoom;
    const displayedWidth = naturalSize.width * currentScale;
    const displayedHeight = naturalSize.height * currentScale;

    const minX = containerWidth - displayedWidth;
    const minY = containerHeight - displayedHeight;

    const clampedX = Math.min(0, Math.max(minX, x));
    const clampedY = Math.min(0, Math.max(minY, y));

    return { x: clampedX, y: clampedY };
  }, [containerWidth, containerHeight, naturalSize, getMinScale]);

  const centerImage = useCallback((currentZoom: number) => {
    const minScale = getMinScale();
    const currentScale = minScale * currentZoom;
    const displayedWidth = naturalSize.width * currentScale;
    const displayedHeight = naturalSize.height * currentScale;

    const initialX = (containerWidth - displayedWidth) / 2;
    const initialY = (containerHeight - displayedHeight) / 2;

    setPosition(clampPosition(initialX, initialY, currentZoom));
  }, [containerWidth, containerHeight, naturalSize, getMinScale, clampPosition]);

  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    let isMounted = true;
    setImageLoaded(false);
    setLoadedDataUrl(null);
    setErrorMessage(null);
    setZoom(1);

    fetchImageForCropAction(imageUrl).then((res) => {
      if (!isMounted) return;

      if (res.error || !res.dataUrl) {
        setErrorMessage(res.error || 'Failed to load source image for cropping.');
        return;
      }

      const img = new Image();
      img.onload = () => {
        if (!isMounted) return;
        setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        setLoadedDataUrl(res.dataUrl!);
        setImageLoaded(true);
      };
      img.onerror = () => {
        if (!isMounted) return;
        setErrorMessage('Failed to decode image data.');
      };
      img.src = res.dataUrl;
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, imageUrl]);

  useEffect(() => {
    if (imageLoaded) {
      centerImage(1);
    }
  }, [imageLoaded, centerImage]);

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    setPosition((prev) => clampPosition(prev.x, prev.y, newZoom));
  };

  const handleStart = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: clientX, y: clientY };
    posStartRef.current = { ...position };
  };

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    const newX = posStartRef.current.x + deltaX;
    const newY = posStartRef.current.y + deltaY;
    setPosition(clampPosition(newX, newY, zoom));
  }, [clampPosition, zoom]);

  const handleEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => handleEnd();

    if (isOpen) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isOpen, handleMove, handleEnd]);

  const handleApplyCrop = async () => {
    if (!imageRef.current || !naturalSize.width || !naturalSize.height) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const minScale = getMinScale();
      const currentScale = minScale * zoom;

      const sourceX = Math.max(0, -position.x / currentScale);
      const sourceY = Math.max(0, -position.y / currentScale);
      const sourceWidth = Math.min(naturalSize.width - sourceX, containerWidth / currentScale);
      const sourceHeight = Math.min(naturalSize.height - sourceY, containerHeight / currentScale);

      const outputWidth = Math.min(1920, Math.round(sourceWidth));
      const outputHeight = Math.round(outputWidth / aspectRatio);

      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas 2D context is not supported.');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        imageRef.current,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
      );

      if (!blob) throw new Error('Failed to export canvas blob.');

      const fileName = `crop-${aspectRatioLabel.replace(':', 'x')}-${Date.now()}.jpg`;
      const { uploadUrl, s3Key, fileUrl, error: presignError } = await getAssetPresignedUploadUrlAction({
        fileName,
        fileType: 'image/jpeg',
        fileSize: blob.size,
        folder: 'derivatives/crops', // Explicit prefix partitioning
      });

      if (presignError || !uploadUrl || !s3Key || !fileUrl) {
        throw new Error(presignError || 'Failed to obtain upload authorization.');
      }

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': 'image/jpeg' },
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed with HTTP status ${uploadRes.status}`);
      }

      // Mark is_system: true to exclude from general asset views
      const regRes = await registerAssetAction({
        fileUrl,
        s3Key,
        fileName,
        mimeType: 'image/jpeg',
        fileSizeBytes: blob.size,
        altTextEn: `Banner Crop (${aspectRatioLabel})`,
        altTextZh: `橫幅裁切 (${aspectRatioLabel})`,
        is_system: true,
      });

      if (!regRes.success || !regRes.data) {
        throw new Error(regRes.error || 'Failed to register cropped asset.');
      }

      onCropSuccess(regRes.data);
      onClose();
    } catch (err: any) {
      console.error('Crop Error:', err);
      setErrorMessage(err.message || 'Failed to crop and save the banner.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const minScale = getMinScale();
  const currentScale = minScale * zoom;
  const displayedWidth = naturalSize.width * currentScale;
  const displayedHeight = naturalSize.height * currentScale;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">Crop Cover Banner</h3>
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md border border-gray-200">
                  {aspectRatioLabel}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Cropping from original source image
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CROP WORKSPACE */}
        <div className="p-6 bg-stone-900 flex flex-col items-center justify-center select-none overflow-hidden">
          {errorMessage && (
            <div className="w-full mb-3 p-3 bg-red-500/10 border border-red-500/30 text-red-200 rounded-xl text-xs">
              {errorMessage}
            </div>
          )}

          {!imageLoaded || !loadedDataUrl ? (
            <div
              style={{ width: containerWidth, height: containerHeight }}
              className="flex items-center justify-center text-stone-400 text-xs gap-2 border border-stone-800 rounded-xl"
            >
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              <span>Loading original image canvas...</span>
            </div>
          ) : (
            <div
              ref={containerRef}
              style={{ width: containerWidth, height: containerHeight }}
              onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
              onTouchStart={(e) => e.touches[0] && handleStart(e.touches[0].clientX, e.touches[0].clientY)}
              className="relative overflow-hidden rounded-xl border-2 border-indigo-500/80 shadow-2xl cursor-grab active:cursor-grabbing bg-stone-950"
            >
              <img
                ref={imageRef}
                src={loadedDataUrl}
                alt="Crop preview"
                draggable={false}
                style={{
                  width: `${displayedWidth}px`,
                  height: `${displayedHeight}px`,
                  transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
                  maxWidth: 'none',
                }}
                className="absolute top-0 left-0 pointer-events-none will-change-transform"
              />

              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                <div className="border-r border-b border-white/25" />
                <div className="border-r border-b border-white/25" />
                <div className="border-b border-white/25" />
                <div className="border-r border-b border-white/25" />
                <div className="border-r border-b border-white/25" />
                <div className="border-b border-white/25" />
                <div className="border-r border-white/25" />
                <div className="border-r border-white/25" />
                <div />
              </div>
            </div>
          )}
        </div>

        {/* CONTROLS */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <ZoomOut className="w-4 h-4 text-gray-400" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                disabled={!imageLoaded || isProcessing}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:cursor-not-allowed"
              />
              <ZoomIn className="w-4 h-4 text-gray-400" />
            </div>

            <button
              type="button"
              disabled={!imageLoaded || isProcessing}
              onClick={() => {
                setZoom(1);
                centerImage(1);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              title="Reset Position & Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-200/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={!imageLoaded || isProcessing}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cropping & Uploading...</span>
                </>
              ) : (
                <>
                  <Crop className="w-4 h-4" />
                  <span>Save Crop</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}