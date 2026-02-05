import React, { useState, useMemo } from 'react';
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
  FiLayers,
  FiSearch,
  FiCopy,
  FiCheck,
  FiTag,
  FiCalendar,
  FiTrendingUp,
  FiFilter
} from 'react-icons/fi';
import { api } from '../services/api';
import Button from '../components/common/Button';
import ProtectedComponent from '../components/common/ProtectedComponent';
import { usePermissions } from '../hooks/usePermissions';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import './ReferencesPage.css';

// Модальное окно
const Modal = ({ isOpen, onClose, title, children, size = 'medium' }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={`modal-dialog modal-${size}`}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>{title}</h2>
            <button className="modal-close-btn" onClick={onClose}>
              <FiX />
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const ReferencesPage = () => {
  const queryClient = useQueryClient();
  const { canCreateReferences, canEditReferences, canDeleteReferences } = usePermissions();
  
  const [activeTab, setActiveTab] = useState('topics');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  
  // Модальные окна
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  const [editingItem, setEditingItem] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [formData, setFormData] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Загрузка данных
  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      const response = await api.references.getTopics();
      return response.data;
    },
  });

  const { data: subcategoriesData, isLoading: subcategoriesLoading } = useQuery({
    queryKey: ['subcategories'],
    queryFn: async () => {
      const response = await api.references.getSubcategories();
      return response.data;
    },
  });

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

  // Фильтрация и поиск
  const filteredData = useMemo(() => {
    let data = [];
    
    if (activeTab === 'topics') {
      data = topics;
    } else if (activeTab === 'subcategories') {
      data = subcategories;
    } else {
      data = cannedResponses;
    }

    // Поиск
    if (searchQuery) {
      data = data.filter(item => {
        const searchText = (item.name || item.title || '').toLowerCase();
        const description = (item.description || item.content || '').toLowerCase();
        return searchText.includes(searchQuery.toLowerCase()) || 
               description.includes(searchQuery.toLowerCase());
      });
    }

    // Фильтр по теме для подкатегорий
    if (activeTab === 'subcategories' && selectedTopic) {
      data = data.filter(item => item.topicId === parseInt(selectedTopic));
    }

    return data;
  }, [activeTab, topics, subcategories, cannedResponses, searchQuery, selectedTopic]);

  // Мутации
  const createMutation = useMutation({
    mutationFn: (data) => {
      if (activeTab === 'topics') return api.references.createTopic(data);
      if (activeTab === 'subcategories') return api.references.createSubcategory(data);
      return api.references.createCannedResponse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries([activeTab]);
      toast.success('Создано успешно');
      setShowEditModal(false);
      setEditingItem(null);
      setFormData({});
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка создания');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      if (activeTab === 'topics') return api.references.updateTopic(id, data);
      if (activeTab === 'subcategories') return api.references.updateSubcategory(id, data);
      return api.references.updateCannedResponse(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries([activeTab]);
      toast.success('Обновлено успешно');
      setShowEditModal(false);
      setEditingItem(null);
      setFormData({});
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка обновления');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => {
      if (activeTab === 'topics') return api.references.deleteTopic(id);
      if (activeTab === 'subcategories') return api.references.deleteSubcategory(id);
      return api.references.deleteCannedResponse(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries([activeTab]);
      toast.success('Удалено успешно');
      setShowDeleteModal(false);
      setItemToDelete(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка удаления');
    },
  });

  // Обработчики
  const handleAddNew = () => {
    setEditingItem({});
    if (activeTab === 'topics' || activeTab === 'subcategories') {
      setFormData({ name: '', description: '' });
    } else {
      setFormData({ title: '', content: '', category: '' });
    }
    setShowEditModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowEditModal(true);
  };

  const handlePreview = (item) => {
    setPreviewItem(item);
    setShowPreviewModal(true);
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleSave = () => {
    // Валидация
    if (activeTab === 'topics' || activeTab === 'subcategories') {
      if (!formData.name?.trim()) {
        toast.error('Название обязательно');
        return;
      }
      if (activeTab === 'subcategories' && !formData.topicId) {
        toast.error('Выберите тему');
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

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('Скопировано в буфер обмена');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Ошибка копирования');
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  const getIconForTab = (tab) => {
    if (tab === 'topics') return FiFolder;
    if (tab === 'subcategories') return FiLayers;
    return FiMessageSquare;
  };

  const getColorForItem = (index) => {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
    return colors[index % colors.length];
  };

  const isLoading = activeTab === 'topics' ? topicsLoading : 
                     activeTab === 'subcategories' ? subcategoriesLoading : 
                     responsesLoading;

  return (
    <div className="references-page">
      {/* Заголовок */}
      <div className="page-header-section">
        <div className="page-title-wrapper">
          <h1 className="page-title">Справочники</h1>
          <p className="page-description">
            Управление темами, подкатегориями и готовыми ответами
          </p>
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
      <div className="tabs-container">
        <div className="tabs-wrapper">
          <button 
            className={`tab-item ${activeTab === 'topics' ? 'active' : ''}`} 
            onClick={() => {
              setActiveTab('topics');
              setSearchQuery('');
              setSelectedTopic('');
            }}
          >
            <FiFolder className="tab-icon" />
            <span className="tab-label">Темы</span>
            <span className="tab-badge">{topics.length}</span>
          </button>
          
          <button 
            className={`tab-item ${activeTab === 'subcategories' ? 'active' : ''}`} 
            onClick={() => {
              setActiveTab('subcategories');
              setSearchQuery('');
            }}
          >
            <FiLayers className="tab-icon" />
            <span className="tab-label">Подкатегории</span>
            <span className="tab-badge">{subcategories.length}</span>
          </button>
          
          <button 
            className={`tab-item ${activeTab === 'cannedResponses' ? 'active' : ''}`} 
            onClick={() => {
              setActiveTab('cannedResponses');
              setSearchQuery('');
              setSelectedTopic('');
            }}
          >
            <FiMessageSquare className="tab-icon" />
            <span className="tab-label">Готовые ответы</span>
            <span className="tab-badge">{cannedResponses.length}</span>
          </button>
        </div>
      </div>

      {/* Панель поиска и фильтров */}
      <div className="search-filter-panel">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={`Поиск ${activeTab === 'topics' ? 'тем' : activeTab === 'subcategories' ? 'подкатегорий' : 'готовых ответов'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              <FiX />
            </button>
          )}
        </div>

        {activeTab === 'subcategories' && topics.length > 0 && (
          <div className="filter-group">
            <FiFilter className="filter-icon" />
            <select
              className="filter-select"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              <option value="">Все темы</option>
              {topics.map(topic => (
                <option key={topic.id} value={topic.id}>{topic.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="results-count">
          Найдено: <strong>{filteredData.length}</strong>
        </div>
      </div>

      {/* Контент */}
      <div className="references-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner-large" />
            <p>Загрузка данных...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {React.createElement(getIconForTab(activeTab), { size: 64 })}
            </div>
            <h3>
              {searchQuery ? 'Ничего не найдено' : 
               activeTab === 'topics' ? 'Нет тем' :
               activeTab === 'subcategories' ? 'Нет подкатегорий' :
               'Нет готовых ответов'}
            </h3>
            <p>
              {searchQuery ? 'Попробуйте изменить параметры поиска' :
               'Нажмите "Добавить" чтобы создать новый элемент'}
            </p>
            {!searchQuery && canCreateReferences && (
              <Button variant="primary" icon={<FiPlus />} onClick={handleAddNew}>
                Создать первый элемент
              </Button>
            )}
          </div>
        ) : (
          <div className="items-grid">
            <AnimatePresence mode="popLayout">
              {filteredData.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="reference-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                  transition={{ duration: 0.2 }}
                >
                  {/* Цветная полоска */}
                  <div 
                    className="card-accent" 
                    style={{ backgroundColor: getColorForItem(index) }}
                  />

                  <div className="card-header">
                    <div 
                      className="card-icon"
                      style={{ backgroundColor: `${getColorForItem(index)}20` }}
                    >
                      {React.createElement(getIconForTab(activeTab), { 
                        size: 24, 
                        color: getColorForItem(index) 
                      })}
                    </div>
                    <div className="card-actions">
                      {activeTab === 'cannedResponses' && (
                        <button
                          className="action-btn action-btn-preview"
                          onClick={() => handlePreview(item)}
                          title="Предпросмотр"
                        >
                          <FiMessageSquare />
                        </button>
                      )}
                      <ProtectedComponent resource="references" action="edit">
                        <button
                          className="action-btn action-btn-edit"
                          onClick={() => handleEdit(item)}
                          title="Редактировать"
                          disabled={!canEditReferences}
                        >
                          <FiEdit />
                        </button>
                      </ProtectedComponent>
                      <ProtectedComponent resource="references" action="delete">
                        <button
                          className="action-btn action-btn-delete"
                          onClick={() => handleDeleteClick(item)}
                          title="Удалить"
                          disabled={!canDeleteReferences}
                        >
                          <FiTrash2 />
                        </button>
                      </ProtectedComponent>
                    </div>
                  </div>

                  <div className="card-body">
                    <h3 className="card-title">{item.name || item.title}</h3>
                    
                    {item.description && (
                      <p className="card-description">{item.description}</p>
                    )}
                    
                    {item.content && (
                      <p className="card-description">
                        {item.content.length > 120 
                          ? `${item.content.substring(0, 120)}...` 
                          : item.content}
                      </p>
                    )}

                    <div className="card-footer">
                      {activeTab === 'subcategories' && item.topicName && (
                        <span className="card-tag">
                          <FiFolder size={14} />
                          {item.topicName}
                        </span>
                      )}
                      
                      {activeTab === 'cannedResponses' && item.category && (
                        <span className="card-tag">
                          <FiTag size={14} />
                          {item.category}
                        </span>
                      )}

                      {activeTab === 'cannedResponses' && (
                        <button
                          className={`copy-btn ${copiedId === item.id ? 'copied' : ''}`}
                          onClick={() => handleCopy(item.content, item.id)}
                        >
                          {copiedId === item.id ? (
                            <>
                              <FiCheck />
                              <span>Скопировано</span>
                            </>
                          ) : (
                            <>
                              <FiCopy />
                              <span>Копировать</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Модальное окно редактирования */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
          setFormData({});
        }}
        title={editingItem?.id ? 'Редактировать' : 'Создать новый элемент'}
        size="large"
      >
        <div className="modal-body">
          {activeTab === 'topics' && (
            <>
              <div className="form-field">
                <label className="form-label">Название *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Введите название темы"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="form-field">
                <label className="form-label">Описание</label>
                <textarea
                  className="form-control"
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
              <div className="form-field">
                <label className="form-label">Тема *</label>
                <select
                  className="form-control"
                  value={formData.topicId || ''}
                  onChange={(e) => setFormData({ ...formData, topicId: parseInt(e.target.value) })}
                >
                  <option value="">Выберите тему</option>
                  {topics.map(topic => (
                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Название *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Введите название подкатегории"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Описание</label>
                <textarea
                  className="form-control"
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
              <div className="form-field">
                <label className="form-label">Заголовок *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Введите заголовок"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Категория</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Введите категорию (опционально)"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Содержание *</label>
                <textarea
                  className="form-control"
                  placeholder="Введите текст готового ответа"
                  value={formData.content || ''}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                />
                <small className="form-hint">
                  {formData.content?.length || 0} символов
                </small>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <Button 
            variant="ghost" 
            onClick={() => {
              setShowEditModal(false);
              setEditingItem(null);
              setFormData({});
            }}
          >
            Отмена
          </Button>
          <Button 
            variant="primary" 
            icon={<FiSave />} 
            onClick={handleSave}
            loading={createMutation.isLoading || updateMutation.isLoading}
          >
            Сохранить
          </Button>
        </div>
      </Modal>

      {/* Модальное окно предпросмотра */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewItem(null);
        }}
        title="Предпросмотр ответа"
        size="large"
      >
        <div className="modal-body">
          <div className="preview-content">
            <h3>{previewItem?.title}</h3>
            {previewItem?.category && (
              <span className="preview-category">
                <FiTag />
                {previewItem.category}
              </span>
            )}
            <div className="preview-text">{previewItem?.content}</div>
          </div>
        </div>
        <div className="modal-footer">
          <Button 
            variant="secondary" 
            icon={<FiCopy />}
            onClick={() => {
              handleCopy(previewItem?.content, previewItem?.id);
              setShowPreviewModal(false);
            }}
          >
            Копировать
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setShowPreviewModal(false)}
          >
            Закрыть
          </Button>
        </div>
      </Modal>

      {/* Модальное окно удаления */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        title="Подтверждение удаления"
        size="small"
      >
        <div className="modal-body">
          <div className="delete-confirmation">
            <div className="delete-icon">
              <FiTrash2 />
            </div>
            <p>
              Вы уверены, что хотите удалить <strong>{itemToDelete?.name || itemToDelete?.title}</strong>?
            </p>
            <p className="delete-warning">
              Это действие нельзя отменить.
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <Button 
            variant="ghost" 
            onClick={() => {
              setShowDeleteModal(false);
              setItemToDelete(null);
            }}
          >
            Отмена
          </Button>
          <Button 
            variant="danger" 
            icon={<FiTrash2 />}
            onClick={confirmDelete}
            loading={deleteMutation.isLoading}
          >
            Удалить
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ReferencesPage;