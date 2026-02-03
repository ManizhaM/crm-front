import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiCheck, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import Button from '../components/common/Button';

// Модальное окно создания роли
export const CreateRoleModal = ({ permissions, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissionIds: []
  });
  const [expandedResources, setExpandedResources] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const togglePermission = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter(id => id !== permissionId)
        : [...prev.permissionIds, permissionId]
    }));
  };

  const toggleResource = (resource) => {
    setExpandedResources(prev => ({
      ...prev,
      [resource]: !prev[resource]
    }));
  };

  const selectAllInResource = (resourcePermissions) => {
    const allIds = resourcePermissions.map(p => p.id);
    const allSelected = allIds.every(id => formData.permissionIds.includes(id));
    
    if (allSelected) {
      // Убрать все
      setFormData(prev => ({
        ...prev,
        permissionIds: prev.permissionIds.filter(id => !allIds.includes(id))
      }));
    } else {
      // Добавить все
      setFormData(prev => ({
        ...prev,
        permissionIds: [...new Set([...prev.permissionIds, ...allIds])]
      }));
    }
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content modal-large"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Создать новую роль</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Системное имя *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase().replace(/\s/g, '_') })}
              placeholder="MANAGER"
              required
            />
            <small>Используйте только заглавные буквы и подчеркивания</small>
          </div>

          <div className="form-group">
            <label>Отображаемое имя *</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="Менеджер"
              required
            />
          </div>

          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Краткое описание роли"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Разрешения</label>
            <div className="permissions-list">
              {permissions?.map((group) => {
                const allSelected = group.permissions.every(p => 
                  formData.permissionIds.includes(p.id)
                );
                const someSelected = group.permissions.some(p => 
                  formData.permissionIds.includes(p.id)
                );

                return (
                  <div key={group.resource} className="permission-group">
                    <div 
                      className="permission-group-header"
                      onClick={() => toggleResource(group.resource)}
                    >
                      <div className="permission-group-title">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={input => {
                            if (input) input.indeterminate = someSelected && !allSelected;
                          }}
                          onChange={() => selectAllInResource(group.permissions)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{group.displayName}</span>
                        <span className="permission-count">
                          ({group.permissions.filter(p => formData.permissionIds.includes(p.id)).length}/{group.permissions.length})
                        </span>
                      </div>
                      {expandedResources[group.resource] ? <FiChevronUp /> : <FiChevronDown />}
                    </div>

                    {expandedResources[group.resource] && (
                      <div className="permission-group-items">
                        {group.permissions.map((permission) => (
                          <label key={permission.id} className="permission-item">
                            <input
                              type="checkbox"
                              checked={formData.permissionIds.includes(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                            />
                            <div>
                              <div className="permission-name">{permission.displayName}</div>
                              {permission.description && (
                                <div className="permission-description">{permission.description}</div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? 'Создание...' : 'Создать роль'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Модальное окно редактирования роли
export const EditRoleModal = ({ role, permissions, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    displayName: role.displayName,
    description: role.description || '',
    isActive: role.isActive,
    permissionIds: []
  });
  const [expandedResources, setExpandedResources] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    // Загрузить детали роли с разрешениями
    const loadRoleDetails = async () => {
      try {
        const response = await fetch(`/api/roles/${role.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          permissionIds: data.permissions.map(p => p.id)
        }));
      } catch (error) {
        console.error('Ошибка загрузки разрешений роли:', error);
      } finally {
        setLoadingDetails(false);
      }
    };

    loadRoleDetails();
  }, [role.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = role.isSystem 
      ? { displayName: formData.displayName, description: formData.description, isActive: formData.isActive }
      : formData;
    onSubmit(submitData);
  };

  const togglePermission = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter(id => id !== permissionId)
        : [...prev.permissionIds, permissionId]
    }));
  };

  const toggleResource = (resource) => {
    setExpandedResources(prev => ({
      ...prev,
      [resource]: !prev[resource]
    }));
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content modal-large"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Редактировать роль</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Системное имя</label>
            <input
              type="text"
              value={role.name}
              disabled
              className="input-disabled"
            />
            <small>Системное имя нельзя изменить</small>
          </div>

          <div className="form-group">
            <label>Отображаемое имя *</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <span>Роль активна</span>
            </label>
          </div>

          {!role.isSystem && !loadingDetails && (
            <div className="form-group">
              <label>Разрешения</label>
              <div className="permissions-list">
                {permissions?.map((group) => (
                  <div key={group.resource} className="permission-group">
                    <div 
                      className="permission-group-header"
                      onClick={() => toggleResource(group.resource)}
                    >
                      <div className="permission-group-title">
                        <span>{group.displayName}</span>
                        <span className="permission-count">
                          ({group.permissions.filter(p => formData.permissionIds.includes(p.id)).length}/{group.permissions.length})
                        </span>
                      </div>
                      {expandedResources[group.resource] ? <FiChevronUp /> : <FiChevronDown />}
                    </div>

                    {expandedResources[group.resource] && (
                      <div className="permission-group-items">
                        {group.permissions.map((permission) => (
                          <label key={permission.id} className="permission-item">
                            <input
                              type="checkbox"
                              checked={formData.permissionIds.includes(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                            />
                            <div>
                              <div className="permission-name">{permission.displayName}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {role.isSystem && (
            <div className="info-box">
              <p><strong>Системная роль</strong></p>
              <p>Нельзя изменять разрешения системной роли. Создайте новую роль, если нужны другие разрешения.</p>
            </div>
          )}

          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Модальное окно удаления роли
export const DeleteRoleModal = ({ role, onClose, onConfirm, isLoading }) => {
  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content modal-small"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Удалить роль</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          <p>Вы уверены, что хотите удалить роль <strong>{role.displayName}</strong>?</p>
          <p className="text-danger">Это действие нельзя отменить.</p>
          
          {role.usersCount > 0 && (
            <div className="warning-box">
              <p><strong>Внимание!</strong></p>
              <p>Роль назначена {role.usersCount} пользователям. Сначала переназначьте пользователей на другие роли.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button 
            variant="danger" 
            onClick={onConfirm} 
            disabled={isLoading || role.usersCount > 0}
          >
            {isLoading ? 'Удаление...' : 'Удалить'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};
