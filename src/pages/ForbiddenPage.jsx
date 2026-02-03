import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiHome } from 'react-icons/fi';
import Button from '../components/common/Button';
import './ForbiddenPage.css';

/**
 * Страница 403 - Доступ запрещен
 */
const ForbiddenPage = () => {
  const navigate = useNavigate();

  return (
    <div className="forbidden-page">
      <div className="forbidden-content">
        <div className="forbidden-icon">
          <FiLock />
        </div>
        
        <h1 className="forbidden-title">403</h1>
        <h2 className="forbidden-subtitle">Доступ запрещен</h2>
        
        <p className="forbidden-message">
          У вас нет прав для просмотра этой страницы. <br />
          Если вы считаете, что это ошибка, обратитесь к администратору.
        </p>

        <div className="forbidden-actions">
          <Button
            variant="primary"
            icon={<FiHome />}
            onClick={() => navigate('/dashboard')}
          >
            Вернуться на главную
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
          >
            Назад
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;
