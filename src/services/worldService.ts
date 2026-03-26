import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { WorldRecord } from '../types/world';

const appId = 'hello-my-world-v8';

export const WorldService = {
  /**
   * 定格世界线
   */
  async saveWorld(userId: string, data: Omit<WorldRecord, 'id' | 'timestamp'>) {
    const db = getFirestore();
    const worldData = {
      ...data,
      timestamp: serverTimestamp()
    };
    const docRef = await addDoc(
      collection(db, 'users', userId, 'parallel_worlds'), 
      worldData
    );
    return docRef.id;
  },

  /**
   * 获取所有平行世界
   */
  async getWorlds(userId: string): Promise<WorldRecord[]> {
    const db = getFirestore();
    const q = query(
      collection(db, 'users', userId, 'parallel_worlds'),
      orderBy('timestamp', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as WorldRecord));
  },

  /**
   * 维度抹除
   */
  async deleteWorld(userId: string, worldId: string) {
    const db = getFirestore();
    await deleteDoc(doc(db, 'users', userId, 'parallel_worlds', worldId));
  }
};
