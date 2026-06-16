import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const [formData, setFormData] = useState({
    login: "",
    password: "",
    full_name: "",
    phone: "",
    email: "",
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const newErrors = {};

    if (!/^[a-zA-Z0-9]{6,}$/.test(formData.login)) {
      newErrors.login = "Логин должен содержать не менее 6 символов (латиница и цифры)";
    }

    if (formData.password.length < 8) {
      newErrors.password = "Пароль должен содержать минимум 8 символов";
    }

    if (!/^[а-яА-ЯёЁ\s]+$/.test(formData.full_name)) {
      newErrors.full_name = "ФИО должно содержать только символы кириллицы и пробелы";
    }

    if (!/^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(formData.phone)) {
      newErrors.phone = "Телефон должен быть в формате: 8(XXX)XXX-XX-XX";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Введите корректный адрес электронной почты";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const response = await fetch("http://localhost:3001/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error();

      alert("Вы зарегистрированы");
      navigate("/login");
    } catch {
      alert("Ошибка регистрации. Проверьте данные");
    }
  };

  return (
    <div className="conteiner">
      <h2>Регистрация</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            name="login"
            placeholder="Введите логин"
            value={formData.login}
            onChange={handleChange}
            required
          />
          {errors.login && <span className="error">{errors.login}</span>}
        </div>

        <div>
          <input
            type="password"
            name="password"
            placeholder="Введите пароль"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {errors.password && <span className="error">{errors.password}</span>}
        </div>

        <div>
          <input
            name="full_name"
            placeholder="Введите ФИО"
            value={formData.full_name}
            onChange={handleChange}
            required
          />
          {errors.full_name && <span className="error">{errors.full_name}</span>}
        </div>

        <div>
          <input
            name="phone"
            placeholder="8(XXX)XXX-XX-XX"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          {errors.phone && <span className="error">{errors.phone}</span>}
        </div>

        <div>
          <input
            type="email"
            name="email"
            placeholder="Введите email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>

        <button type="submit" className="button-form">
          Создать пользователя
        </button>
      </form>
      <Link to="/login">
        <button>Войти</button>
      </Link>
    </div>
  );
}