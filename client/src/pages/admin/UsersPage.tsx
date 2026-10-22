import { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Search,
  Shield,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/ui/Toast';
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
  const { success, error: showError } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

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

  const roleCounts = useMemo(
    () => ({
      privileged: users.filter(
        (u) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN',
      ).length,
      managers: users.filter((u) => u.role === 'MANAGER').length,
      members: users.filter((u) => u.role === 'USER').length,
    }),
    [users],
  );

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        (u.name &&
          u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.email &&
          u.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole =
        selectedRole === 'ALL' || u.role === selectedRole;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRole]);

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE) || 1;

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  const handleSaveUser = async (
    id: string,
    data: { name: string; email: string; role: Role },
  ) => {
    try {
      const res = await usersApi.updateUser(id, data);

      setUsers((prev) =>
        prev.map((u) => (u.id === id ? res.data : u)),
      );

      setEditingUser(null);

      success({
        title: 'User updated',
        message: 'User details were updated successfully.',
      });
    } catch (err) {
      const apiErr = err as ApiError;

      showError({
        title: 'Update failed',
        message: apiErr.message || 'Failed to update user.',
      });

      throw new Error(apiErr.message || 'Failed to update user.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await usersApi.deleteUser(id);

      setUsers((prev) => prev.filter((u) => u.id !== id));
      setDeletingUser(null);

      setCurrentPage((page) => {
        const remainingUsers = filteredUsers.length - 1;
        const nextTotalPages =
          Math.ceil(remainingUsers / PAGE_SIZE) || 1;

        return Math.min(page, nextTotalPages);
      });

      success({
        title: 'User deleted',
        message: 'The user was removed successfully.',
      });
    } catch (err) {
      const apiErr = err as ApiError;

      showError({
        title: 'Delete failed',
        message: apiErr.message || 'Failed to delete user.',
      });

      throw new Error(apiErr.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            User Management
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            View, search, filter, and manage workspace users and permissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700">
            {users.length} total
          </span>

          <span className="rounded-lg border border-purple-100 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700">
            {roleCounts.privileged} admin
          </span>

          <span className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
            {roleCounts.managers} manager
          </span>

          <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {roleCounts.members} member
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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

      <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row">
        <div className="relative w-full flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600"
          />
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Shield className="h-4 w-4 text-slate-400" />

          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600 sm:w-48"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="USER">USER</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-sm text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-stone-600" />
            <span>Loading users...</span>
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="space-y-2 px-4 py-20 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />

            <p className="text-base font-semibold text-slate-800">
              No users found
            </p>

            <p className="mx-auto max-w-sm text-xs text-slate-500">
              {searchQuery || selectedRole !== 'ALL'
                ? 'Try adjusting your search query or role filter.'
                : 'There are no users registered in this tenant yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3.5">Name & Email</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Created</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedUsers.map((u) => {
                  const isSelf = u.id === currentUser?.id;

                  return (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                          {u.name || 'Unnamed User'}

                          {isSelf && (
                            <span className="rounded bg-stone-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-stone-600">
                              You
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500">
                          {u.email}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <RoleBadge role={u.role} />
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-500">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingUser(u)}
                            title="View Details"
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-stone-600"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingUser(u)}
                            title="Edit User"
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-stone-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => !isSelf && setDeletingUser(u)}
                            disabled={isSelf}
                            title={
                              isSelf
                                ? 'You cannot delete your own account'
                                : 'Delete User'
                            }
                            aria-label={
                              isSelf
                                ? 'You cannot delete your own account'
                                : `Delete ${u.name || u.email}`
                            }
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
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

        {!isLoading && filteredUsers.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-4">
            <p className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-semibold">
                {(currentPage - 1) * PAGE_SIZE + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold">
                {Math.min(
                  currentPage * PAGE_SIZE,
                  filteredUsers.length,
                )}
              </span>{' '}
              of{' '}
              <span className="font-semibold">
                {filteredUsers.length}
              </span>{' '}
              users
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((p) => Math.max(p - 1, 1))
                }
                className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="px-2 text-xs font-medium text-slate-700">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(p + 1, totalPages),
                  )
                }
                className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

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