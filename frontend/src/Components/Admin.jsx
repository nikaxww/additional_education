import React, { useState, useEffect } from "react";

const Admin = ({ onLogout }) => {
  const [requests, setRequests] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState("requests");

  const loadData = () => {
    fetch("http://localhost:3001/requests/admin")
      .then(r => r.ok && r.json().then(setRequests))
      .catch(e => console.error("Ошибка загрузки заявок:", e));
    
    fetch("http://localhost:3001/statuses")
      .then(r => r.ok && r.json().then(setStatuses))
      .catch(e => console.error("Ошибка загрузки статусов:", e));
    
    fetch("http://localhost:3001/reviews/admin")
      .then(r => r.ok && r.json().then(setReviews))
      .catch(e => console.error("Ошибка загрузки отзывов:", e));
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateStatus = async (id, statusId) => {
    try {
      const res = await fetch(`http://localhost:3001/requests/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_status: statusId })
      });
      
      if (res.ok) {
        setRequests(prev => 
          prev.map(r => r.id === id ? { ...r, id_status: statusId } : r)
        );
      } else {
        alert("Ошибка при обновлении статуса");
      }
    } catch (e) {
      console.error(e);
      alert("Ошибка соединения");
    }
  };

  const getStatusColor = (statusCode) => {
    switch (statusCode) {
      case 'new': return '#fff3cd';
      case 'in_progress': return '#d1ecf1';
      case 'completed': return '#d4edda';
      case 'canceled': return '#f8d7da';
      default: return '#ffffff';
    }
  };

  const getPaymentMethodName = (methodId) => {
    switch (methodId) {
      case 1: return 'Наличными';
      case 2: return 'Переводом по номеру телефона';
      default: return 'Не указан';
    }
  };

  return (
    <div className="container">
      <header className="header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 20,
        padding: '16px 0',
        borderBottom: '2px solid #333'
      }}>
        <h1 style={{ margin: 0 }}>Панель администратора</h1>
        <button 
          onClick={onLogout} 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          Выйти
        </button>
      </header>

      <nav className="tabs" style={{ marginBottom: 24 }}>
        <button 
          onClick={() => setActiveTab("requests")}
          style={{
            padding: '12px 24px',
            marginRight: 12,
            backgroundColor: activeTab === "requests" ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: activeTab === "requests" ? 'bold' : 'normal'
          }}
        >
          Заявки ({requests.length})
        </button>
        <button 
          onClick={() => setActiveTab("reviews")}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === "reviews" ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: activeTab === "reviews" ? 'bold' : 'normal'
          }}
        >
          Отзывы ({reviews.length})
        </button>
      </nav>

      {activeTab === "requests" && (
        <section className="table-section">
          <h2 style={{ marginBottom: 16 }}>Все заявки</h2>
          {requests.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 20, color: '#666' }}>
              Заявок пока нет
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 900 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #333', backgroundColor: '#f8f9fa' }}>
                    <th style={{ border: '1px solid #ccc', padding: 12, textAlign: 'center' }}>№</th>
                    <th style={{ border: '1px solid #ccc', padding: 12 }}>Наименование курса</th>
                    <th style={{ border: '1px solid #ccc', padding: 12 }}>ФИО студента</th>
                    <th style={{ border: '1px solid #ccc', padding: 12 }}>Телефон</th>
                    <th style={{ border: '1px solid #ccc', padding: 12 }}>Способ оплаты</th>
                    <th style={{ border: '1px solid #ccc', padding: 12 }}>Дата начала</th>
                    <th style={{ border: '1px solid #ccc', padding: 12 }}>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ 
                        border: '1px solid #ccc', 
                        padding: 10, 
                        textAlign: 'center',
                        fontWeight: 'bold'
                      }}>
                        {req.id}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: 10 }}>
                        {req.course_name}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: 10 }}>
                        {req.user_full_name}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: 10 }}>
                        {req.user_phone}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: 10 }}>
                        {getPaymentMethodName(req.payment_method)}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: 10 }}>
                        {new Date(req.booking_datetime).toLocaleString('ru-RU')}
                      </td>
                      <td style={{ 
                        border: '1px solid #ccc', 
                        padding: 10,
                        backgroundColor: getStatusColor(req.status_code)
                      }}>
                        <select 
                          value={req.id_status} 
                          onChange={e => updateStatus(req.id, +e.target.value)}
                          style={{ 
                            padding: 8, 
                            minWidth: 180,
                            borderRadius: 4,
                            border: '1px solid #ccc',
                            cursor: 'pointer',
                            fontSize: 14
                          }}
                        >
                          {statuses.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === "reviews" && (
        <section className="reviews-section">
          <h2 style={{ marginBottom: 16 }}>Отзывы студентов</h2>
          {reviews.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 20, color: '#666' }}>
              Отзывов пока нет
            </p>
          ) : (
            <div>
              {reviews.map(review => (
                <div key={review.id} style={{ 
                  border: '1px solid #ddd', 
                  padding: 20, 
                  marginBottom: 16, 
                  borderRadius: 8,
                  backgroundColor: '#f8f9fa'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: 12 
                  }}>
                    <strong style={{ fontSize: 16 }}>{review.user_full_name}</strong>
                    <span style={{ color: '#666', fontSize: 14 }}>
                      {new Date(review.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <div style={{ 
                    marginBottom: 12, 
                    fontSize: 14, 
                    color: '#666',
                    padding: '8px 0',
                    borderTop: '1px solid #ddd',
                    borderBottom: '1px solid #ddd'
                  }}>
                    <strong>Курс:</strong> {review.course_name}
                  </div>
                  <div style={{ marginBottom: 12, fontSize: 20 }}>
                    {'⭐'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    <span style={{ fontSize: 14, marginLeft: 10, color: '#666' }}>
                      ({review.rating}/5)
                    </span>
                  </div>
                  <div style={{ 
                    padding: 16, 
                    backgroundColor: 'white', 
                    borderRadius: 6,
                    borderLeft: '4px solid #007bff',
                    lineHeight: 1.6
                  }}>
                    {review.comment}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Admin;