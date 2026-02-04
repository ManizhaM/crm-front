import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiSave, 
  FiX,
  FiFolder,
  FiMessageSquare,
  FiLayers
} from 'react-icons/fi';
import { api } from '../services/api';
import Button from '../components/common/Button';
import ProtectedComponent from '../components/common/ProtectedComponent';
import { usePermissions } from '../hooks/usePermissions';
import toast from 'react-hot-toast';
import './ReferencesPage.css';

const ReferencesPage = () => {
  const queryClient = useQueryClient();
  const { canCreateReferences, canEditReferences, canDeleteReferences } = usePermissions();
  
  const [activeTab, setActiveTab] = useState('topics');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Загрузка тем
  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      const response = await api.references.getTopics();
      return response.data;
    },
  });

  // Загрузка подкатегорий
  const { data: subcategoriesData, isLoading: subcategoriesLoading } = useQuery({
    queryKey: ['subcategories'],
    queryFn: async () => {
      const response = await api.references.getSubcategories();
      return response.data;
    },
  });

  // Загрузка готовых ответов
  const { data: cannedResponsesData, isLoading: responsesLoading } = useQuery({
    queryKey: ['cannedResponses'],
    queryFn: async () => {
      const response = await api.references.getCannedResponses();
      return response.data;
    },
  });

  const topics = Array.isArray(topicsData) ? topicsData : [];
  const subcategories = Array.isArray(subcategoriesData) ? subcategoriesData : [];
  const cannedResponses = Array.isArray(cannedResponsesData) ? cannedResponsesData : [];

  // Создание
  const createMutation = useMutation({
    mutationFn: (data) => {
      if (activeTab === 'topics') {
        return api.references.createTopic(data);
      }
      if (activeTab === 'subcategories') {
        return api.references.createSubcategory(data);
      }
      return api.references.createCannedResponse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries([activeTab === 'topics' ? 'topics' : activeTab === 'subcategories' ? 'subcategories' : 'cannedResponses']);
      toast.success('Создано успешно');
      setEditingItem(null);
      setFormData({});
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка создания');
    },
  });

  // Обновление
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      if (activeTab === 'topics') {
        return api.references.updateTopic(id, data);
      }
      if (activeTab === 'subcategories') {
        return api.references.updateSubcategory(id, data);
      }
      return api.references.updateCannedResponse(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries([activeTab === 'topics' ? 'topics' : activeTab === 'subcategories' ? 'subcategories' : 'cannedResponses']);
      toast.success('Обновлено успешно');
      setEditingItem(null);
      setFormData({});
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка обновления');
    },
  });

  // Удаление
  const deleteMutation = useMutation({
    mutationFn: (id) => {
      if (activeTab === 'topics') {
        return api.references.deleteTopic(id);
      }
      if (activeTab === 'subcategories') {
        return api.references.deleteSubcategory(id);
      }
      return api.references.deleteCannedResponse(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries([activeTab === 'topics' ? 'topics' : activeTab === 'subcategories' ? 'subcategories' : 'cannedResponses']);
      toast.success('Удалено успешно');
      setShowDeleteModal(false);
      setItemToDelete(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка удаления');
    },
  });

  const handleSave = () => {
    // Валидация
    if (activeTab === 'topics' || activeTab === 'subcategories') {
      if (!formData.name?.trim()) {
        toast.error('Название обязательно');
        return;
      }
    } else {
      if (!formData.title?.trim()) {
        toast.error('Заголовок обязателен');
        return;
      }
      if (!formData.content?.trim()) {
        toast.error('Содержание обязательно');
        return;
      }
    }

    if (editingItem?.id) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  const handleAddNew = () => {
    setEditingItem({});
    if (activeTab === 'topics' || activeTab === 'subcategories') {
      setFormData({ name: '', description: '' });
    } else {
      setFormData({ title: '', content: '', category: '' });
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
    setFormData({});
  };

  const getCurrentData = () => {
    if (activeTab === 'topics') return topics;
    if (activeTab === 'subcategories') return subcategories;
    return cannedResponses;
  };

  const currentData = getCurrentData();
  const isLoading = activeTab === 'topics' ? topicsLoading : activeTab === 'subcategories' ? subcategoriesLoading : responsesLoading;

  return (
    <div className="references-page">
      {/* Заголовок */}
      <div className="references-header">
        <div>
          <h1>Справочники</h1>
          <p className="references-subtitle">Управление темами, подкатегориями и готовыми ответами</p>
        </div>
        
        <ProtectedComponent resource="references" action="create">
          <Button 
            variant="primary" 
            icon={<FiPlus />} 
            onClick={handleAddNew}
            disabled={!canCreateReferences}
          >
            Добавить
          </Button>
        </ProtectedComponent>
      </div>

      {/* Вкладки */}
      <div className="references-tabs">
        <button 
          className={`tab-button ${activeTab === 'topics' ? 'active' : ''}`} 
          onClick={() => setActiveTab('topics')}
        >
          <FiFolder />
          <span>Темы</span>
          <span className="tab-count">{topics.length}</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'subcategories' ? 'active' : ''}`} 
          onClick={() => setActiveTab('subcategories')}
        >
          <FiLayers />
          <span>Подкатегории</span>
          <span className="tab-count">{subcategories.length}</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'cannedResponses' ? 'active' : ''}`} 
          onClick={() => setActiveTab('cannedResponses')}
        >
          <FiMessageSquare />
          <span>Готовые ответы</span>
          <span className="tab-count">{cannedResponses.length}</span>
        </button>
      </div>

      {/* Контент */}
      <div className="references-content">
        {/* Список */}
        <div className="references-list">
          {isLoading ? (
            <div className="references-loading">
              <div className="spinner"></div>
              <p>Загрузка...</p>
            </div>
          ) : currentData.length === 0 ? (
            <div className="references-empty">
              <p>Нет данных</p>
              <ProtectedComponent resource="references" action="create">
                <Button variant="primary" icon={<FiPlus />} onClick={handleAddNew}>
                  Добавить первый элемент
                </Button>
              </ProtectedComponent>
            </div>
          ) : (
            currentData.map(item => (
              <motion.div 
                key={item.id} 
                className="reference-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                layout
              >
                <div className="reference-item-content">
                  <h3>{item.name || item.title}</h3>
                  <p>{item.description || item.content?.substring(0, 150)}</p>
                  {activeTab === 'subcategories' && item.topicName && (
                    <span className="reference-badge">Тема: {item.topicName}</span>
                  )}
                  {activeTab === 'cannedResponses' && item.category && (
                    <span className="reference-badge">{item.category}</span>
                  )}
                </div>
                <div className="reference-item-actions">
                  <ProtectedComponent resource="references" action="edit">
                    <button 
                      className="btn-icon btn-edit" 
                      onClick={() => handleEdit(item)}
                      title="Редактировать"
                      disabled={!canEditReferences}
                    >
                      <FiEdit />
                    </button>
                  </ProtectedComponent>
                  
                  <ProtectedComponent resource="references" action="delete">
                    <button 
                      className="btn-icon btn-delete" 
                      onClick={() => handleDeleteClick(item)}
                      title="Удалить"
                      disabled={!canDeleteReferences}
                    >
                      <FiTrash2 />
                    </button>
                  </ProtectedComponent>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Форма редактирования */}
        <AnimatePresence>
          {editingItem && (
            <motion.div 
              className="reference-form-panel"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
            >
              <div className="reference-form">
                <div className="form-header">
                  <h3>{editingItem.id ? 'Редактировать' : 'Создать новый элемент'}</h3>
                  <button className="btn-close" onClick={handleCancel}>
                    <FiX />
                  </button>
                </div>

                <div className="form-body">
                  {activeTab === 'topics' && (
                    <>
                      <div className="form-group">
                        <label>Название *</label>
                        <input
                          type="text"
                          placeholder="Введите название темы"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          autoFocus
                        />
                      </div>
                      <div className="form-group">
                        <label>Описание</label>
                        <textarea
                          placeholder="Введите описание темы"
                          value={formData.description || ''}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={4}
                        />
                      </div>
                    </>
                  )}

                  {activeTab === 'subcategories' && (
                    <>
                      <div className="form-group">
                        <label>Тема *</label>
                        <select
                          value={formData.topicId || ''}
                          onChange={(e) => setFormData({ ...formData, topicId: parseInt(e.target.value) })}
                        >
                          <option value="">Выберите тему</option>
                          {topics.map(topic => (
                            <option key={topic.id} value={topic.id}>{topic.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Название *</label>
                        <input
                          type="text"
                          placeholder="Введите название подкатегории"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Описание</label>
                        <textarea
                          placeholder="Введите описание подкатегории"
                          value={formData.description || ''}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={4}
                        />
                      </div>
                    </>
                  )}

                  {activeTab === 'cannedResponses' && (
                    <>
                      <div className="form-group">
                        <label>Заголовок *</label>
                        <input
                          type="text"
                          placeholder="Введите заголовок"
                          value={formData.title || ''}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Категория</label>
                        <input
                          type="text"
                          placeholder="Введите категорию (опционально)"
                          value={formData.category || ''}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Содержание *</label>
                        <textarea
                          placeholder="Введите текст готового ответа"
                          value={formData.content || ''}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          rows={6}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="form-footer">
                  <Button variant="ghost" onClick={handleCancel}>
                    Отмена
                  </Button>
                  <Button 
                    variant="primary" 
                    icon={<FiSave />} 
                    onClick={handleSave}
                    disabled={createMutation.isLoading || updateMutation.isLoading}
                  >
                    {createMutation.isLoading || updateMutation.isLoading ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Модальное окно удаления */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              className="modal-content modal-small"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Подтверждение удаления</h2>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                  <FiX />
                </button>
              </div>

              <div className="modal-body">
                <p>Вы уверены, что хотите удалить <strong>{itemToDelete?.name || itemToDelete?.title}</strong>?</p>
                <p className="text-danger">Это действие нельзя отменить.</p>
              </div>

              <div className="modal-footer">
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                  Отмена
                </Button>
                <Button 
                  variant="danger" 
                  onClick={confirmDelete}
                  disabled={deleteMutation.isLoading}
                >
                  {deleteMutation.isLoading ? 'Удаление...' : 'Удалить'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReferencesPage;
