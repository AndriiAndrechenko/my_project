import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Workout() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({
    name: '', duration: '', calories_burned: '', date: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const headers = { Authorization: `Bearer ${user.token}` };

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/workout/${today}`, { headers });
      setLogs(res.data);
    } catch (err) { console.error(err); }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/workout', { ...form, date: form.date || today }, { headers });
      setMessage('✅ Тренування додано!');
      setForm({ name: '', duration: '', calories_burned: '', date: '' });
      fetchLogs();
      setTimeout(() => setMessage(''), 3000);
    } catch { setMessage('❌ Помилка додавання'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/workout/${id}`, { headers });
      fetchLogs();
    } catch (err) { console.error(err); }
  };

  const totalDuration = logs.reduce((sum, w) => sum + w.duration, 0);
  const totalBurned = logs.reduce((sum, w) => sum + w.calories_burned, 0);

  return (
    <div className="main-content">
      <h1 className="page-title">🏋️ Тренування</h1>

      {/* Форма */}
      <div className="card">
        <h2 style={{color:'#fff', fontWeight:'700', marginBottom:'20px'}}>Додати тренування</h2>
        {message && <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Назва тренування</label>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                className="form-input" placeholder="Біг, Силове тренування..." required />
            </div>
            <div className="form-group">
              <label className="form-label">Тривалість (хв)</label>
              <input type="number" name="duration" value={form.duration} onChange={handleChange}
                className="form-input" placeholder="45" required />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Спалено калорій (ккал)</label>
              <input type="number" name="calories_burned" value={form.calories_burned} onChange={handleChange}
                className="form-input" placeholder="300" />
            </div>
            <div className="form-group">
              <label className="form-label">Дата</label>
              <input type="date" name="date" value={form.date} onChange={handleChange}
                className="form-input" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-orange">
            {loading ? 'Додавання...' : '+ Додати'}
          </button>
        </form>
      </div>

      {/* Підсумок */}
      {logs.length > 0 && (
        <div className="card">
          <h2 style={{color:'#fff', fontWeight:'700', marginBottom:'16px'}}>📊 Сьогодні</h2>
          <div className="grid-2" style={{marginBottom:'20px'}}>
            <div className="prediction-card">
              <p className="prediction-label">Загальна тривалість</p>
              <p className="prediction-value text-orange">{totalDuration} хв</p>
            </div>
            <div className="prediction-card">
              <p className="prediction-label">Спалено калорій</p>
              <p className="prediction-value text-red">{totalBurned} ккал</p>
            </div>
          </div>

          {logs.map(log => (
            <div key={log.id} className="log-item">
              <div>
                <p className="log-name">{log.name}</p>
                <p className="log-sub">{log.duration} хвилин</p>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                <span className="log-value text-orange">{log.calories_burned} ккал</span>
                <button onClick={() => handleDelete(log.id)} className="btn-delete">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Workout;