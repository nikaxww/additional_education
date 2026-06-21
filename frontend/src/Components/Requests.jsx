import React, { useState, useEffect } from 'react';

const Requests = ({ user, onLogout }) => {
  const [requests, setRequests] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ 
    course_name: '', 
    booking_date: '', 
    booking_time: '',
    payment_method: '' 
  });
  const [reviewForm, setReviewForm] = useState({ id_request: '', rating: 5, comment: '' });

  useEffect(() => {
    loadRequests();
    loadReviews();
  }, [user.id]);

  const loadRequests = () => {
    fetch(`http://localhost:3001/requests/user/${user.id}`)
      .then(r => r.ok && r.json().then(setRequests))
      .catch(e => console.error(e));
  };

  const loadReviews = () => {
    fetch(`http://localhost:3001/reviews/user/${user.id}`)
      .then(r => r.ok && r.json().then(setReviews))
      .catch(e => console.error(e));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { course_name, booking_date, booking_time, payment_method } = form;
    
    if (!course_name.trim() || !booking_date || !booking_time || !payment_method) {
      return alert('Заполните все поля');
    }

    try {
      const res = await fetch('http://localhost:3001/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id_user: user.id, 
          course_name: course_name.trim(),
          payment_method: parseInt(payment_method),
          booking_datetime: `${booking_date}T${booking_time}:00` 
        })
      });
      
      if (res.ok) {
        setForm({ course_name: '', booking_date: '', booking_time: '', payment_method: '' });
        loadRequests();
        alert('Заявка успешно отправлена на рассмотрение!');
      } else {
        alert('Ошибка при создании заявки');
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка соединения');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const { id_request, rating, comment } = reviewForm;
    
    if (!id_request || !comment.trim()) {
      return alert('Выберите заявку и введите текст отзыва');
    }

    try {
      const res = await fetch('http://localhost:3001/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id_request, 
          id_user: user.id, 
          rating: parseInt(rating), 
          comment 
        })
      });
      
      if (res.ok) {
        setReviewForm({ id_request: '', rating: 5, comment: '' });
        loadReviews();
        alert('Отзыв успешно добавлен!');
      } else {
        const data = await res.json();
        alert(data.error || 'Ошибка при добавлении отзыва');
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка соединения');
    }
  };

  const timeSlots = Array.from({ length: 11 }, (_, i) => 
    `${String(8 + i).padStart(2, '0')}:00`
  );
  const today = new Date().toISOString().split('T')[0];

  const availableRequestsForReview = requests.filter(r => 
    (r.status_name === 'Подтверждено' || r.status_name === 'Обучение завершено') && 
    !reviews.find(rev => rev.id_request === r.id)
  );

  return (
    <div className="container">
      <header className="header">
        <h1>Мои заявки</h1>
        <button onClick={onLogout}>Выйти</button>
      </header>

      <section className="form-section">
        <h2>Новая заявка на обучение</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
              Наименование курса:
            </label>
            <input 
              type="text"
              name="course_name"
              placeholder="Введите название курса"
              value={form.course_name} 
              onChange={e => setForm({ ...form, course_name: e.target.value })} 
              required
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
              Желаемая дата начала обучения:
            </label>
            <input 
              type="date" 
              name="booking_date" 
              value={form.booking_date} 
              onChange={e => setForm({ ...form, booking_date: e.target.value })} 
              min={today} 
              required 
              style={{ width: '100%', padding: 8 }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
              Желаемое время начала:
            </label>
            <select 
              name="booking_time" 
              value={form.booking_time} 
              onChange={e => setForm({ ...form, booking_time: e.target.value })} 
              required
              style={{ width: '100%', padding: 8 }}
            >
              <option value="">Выберите время</option>
              {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
              Способ оплаты:
            </label>
            <select 
              name="payment_method" 
              value={form.payment_method} 
              onChange={e => setForm({ ...form, payment_method: e.target.value })} 
              required
              style={{ width: '100%', padding: 8 }}
            >
              <option value="">Выберите способ оплаты</option>
              <option value="1">Наличными</option>
              <option value="2">Переводом по номеру телефона</option>
            </select>
          </div>
          
          <button type="submit" style={{ 
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}>
            Отправить
          </button>
        </form>
      </section>

      <section className="table-section">
        <h2>Список заявок</h2>
        {requests.length === 0 ? (
          <p>Заявок пока нет</p>
        ) : (
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ border: '1px solid #ccc', padding: 8 }}>Курс</th>
                <th style={{ border: '1px solid #ccc', padding: 8 }}>Дата и время</th>
                <th style={{ border: '1px solid #ccc', padding: 8 }}>Способ оплаты</th>
                <th style={{ border: '1px solid #ccc', padding: 8 }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ border: '1px solid #ccc', padding: 8 }}>{r.course_name}</td>
                  <td style={{ border: '1px solid #ccc', padding: 8 }}>
                    {new Date(r.booking_datetime).toLocaleString('ru-RU')}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: 8 }}>
                    {r.payment_method === 1 ? 'Наличными' : 'Переводом по номеру телефона'}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: 8 }}>{r.status_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="review-form-section">
        <h2>Оставить отзыв</h2>
        {availableRequestsForReview.length === 0 ? (
          <p>Нет доступных заявок для отзыва. Оставьте отзыв после подтверждения или завершения обучения.</p>
        ) : (
          <form onSubmit={handleReviewSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                Выберите заявку для отзыва:
              </label>
              <select 
                value={reviewForm.id_request} 
                onChange={e => setReviewForm({ ...reviewForm, id_request: e.target.value })} 
                required
                style={{ width: '100%', padding: 8 }}
              >
                <option value="">Выберите заявку</option>
                {availableRequestsForReview.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.course_name} - {new Date(r.booking_datetime).toLocaleDateString('ru-RU')}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                Оценка:
              </label>
              <select 
                value={reviewForm.rating} 
                onChange={e => setReviewForm({ ...reviewForm, rating: e.target.value })}
                style={{ width: '100%', padding: 8 }}
              >
                <option value="5">5 - Отлично</option>
                <option value="4">4 - Хорошо</option>
                <option value="3">3 - Удовлетворительно</option>
                <option value="2">2 - Плохо</option>
                <option value="1">1 - Очень плохо</option>
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                Ваш отзыв:
              </label>
              <textarea 
                placeholder="Ваш отзыв о качестве образовательных услуг..."
                value={reviewForm.comment}
                onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                rows="4"
                required
                style={{ width: '100%', padding: 8 }}
              />
            </div>

            <button type="submit" style={{ 
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}>
              Отправить отзыв
            </button>
          </form>
        )}
      </section>

      <section className="reviews-section">
        <h2>Мои отзывы</h2>
        {reviews.length === 0 ? (
          <p>Вы ещё не оставляли отзывов</p>
        ) : (
          <div>
            {reviews.map(review => (
              <div key={review.id} style={{ 
                border: '1px solid #ddd', 
                padding: 12, 
                marginBottom: 12, 
                borderRadius: 4 
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                  {review.course_name} - {new Date(review.created_at).toLocaleDateString('ru-RU')}
                </div>
                <div style={{ marginBottom: 8 }}>
                  {'⭐'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
                <div>{review.comment}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Requests;