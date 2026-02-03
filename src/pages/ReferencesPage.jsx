import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiEdit, FiTrash2, FiSave } from 'react-icons/fi';
import { api } from '../services/api';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import './ReferencesPage.css';

const ReferencesPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('topics');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  const { data: topicsData } = useQuery({
    queryKey: ['topics'],
    queryFn: async () => (await api.topics.getAll()).data,
  });

  const { data: subcategoriesData } = useQuery({
    queryKey: ['subcategories'],
    queryFn: async () => (await api.subcategories.getAll()).data,
  });

  const { data: cannedResponsesData } = useQuery({
    queryKey: ['cannedResponses'],
    queryFn: async () => (await api.cannedResponses.getAll()).data,
  });

  const topics = Array.isArray(topicsData) ? topicsData : [];
  const subcategories = Array.isArray(subcategoriesData) ? subcategoriesData : [];
  const cannedResponses = Array.isArray(cannedResponsesData) ? cannedResponsesData : [];

  const createMutation = useMutation({
    mutationFn: (data) => {
      if (activeTab === 'topics') return api.topics.create(data);
      if (activeTab === 'subcategories') return api.subcategories.create(data);
      return api.cannedResponses.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries([activeTab]);
      toast.success('Создано успешно');
      setEditingItem(null);
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      if (activeTab === 'topics') return api.topics.update(id, data);
      if (activeTab === 'subcategories') return api.subcategories.update(id, data);
      return api.cannedResponses.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries([activeTab]);
      toast.success('Обновлено успешно');
      setEditingItem(null);
      setFormData({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => {
      if (activeTab === 'topics') return api.topics.delete(id);
      if (activeTab === 'subcategories') return api.subcategories.delete(id);
      return api.cannedResponses.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries([activeTab]);
      toast.success('Удалено успешно');
    },
  });

  const handleSave = () => {
    if (editingItem?.id) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
  };

  const handleDelete = (id) => {
    if (window.confirm('Вы уверены?')) {
      deleteMutation.mutate(id);
    }
  };

  const currentData = activeTab === 'topics' ? topics : activeTab === 'subcategories' ? subcategories : cannedResponses;

  return (
    <div className="references-page">
      <div className="references-header">
        <h1>Справочники</h1>
        <Button variant="primary" icon={<FiPlus />} onClick={() => { setEditingItem({}); setFormData({}); }}>
          Добавить
        </Button>
      </div>

      <div className="references-tabs">
        <button className={activeTab === 'topics' ? 'active' : ''} onClick={() => setActiveTab('topics')}>Темы</button>
        <button className={activeTab === 'subcategories' ? 'active' : ''} onClick={() => setActiveTab('subcategories')}>Подкатегории</button>
        <button className={activeTab === 'responses' ? 'active' : ''} onClick={() => setActiveTab('responses')}>Готовые ответы</button>
      </div>

      <div className="references-content">
        <div className="references-list">
          {currentData?.map(item => (
            <motion.div key={item.id} className="reference-item" layout>
              <div>
                <h3>{item.name || item.title}</h3>
                <p>{item.description || item.content?.substring(0, 100)}</p>
              </div>
              <div className="reference-actions">
                <button onClick={() => handleEdit(item)}><FiEdit /></button>
                <button onClick={() => handleDelete(item.id)}><FiTrash2 /></button>
              </div>
            </motion.div>
          ))}
        </div>

        {editingItem && (
          <motion.div className="reference-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3>{editingItem.id ? 'Редактировать' : 'Создать'}</h3>
            <input
              type="text"
              placeholder="Название"
              value={formData.name || formData.title || ''}
              onChange={(e) => setFormData({ ...formData, [activeTab === 'responses' ? 'title' : 'name']: e.target.value })}
            />
            <textarea
              placeholder="Описание"
              value={formData.description || formData.content || ''}
              onChange={(e) => setFormData({ ...formData, [activeTab === 'responses' ? 'content' : 'description']: e.target.value })}
              rows={4}
            />
            <div className="form-actions">
              <Button variant="ghost" onClick={() => { setEditingItem(null); setFormData({}); }}>Отмена</Button>
              <Button variant="primary" icon={<FiSave />} onClick={handleSave}>Сохранить</Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ReferencesPage;
