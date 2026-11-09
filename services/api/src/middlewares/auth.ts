import { Request, Response, NextFunction } from 'express';
import { auth, db } from '../config/firebase';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: 'admin' | 'student';
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ success: false, message: 'مطلوب توكن المصادقة (Missing Token)' });
    return;
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check role from claims or Firestore user doc
    let role: 'admin' | 'student' = (decodedToken.role as any) || 'student';
    if (!decodedToken.role) {
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      if (userDoc.exists && userDoc.data()?.role === 'admin') {
        role = 'admin';
      }
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role,
    };

    next();
  } catch (error) {
    res.status(403).json({ success: false, message: 'توكن المصادقة غير صالح أو منتهي الصلاحية' });
    return;
  }
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ success: false, message: 'غير مصرح: هذه العملية مخصصة لمدراء النظام فقط' });
    return;
  }
  next();
};

