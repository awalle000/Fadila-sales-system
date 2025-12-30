import { useState, useEffect } from 'react';
import { getAllUsers, createUser, toggleUserStatus, deleteUser } from '../../../services/authService';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Input/Input';
import Modal from '../../../components/common/Modal/Modal';
import Loader from '../../../components/common/Loader/Loader';
import { formatDate } from '../../../utils/formatDate';
import toast from 'react-hot-toast';
import './UserManagement.css';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'manager'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // ✅ Changed from registerUser to createUser
      await createUser(formData);
      toast.success('User created successfully!');
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', role: 'manager' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (userId, isActive) => {
    try {
      await toggleUserStatus(userId);
      toast.success(`User ${isActive ? 'deactivated' : 'activated'} successfully!`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteUser(userId);
      toast.success('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 User Management</h1>
          <p className="page-subtitle">Manage system users and permissions</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          + Add User
        </Button>
      </div>

      {/* Users Stats */}
      <div className="users-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <div className="stat-value">{users.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👔</div>
          <div className="stat-content">
            <h3>CEOs</h3>
            <div className="stat-value">{users.filter(u => u.role === 'ceo').length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👨‍💼</div>
          <div className="stat-content">
            <h3>Managers</h3>
            <div className="stat-value">{users.filter(u => u.role === 'manager').length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Active Users</h3>
            <div className="stat-value">{users.filter(u => u.isActive).length}</div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td className="user-name">
                  {user.name}
                  {user._id === currentUser._id && (
                    <span className="current-user-badge">You</span>
                  )}
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role === 'ceo' ? '👔 CEO' : '👨‍💼 Manager'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? '✅ Active' : '⛔ Inactive'}
                  </span>
                </td>
                <td>{formatDate(user.createdAt)}</td>
                <td>
                  <div className="action-buttons">
                    {user._id !== currentUser._id && (
                      <>
                        <button
                          className={`btn-action ${user.isActive ? 'deactivate' : 'activate'}`}
                          onClick={() => handleToggleStatus(user._id, user.isActive)}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="btn-action delete"
                          onClick={() => handleDeleteUser(user._id, user.name)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New User"
        size="medium"
      >
        <form onSubmit={handleAddUser}>
          <Input
            label="Full Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter full name"
            required
          />

          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter email address"
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Enter password (min 6 characters)"
            required
          />

          <div className="input-group">
            <label htmlFor="role" className="input-label">
              Role <span className="required">*</span>
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input-field"
              required
            >
              <option value="manager">Manager</option>
              <option value="ceo">CEO</option>
            </select>
          </div>

          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success" loading={saving}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;