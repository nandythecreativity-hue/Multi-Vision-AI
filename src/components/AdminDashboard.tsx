import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  User as UserIcon, 
  Coins, 
  Check, 
  X,
  Loader2,
  AlertCircle,
  ArrowUpDown
} from 'lucide-react';
import { db, collection, getDocs, updateDoc, doc, deleteDoc, orderBy, query } from '../firebase';

interface UserProfile {
  uid: string;
  email: string;
  credits: number;
  role: 'admin' | 'user';
  createdAt?: string;
  displayName?: string;
}

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editCredits, setEditCredits] = useState<number>(0);
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('email', 'asc'));
      const querySnapshot = await getDocs(q);
      const usersList: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        usersList.push({ uid: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(usersList);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Make sure you have admin permissions.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user.uid);
    setEditCredits(user.credits);
    setEditRole(user.role);
  };

  const handleSave = async (uid: string) => {
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        credits: editCredits,
        role: editRole
      });
      setUsers(users.map(u => u.uid === uid ? { ...u, credits: editCredits, role: editRole } : u));
      setEditingUser(null);
    } catch (err) {
      console.error("Error updating user:", err);
      setError("Failed to update user.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (uid: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    
    try {
      await deleteDoc(doc(db, 'users', uid));
      setUsers(users.filter(u => u.uid !== uid));
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Failed to delete user.");
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" />
            User Management
          </h2>
          <p className="text-sm text-white/40 uppercase tracking-widest font-bold mt-1">Control access and credits</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-orange-500 transition-colors" />
          <input 
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-sm w-full sm:w-64 focus:outline-none focus:border-orange-500/50 transition-all"
          />
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500"
        >
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-bold uppercase tracking-wider">{error}</p>
        </motion.div>
      )}

      <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">User</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Role</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Credits</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
                    <p className="text-xs font-bold text-white/20 uppercase tracking-widest">Scanning database...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <p className="text-xs font-bold text-white/20 uppercase tracking-widest">No users found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-orange-500/30 transition-colors">
                          <UserIcon className="w-5 h-5 text-white/40" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{user.displayName || 'Anonymous User'}</p>
                          <p className="text-xs text-white/40 font-mono">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingUser === user.uid ? (
                        <select 
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as 'admin' | 'user')}
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-orange-500/50"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          user.role === 'admin' 
                            ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' 
                            : 'bg-white/5 text-white/40 border border-white/10'
                        }`}>
                          {user.role === 'admin' && <Shield className="w-3 h-3" />}
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingUser === user.uid ? (
                        <div className="flex items-center gap-2">
                          <Coins className="w-3 h-3 text-orange-500" />
                          <input 
                            type="number"
                            value={editCredits}
                            onChange={(e) => setEditCredits(parseInt(e.target.value) || 0)}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs w-20 focus:outline-none focus:border-orange-500/50"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Coins className="w-3 h-3 text-orange-500/40" />
                          <span className="text-sm font-bold text-white/80">{user.credits}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editingUser === user.uid ? (
                          <>
                            <button 
                              onClick={() => handleSave(user.uid)}
                              disabled={isSaving}
                              className="p-2 bg-orange-500 text-black rounded-lg hover:bg-orange-600 transition-all disabled:opacity-50"
                              title="Save Changes"
                            >
                              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => setEditingUser(null)}
                              className="p-2 bg-white/5 text-white/40 rounded-lg hover:bg-white/10 transition-all"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleEdit(user)}
                              className="p-2 bg-white/5 text-white/40 rounded-lg hover:bg-white/10 hover:text-white transition-all border border-white/5"
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(user.uid)}
                              className="p-2 bg-red-500/10 text-red-500/40 rounded-lg hover:bg-red-500/20 hover:text-red-500 transition-all border border-red-500/10"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
