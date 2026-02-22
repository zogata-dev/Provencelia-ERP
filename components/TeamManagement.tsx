import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Mail, Shield, Trash2, 
  Clock, CheckCircle2, AlertCircle, X,
  UserCheck, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { User, Invitation } from '../types';

interface TeamManagementProps {
  currentUser: User | null;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [isInviting, setIsInviting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      setUsers(data.users || []);
      setInvitations(data.invitations || []);
    } catch (err) {
      console.error('Failed to fetch team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsInviting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `Invitation sent to ${inviteEmail}` });
        setInviteEmail('');
        fetchTeam();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send invitation' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setIsInviting(false);
    }
  };

  const removeUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this user?')) return;
    try {
      const res = await fetch(`/api/team/user/${id}`, { method: 'DELETE' });
      if (res.ok) fetchTeam();
    } catch (err) {
      console.error('Failed to remove user');
    }
  };

  const cancelInvitation = async (id: string) => {
    try {
      const res = await fetch(`/api/team/invite/${id}`, { method: 'DELETE' });
      if (res.ok) fetchTeam();
    } catch (err) {
      console.error('Failed to cancel invitation');
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2F4D36]"></div>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 animate-in pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2F4D36] tracking-tighter flex items-center gap-4">
            <Users className="text-[#2F4D36] w-9 h-9" />
            Team Management
          </h1>
          <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-[0.3em] mt-2">
            Manage access and roles for Provencelia Studio
          </p>
        </div>
      </div>

      {isAdmin && (
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <UserPlus size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tighter text-slate-900">Invite Team Member</h3>
              <p className="text-sm text-slate-400 font-medium">Send an email invitation to join the studio</p>
            </div>
          </div>

          <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input 
                type="email" 
                placeholder="colleague@provencelia.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-[#F6F6F0] border-none rounded-3xl text-sm font-bold text-[#2F4D36] outline-none focus:ring-2 focus:ring-[#2F4D36]/10 transition-all"
                required
              />
            </div>
            <select 
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="bg-[#F6F6F0] border-none rounded-3xl px-8 py-4 text-sm font-extrabold text-[#2F4D36] uppercase tracking-widest outline-none cursor-pointer"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
            <button 
              type="submit"
              disabled={isInviting}
              className="bg-[#2F4D36] text-white px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isInviting ? 'Sending...' : 'Send Invite'}
            </button>
          </form>

          {message && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span className="text-xs font-bold uppercase tracking-wider">{message.text}</span>
              <button onClick={() => setMessage(null)} className="ml-auto"><X size={16} /></button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Active Users */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Active Members ({users.length})</h3>
          </div>
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
                <div className="relative">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-50" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black">
                      {user.email[0].toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-slate-900 tracking-tighter truncate">{user.name || user.email}</h4>
                    {user.role === 'admin' && <ShieldCheck className="text-indigo-500" size={14} />}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    user.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 
                    user.role === 'editor' ? 'bg-emerald-50 text-emerald-600' : 
                    'bg-slate-50 text-slate-400'
                  }`}>
                    {user.role}
                  </div>
                  {isAdmin && user.id !== currentUser?.id && (
                    <button 
                      onClick={() => removeUser(user.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Invitations */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Pending Invites ({invitations.length})</h3>
          </div>
          <div className="space-y-4">
            {invitations.length === 0 ? (
              <div className="bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[32px] p-12 text-center">
                <Mail className="mx-auto text-slate-200 mb-4" size={32} />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No pending invitations</p>
              </div>
            ) : (
              invitations.map(invite => (
                <div key={invite.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5 border-l-4 border-l-amber-400">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                    <Clock size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-900 tracking-tighter truncate">{invite.email}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Invited by {invite.invitedBy}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                      {invite.role}
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={() => cancelInvitation(invite.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;
