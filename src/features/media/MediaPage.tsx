import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Camera, X, Trash2, Image as ImageIcon, FileText, File } from 'lucide-react';
import { useDataStore } from '../../stores/useDataStore';
import { generateId, formatFileSize, isImageFile, formatDate } from '../../utils/helpers';
import type { MediaFile } from '../../types';
import styles from './MediaPage.module.css';

type FilterType = 'all' | 'images' | 'documents';

export default function MediaPage() {
  const { t, i18n } = useTranslation();
  const { media, addMedia, deleteMedia } = useDataStore();

  const [filter, setFilter] = useState<FilterType>('all');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const filteredMedia = media.filter((f) => {
    if (filter === 'images') return isImageFile(f.type);
    if (filter === 'documents') return !isImageFile(f.type);
    return true;
  });

  const processFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newFile: MediaFile = {
          id: generateId(),
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: reader.result as string,
          createdAt: new Date().toISOString(),
        };
        addMedia(newFile);
      };
      reader.readAsDataURL(file);
    });
  }, [addMedia]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  }, [processFiles]);

  // Camera functions
  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch {
      alert('Cannot access camera');
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const newFile: MediaFile = {
      id: generateId(),
      name: `photo_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`,
      type: 'image/jpeg',
      size: Math.round(dataUrl.length * 0.75),
      dataUrl,
      createdAt: new Date().toISOString(),
    };
    addMedia(newFile);
    closeCamera();
  }, [addMedia]);

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }, []);

  const handleDelete = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteMedia(id);
  }, [deleteMedia]);

  return (
    <div className={styles.mediaPage}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.filterTabs}>
          {(['all', 'images', 'documents'] as FilterType[]).map((f) => (
            <button
              key={f}
              className={`${styles.filterTab} ${filter === f ? styles.active : ''}`}
              onClick={() => setFilter(f)}
            >
              {t(`media.${f === 'all' ? 'allFiles' : f}`)}
            </button>
          ))}
        </div>
        <div className={styles.actionBtns}>
          <button className={styles.cameraBtn} onClick={openCamera}>
            <Camera size={16} />
            {t('media.takePhoto')}
          </button>
          <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} />
            {t('media.upload')}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Drop Zone */}
      <div
        className={`${styles.dropZone} ${isDragOver ? styles.dragOver : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className={styles.dropZoneIcon}><Upload size={24} /></div>
        <div className={styles.dropZoneText}>
          {t('media.dragDrop')} <span className={styles.dropZoneLink}>{t('media.browse')}</span>
        </div>
      </div>

      {/* Gallery */}
      {filteredMedia.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><ImageIcon size={28} /></div>
          <p>{t('media.noMedia')}</p>
        </div>
      ) : (
        <div className={styles.gallery}>
          {filteredMedia.map((file, i) => (
            <div
              key={file.id}
              className={`${styles.mediaCard} animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}
              onClick={() => isImageFile(file.type) && setPreviewFile(file)}
            >
              {isImageFile(file.type) ? (
                <div className={styles.mediaThumbnail}>
                  <img src={file.dataUrl} alt={file.name} loading="lazy" />
                </div>
              ) : (
                <div className={styles.fileIcon}>
                  {file.type.includes('pdf') ? <FileText size={36} /> : <File size={36} />}
                </div>
              )}
              <div className={styles.mediaInfo}>
                <div className={styles.mediaName}>{file.name}</div>
                <div className={styles.mediaSize}>
                  {formatFileSize(file.size)} · {formatDate(file.createdAt, i18n.language)}
                </div>
              </div>
              <div className={styles.mediaOverlay}>
                <button
                  className={`${styles.mediaOverlayBtn} ${styles.danger}`}
                  onClick={(e) => handleDelete(e, file.id)}
                  title={t('media.delete')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <div className={styles.cameraModal}>
          <video ref={videoRef} className={styles.cameraVideo} autoPlay playsInline />
          <div className={styles.cameraBtns}>
            <button className={styles.captureBtn} onClick={capturePhoto} title="Capture" />
            <button className={styles.closeCameraBtn} onClick={closeCamera}>{t('common.close')}</button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {previewFile && (
        <div className={styles.lightbox} onClick={() => setPreviewFile(null)}>
          <img src={previewFile.dataUrl} alt={previewFile.name} />
          <button className={styles.lightboxClose} onClick={() => setPreviewFile(null)}>
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
