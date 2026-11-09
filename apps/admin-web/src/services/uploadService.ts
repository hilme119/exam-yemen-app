import { storage, ref, uploadBytes, getDownloadURL } from './firebase';

const CLOUDINARY_CLOUD_NAME = 'dxp5laxvz';
const CLOUDINARY_UPLOAD_PRESET = 'exam_yemen_uploads';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

/**
 * Uploads a File or Blob (image/audio) to Cloudinary auto upload endpoint,
 * with graceful fallback to Firebase Storage.
 */
export async function uploadMediaFile(
  fileOrBlob: File | Blob,
  filename?: string
): Promise<string> {
  const name = filename || (fileOrBlob instanceof File ? fileOrBlob.name : `voice_${Date.now()}.mp3`);

  // 1. Try Cloudinary
  try {
    const formData = new FormData();
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('file', fileOrBlob, name);

    const res = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.secure_url) {
        return data.secure_url;
      }
    }
  } catch (err) {
    console.warn('Cloudinary upload warning, trying Firebase Storage fallback:', err);
  }

  // 2. Fallback to Firebase Storage
  const cleanExt = name.includes('.') ? name.split('.').pop() : 'dat';
  const storagePath = `admin_uploads/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${cleanExt}`;
  const fileRef = ref(storage, storagePath);

  const snapshot = await uploadBytes(fileRef, fileOrBlob);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
}

