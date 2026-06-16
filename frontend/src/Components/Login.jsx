import { useState } from "react";
import { Link } from "react-router-dom";

export default function Login({ onLogin }) {
  const [formData, setFormData] = useState({ login: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    setErrors({ ...errors, [e.target.name]: "" });
    setServerError("");
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.login) {
      newErrors.login = "Введите логин";
    } else if (!/^[a-zA-Z0-9]{6,}$/.test(formData.login)) {
      newErrors.login = "Логин должен содержать не менее 6 символов (латиница и цифры)";
    }

    if (!formData.password) {
      newErrors.password = "Введите пароль";
    } else if (formData.password.length < 8) {
      newErrors.password = "Пароль должен содержать минимум 8 символов";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    try {
      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data?.id) {
        alert("Вы успешно вошли!");
        onLogin?.(data);
      } else {
        setServerError("Неверный логин или пароль. Попробуйте снова.");
      }
    } catch {
      setServerError("Ошибка соединения с сервером. Проверьте подключение.");
    }
  };

  return (
    <div className="conteiner">
      <h2>Авторизация</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            name="login"
            placeholder="Введите логин"
            value={formData.login}
            onChange={handleChange}
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
          />
          {errors.password && <span className="error">{errors.password}</span>}
        </div>

        {serverError && <div className="server-error">{serverError}</div>}

        <button type="submit" className="button-form">
          Войти
        </button>
      </form>

      <div className="switch-form">
        <span>Еще не зарегистрированы? </span>
        <Link to="/register">Регистрация</Link>
      </div>
    </div>
  );
}