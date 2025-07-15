import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../App';
import { authAPI } from '../services/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateProfileForm = () => {
    const newErrors = {};

    if (!profileData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (profileData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!profileData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (profileData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one lowercase letter, one uppercase letter, and one number';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!validateProfileForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.updateProfile(profileData);
      updateUser(response.data.user);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      toast.success('Password changed successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || ''
    });
    setIsEditing(false);
    setErrors({});
  };

  const handleCancelPassword = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordForm(false);
    setErrors({});
  };

  return (
    <div className="profile-page">
      <section className="section">
        <div className="container container-sm">
          <div className="card">
            <div className="card-header">
              <h1 className="card-title">Profile Settings</h1>
              <p className="card-subtitle">
                Manage your account information and preferences
              </p>
            </div>

            {/* Profile Information */}
            <div className="mb-6">
              <div className="flex-between mb-4">
                <h3 className="font-semibold">Personal Information</h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-secondary btn-sm"
                    disabled={isLoading}
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleProfileSubmit}>
                  <div className="grid grid-2 gap-4">
                    <div className="form-group">
                      <label htmlFor="firstName" className="form-label">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        className={`form-input ${errors.firstName ? 'error' : ''}`}
                        value={profileData.firstName}
                        onChange={handleProfileChange}
                        disabled={isLoading}
                      />
                      {errors.firstName && (
                        <div className="form-error">{errors.firstName}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="lastName" className="form-label">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        className={`form-input ${errors.lastName ? 'error' : ''}`}
                        value={profileData.lastName}
                        onChange={handleProfileChange}
                        disabled={isLoading}
                      />
                      {errors.lastName && (
                        <div className="form-error">{errors.lastName}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="btn btn-secondary"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-2 gap-4">
                  <div>
                    <label className="form-label">First Name</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      {user?.firstName}
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Last Name</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      {user?.lastName}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">Email Address</label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      {user?.email}
                    </div>
                    <div className="form-help">
                      Email address cannot be changed
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Password Change */}
            <div className="border-t pt-6">
              <div className="flex-between mb-4">
                <h3 className="font-semibold">Password & Security</h3>
                {!showPasswordForm && (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="btn btn-secondary btn-sm"
                    disabled={isLoading}
                  >
                    Change Password
                  </button>
                )}
              </div>

              {showPasswordForm ? (
                <form onSubmit={handlePasswordSubmit}>
                  <div className="form-group">
                    <label htmlFor="currentPassword" className="form-label">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      className={`form-input ${errors.currentPassword ? 'error' : ''}`}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      disabled={isLoading}
                    />
                    {errors.currentPassword && (
                      <div className="form-error">{errors.currentPassword}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword" className="form-label">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      className={`form-input ${errors.newPassword ? 'error' : ''}`}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      disabled={isLoading}
                    />
                    {errors.newPassword && (
                      <div className="form-error">{errors.newPassword}</div>
                    )}
                    <div className="form-help">
                      Password must contain at least one lowercase letter, one uppercase letter, and one number
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      disabled={isLoading}
                    />
                    {errors.confirmPassword && (
                      <div className="form-error">{errors.confirmPassword}</div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Changing...' : 'Change Password'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelPassword}
                      className="btn btn-secondary"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <p className="text-secondary">
                    Password was last changed on{' '}
                    {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              )}
            </div>

            {/* Account Information */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Account Information</h3>
              <div className="grid grid-2 gap-4 text-sm">
                <div>
                  <span className="text-secondary">Member since:</span>
                  <div className="font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="text-secondary">Last updated:</span>
                  <div className="font-medium">
                    {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data & Privacy */}
          <div className="mt-6">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Data & Privacy</h3>
              </div>
              
              <div className="space-y-4">
                <div className="alert alert-info">
                  <h4 className="font-semibold mb-2">🔒 Your Privacy Matters</h4>
                  <p className="text-sm">
                    We take your privacy seriously. Your personal information is encrypted and stored securely.
                    We never share your data with third parties without your explicit consent.
                  </p>
                </div>

                <div className="flex-between py-3 border-b">
                  <div>
                    <div className="font-medium">Search History</div>
                    <div className="text-sm text-secondary">
                      Your recent calorie searches are stored locally in your browser
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem('recentSearches');
                      toast.success('Search history cleared');
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    Clear History
                  </button>
                </div>

                <div className="py-3">
                  <div className="font-medium text-error">Danger Zone</div>
                  <div className="text-sm text-secondary mb-3">
                    These actions are permanent and cannot be undone
                  </div>
                  <button
                    onClick={() => {
                      const confirmed = window.confirm(
                        'Are you sure you want to deactivate your account? This action cannot be undone.'
                      );
                      if (confirmed) {
                        toast.info('Account deactivation feature coming soon');
                      }
                    }}
                    className="btn btn-danger btn-sm"
                  >
                    Deactivate Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile; 