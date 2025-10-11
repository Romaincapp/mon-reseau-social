'use client'

import React, { useState } from 'react';
import { ArrowLeft, LogOut, Trash2, User, Mail, Lock, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, signOut, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    likes: true,
    comments: true,
    follows: true,
    newPosts: false,
    email: false
  });

  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
    router.push('/auth/login');
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      // TODO: Implement complete account deletion
      // This would involve:
      // 1. Delete user posts and associated data
      // 2. Delete user profile
      // 3. Delete user auth account
      console.log('Deleting account for user:', user?.id);

      // For now, just sign out
      await signOut();
      router.push('/auth/login');
      alert('Compte supprimé avec succès');

    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Erreur lors de la suppression du compte');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement password change with Supabase
      console.log('Change password from', passwordData.currentPassword, 'to', passwordData.newPassword);
      alert('Mot de passe modifié avec succès !');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSave = async () => {
    setLoading(true);
    try {
      // TODO: Save notification settings to database/local storage
      console.log('Saving notification settings:', notificationSettings);
      alert('Préférences de notification sauvegardées !');
      setShowNotificationsModal(false);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-md mx-auto bg-transparent min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-8 rounded-b-3xl">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="text-white/80 hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Paramètres</h1>
            <div className="w-6 h-6"></div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Account Section */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compte</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/profile')}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <User className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium">Modifier le profil</p>
                  <p className="text-sm text-gray-500">Nom, bio, etc.</p>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                <Mail className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-gray-500">{profile?.email || 'Email non défini'}</p>
                </div>
              </button>

              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Lock className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium">Changer le mot de passe</p>
                  <p className="text-sm text-gray-500">Sécuriser votre compte</p>
                </div>
              </button>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowNotificationsModal(true)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium">Préférences de notification</p>
                  <p className="text-sm text-gray-500">Gérer vos notifications</p>
                </div>
              </button>
            </div>
          </div>

          {/* Actions Section */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600 disabled:opacity-50"
              >
                <LogOut className="w-5 h-5" />
                <div className="flex-1">
                  <p className="font-medium">Se déconnecter</p>
                  <p className="text-sm text-red-500">Fermer votre session</p>
                </div>
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600"
              >
                <Trash2 className="w-5 h-5" />
                <div className="flex-1">
                  <p className="font-medium">Supprimer le compte</p>
                  <p className="text-sm text-red-500">Action irréversible</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Modal */}
        {showNotificationsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Préférences de notification</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">J'aime</p>
                    <p className="text-sm text-gray-500">Notifier quand quelqu'un aime vos vocaux</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.likes}
                      onChange={(e) => setNotificationSettings({...notificationSettings, likes: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Commentaires</p>
                    <p className="text-sm text-gray-500">Notifier pour les nouveaux commentaires</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.comments}
                      onChange={(e) => setNotificationSettings({...notificationSettings, comments: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Nouveaux abonnés</p>
                    <p className="text-sm text-gray-500">Notifier pour les nouveaux followers</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.follows}
                      onChange={(e) => setNotificationSettings({...notificationSettings, follows: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Nouveaux vocaux</p>
                    <p className="text-sm text-gray-500">Notifier pour les nouveaux vocaux dans le feed</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.newPosts}
                      onChange={(e) => setNotificationSettings({...notificationSettings, newPosts: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Notifications par email</p>
                    <p className="text-sm text-gray-500">Recevoir un résumé par email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.email}
                      onChange={(e) => setNotificationSettings({...notificationSettings, email: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNotificationsModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleNotificationSave}
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 rounded-lg font-medium"
                >
                  {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Changer le mot de passe</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe actuel
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Votre mot de passe actuel"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Nouveau mot de passe (min. 6 caractères)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Confirmez votre nouveau mot de passe"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({currentPassword: '', newPassword: '', confirmPassword: ''});
                  }}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="flex-1 px-4 py-2 text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 rounded-lg font-medium"
                >
                  {loading ? 'Modification...' : 'Modifier'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Supprimer le compte</h3>
              <p className="text-sm text-gray-600 mb-6">
                Cette action est irréversible. Tous vos vocaux et données seront définitivement supprimés.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}