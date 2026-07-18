/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Edit2, Trash2, X, AlertCircle, Check, 
  Shield, Clock
} from 'lucide-react';
import { Admin } from '../types';
import { t } from '../i18n';

interface AdminManagementProps {
  admins: Admin[];
  onAddAdmin: (admin: Omit<Admin, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateAdmin: (admin: Admin) => Promise<void>;
  onDeleteAdmin: (id: string) => Promise<void>;
  canManageAdmins?: boolean;
}

export default function AdminManagement({
  admins: adminsProp,
  onAddAdmin,
  onUpdateAdmin,
  onDeleteAdmin,
  canManageAdmins = false,
}: AdminManagementProps) {
  const admins = adminsProp ?? [];
  const hasAdminControls = canManageAdmins;

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    role: 'limited' as 'super' | 'limited',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search and filter admins
  const filteredAdmins = useMemo(() => {
    return admins.filter(a =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [admins, searchTerm]);

  const handleOpenModal = (admin?: Admin) => {
    if (admin) {
      setEditingAdmin(admin);
      setAdminForm({
        name: admin.name,
        email: admin.email,
        role: admin.role,
      });
    } else {
      setEditingAdmin(null);
      setAdminForm({
        name: '',
        email: '',
        role: 'limited',
      });
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAdmin(null);
    setAdminForm({
      name: '',
      email: '',
      role: 'limited',
    });
    setError(null);
  };

  const handleSaveAdmin = async () => {
    setError(null);
    setLoading(true);

    try {
      // Validation
      if (!adminForm.name.trim()) {
        setError(t('admin.errorAdminNameRequired'));
        setLoading(false);
        return;
      }
      if (!adminForm.email.trim()) {
        setError(t('admin.errorAdminEmailRequired'));
        setLoading(false);
        return;
      }

      if (editingAdmin) {
        await onUpdateAdmin({
          id: editingAdmin.id,
          name: adminForm.name,
          email: adminForm.email,
          role: adminForm.role,
          isActive: editingAdmin.isActive,
          createdAt: editingAdmin.createdAt,
          lastLogin: editingAdmin.lastLogin,
        });
        setSuccessMessage(t('admin.successAdminUpdated'));
      } else {
        await onAddAdmin({
          name: adminForm.name,
          email: adminForm.email,
          role: adminForm.role,
          isActive: false,
        });
        setSuccessMessage(t('admin.successAdminInvitationSent'));
      }

      setTimeout(() => {
        setSuccessMessage(null);
        handleCloseModal();
      }, 2000);
    } catch (err: any) {
      setError(err.message || t('admin.errorAdminSaveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm(t('admin.confirmDeleteAdmin'))) {
      return;
    }

    setLoading(true);
    try {
      await onDeleteAdmin(adminId);
      setSuccessMessage(t('admin.successAdminDeleted'));
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err: any) {
      setError(err.message || t('admin.errorAdminDeleteFailed'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return t('admin.never');
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 h-full overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('admin.manageAdminsTitle')}</h2>
          <p className="text-gray-600 text-sm">{t('admin.manageAdminsDescription')}</p>
        </div>
        {hasAdminControls ? (
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer select-none"
          >
            <Plus size={20} />
            {t('admin.addAdminButton')}
          </button>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {t('admin.limitedAdminNote')}
          </div>
        )}
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700"
          >
            <Check size={20} />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg border border-gray-200">
        <Search size={20} className="text-gray-400" />
            <input
          type="text"
          placeholder={t('admin.searchAdminsPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 outline-none text-gray-900 placeholder-gray-500"
        />
      </div>

      {/* Admin List */}
      <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-gray-200">
        {filteredAdmins.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>{t('admin.noAdminsFound')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAdmins.map((admin) => (
              <div key={admin.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{admin.name}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          admin.role === 'super'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {admin.role === 'super' ? t('admin.roleBadgeSuper') : t('admin.roleBadgeLimited')}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          admin.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {admin.isActive ? t('admin.statusActive') : t('admin.statusPending')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{admin.email}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        {t('admin.createdLabel')}: {formatDate(admin.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        {t('admin.lastLoginLabel')}: {formatDateTime(admin.lastLogin)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasAdminControls ? (
                      <>
                        <button
                          onClick={() => handleOpenModal(admin)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={t('admin.editAdminTitle')}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('admin.deleteAdminTitle')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500">{t('admin.readOnlyAccess')}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg max-w-md w-full shadow-xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingAdmin ? t('admin.editAdminTitle') : t('admin.addAdminButton')}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.adminFormNameLabel')}
                  </label>
                  <input
                    type="text"
                    value={adminForm.name}
                    onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                    placeholder={t('admin.adminNamePlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.adminFormEmailLabel')}
                  </label>
                  <input
                    type="email"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    placeholder={t('admin.adminEmailPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.adminFormRoleLabel')}
                  </label>
                  <select
                    value={adminForm.role}
                    onChange={(e) =>
                      setAdminForm({
                        ...adminForm,
                        role: e.target.value as 'super' | 'limited',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="limited">{t('admin.roleBadgeLimited')}</option>
                    <option value="super">{t('admin.roleBadgeSuper')}</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    {adminForm.role === 'super'
                      ? t('admin.superAdminNote')
                      : t('admin.limitedAdminNote')}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  onClick={handleSaveAdmin}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? t('admin.saving') : editingAdmin ? t('admin.update') : t('admin.create')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
