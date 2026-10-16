import { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Search,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { usersApi } from '../../services/api/users';
import { isSuperAdmin } from '../../utils/permissions';
import { RoleBadge } from '../../components/users/RoleBadge';
import { UserEditModal } from '../../components/users/UserEditModal';
import { DeleteConfirmDialog } from '../../components/users/DeleteConfirmDialog';
import { UserDetailModal } from '../../components/users/UserDetailModal';
import type { User, Role, ApiError } from '../../types';

const PAGE_SIZE = 10;

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await usersApi.getUsers();
      setUsers(res.data || []);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to load users list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const roleCounts = useMemo(
    () => ({
      privileged: users.filter((u) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN').length,
      managers: users.filter((u) => u.role === 'MANAGER').length,
      members: users.filter((u) => u.role === 'USER').length,
    }),
    [users]
  );

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole = selectedRole === 'ALL' || u.role === selectedRole;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRole]);

  // Paginated users
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  const handleSaveUser = async (id: string, data: { name: string; email: string; role: Role }) => {
    try {
      const res = await usersApi.updateUser(id, data);
      setUsers((prev) => prev.map((u) => (u.id === id ? res.data : u)));
      showToast('User updated successfully.');
    } catch (err: any) {
      throw new Error(err?.message || 'Failed to update user.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await usersApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showToast('User deleted successfully.');
    } catch (err: any) {
      throw new Error(err?.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            View, search, filter, and manage workspace users and permissions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold bg-stone-50 text-stone-700 px-3 py-1.5 rounded-lg border border-stone-100">
            {users.length} total
          </span>
          <span className="text-xs font-semibold bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-100">
            {roleCounts.privileged} admin
          </span>
          <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-100">
            {roleCounts.managers} manager
          </span>
          <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200">
            {roleCounts.members} member
          </span>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2.5 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchUsers}
            className="ml-auto text-xs font-semibold underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Controls Bar: Search & Role Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Shield className="h-4 w-4 text-slate-400" />
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="USER">USER</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500 text-sm">
            <Loader2 className="h-6 w-6 animate-spin text-stone-600" />
            <span>Loading users...</span>
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="text-center py-20 px-4 space-y-2">
            <Users className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-base font-semibold text-slate-800">No users found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedRole !== 'ALL'
                ? 'Try adjusting your search query or role filter.'
                : 'There are no users registered in this tenant yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Name & Email</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Created</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedUsers.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          {u.name || 'Unnamed User'}
                          {isSelf && (
                            <span className="text-[10px] font-mono bg-stone-50 text-stone-600 px-1.5 py-0.5 rounded font-medium">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </td>
                      <td className="py-4 px-6">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingUser(u)}
                            title="View Details"
                            className="p-1.5 text-slate-400 hover:text-stone-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUser(u)}
                            title="Edit User"
                            className="p-1.5 text-slate-400 hover:text-stone-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => !isSelf && setDeletingUser(u)}
                            disabled={isSelf}
                            title={isSelf ? 'You cannot delete your own account' : 'Delete User'}
                            aria-label={isSelf ? 'You cannot delete your own account' : `Delete ${u.name || u.email}`}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && filteredUsers.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing <span className="font-semibold">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
              <span className="font-semibold">
                {Math.min(currentPage * PAGE_SIZE, filteredUsers.length)}
              </span>{' '}
              of <span className="font-semibold">{filteredUsers.length}</span> users
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-medium text-slate-700 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserDetailModal
        user={viewingUser}
        isOpen={Boolean(viewingUser)}
        onClose={() => setViewingUser(null)}
      />

      <UserEditModal
        user={editingUser}
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        onSave={handleSaveUser}
        isSuperAdminUser={isSuperAdmin(currentUser)}
      />

      <DeleteConfirmDialog
        user={deletingUser}
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteUser}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}