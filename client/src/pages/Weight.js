import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
 
function MonthCalendar({ logs, onSelectDate, selectedDate }) {
  const today = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000);
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
 
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
 
  const monthNames = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
  const dayNames = ['Пн','Вт','Ср','Чт','Пт','Сб','Нд'];
 
  const weightByDate = {};
  logs.forEach(log => { weightByDate[log.date] = log.weight; });
 
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
 
  const cells = [];
  for (let i = 0; i < adjustedFirstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);
 
  return (
    <div style={{background:'#1e293b', borderRadius:'16px', padding:'20px', marginBottom:'16px', border:'1px solid #334155'}}>
      {/* Заголовок */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
        <button onClick={prevMonth} style={{background:'#334155', border:'none', color:'#fff', borderRadius:'8px', padding:'6px 12px', cursor:'pointer', fontSize:'1rem'}}>←</button>
        <h3 style={{color:'#fff', fontWeight:'700'}}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
        <button onClick={nextMonth} style={{background:'#334155', border:'none', color:'#fff', borderRadius:'8px', padding:'6px 12px', cursor:'pointer', fontSize:'1rem'}}>→</button>
      </div>
 
      {/* Дні тижня */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px', marginBottom:'8px'}}>
        {dayNames.map(d => (
          <div key={d} style={{textAlign:'center', color:'#64748b', fontSize:'0.75rem', padding:'4px'}}>{d}</div>
        ))}
      </div>
 
      {/* Дні місяця */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px'}}>
        {cells.map((day, i) => {
          if (!day) return <div key={i}></div>;
 
          const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const todayStr = today.toISOString().split('T')[0];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const hasWeight = weightByDate[dateStr];
 
          return (
            <div key={i} onClick={() => onSelectDate(dateStr)}
              style={{
                textAlign:'center', padding:'6px 2px', borderRadius:'8px', cursor:'pointer',
                background: isSelected ? '#2563eb' : isToday ? '#1e3a5f' : 'transparent',
                border: isToday && !isSelected ? '1px solid #2563eb' : '1px solid transparent',
                transition:'all 0.2s',
                position:'relative'
              }}>
              <p style={{color: isSelected ? '#fff' : isToday ? '#38bdf8' : '#94a3b8', fontSize:'0.875rem', fontWeight: isSelected || isToday ? '700' : '400'}}>
                {day}
              </p>
              {hasWeight && (
                <p style={{color: isSelected ? '#bfdbfe' : '#38bdf8', fontSize:'0.65rem', marginTop:'1px'}}>
                  {hasWeight}кг
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
 
function Weight() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [form, setForm] = useState({ weight: '', date: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
 
  const today = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const headers = { Authorization: `Bearer ${user.token}` };
 
  useEffect(() => { fetchLogs(); }, []);
 
  const fetchLogs = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/weight', { headers });
      setLogs(res.data);
      if (res.data.length >= 2) {
        const predRes = await axios.get('http://localhost:5000/api/weight/predict', { headers });
        setPrediction(predRes.data);
      }
    } catch (err) { console.error(err); }
  };
 
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/weight', {
        weight: form.weight,
        date: form.date || selectedDate || today
      }, { headers });
      setMessage('✅ Вагу записано!');
      setForm({ weight: '', date: '' });
      fetchLogs();
      setTimeout(() => setMessage(''), 3000);
    } catch { setMessage('❌ Помилка збереження'); }
    finally { setLoading(false); }
  };
 
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/weight/${id}`, { headers });
      fetchLogs();
    } catch (err) { console.error(err); }
  };
 
  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setForm({ weight: '', date });
  };
 
  const selectedLog = selectedDate ? logs.find(l => l.date === selectedDate) : null;
 
  const tooltipStyle = {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#e2e8f0'
  };
 
  return (
    <div className="main-content">
      <h1 className="page-title">⚖️ Моніторинг ваги</h1>
 
      {/* Календар */}
      <MonthCalendar logs={logs} onSelectDate={handleSelectDate} selectedDate={selectedDate} />
 
      {/* Інфо про вибраний день */}
      {selectedDate && (
        <div className="card" style={{marginBottom:'16px'}}>
          <h2 style={{color:'#fff', fontWeight:'700', marginBottom:'16px'}}>
            📅 {selectedDate}
          </h2>
          {selectedLog ? (
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <p style={{color:'#64748b', fontSize:'0.875rem'}}>Записана вага</p>
                <p style={{color:'#38bdf8', fontSize:'2rem', fontWeight:'700'}}>{selectedLog.weight} кг</p>
              </div>
              <button onClick={() => handleDelete(selectedLog.id)} style={{background:'#450a0a', border:'1px solid #dc2626', color:'#f87171', borderRadius:'8px', padding:'8px 16px', cursor:'pointer'}}>
                Видалити
              </button>
            </div>
          ) : (
            <div>
              <p style={{color:'#64748b', marginBottom:'12px'}}>Вага за цей день не записана</p>
              <form onSubmit={handleSubmit} style={{display:'flex', gap:'12px'}}>
                <input type="number" step="0.1" name="weight" value={form.weight} onChange={handleChange}
                  className="form-input" placeholder="70.5" required style={{flex:1}} />
                <button type="submit" disabled={loading} className="btn btn-purple" style={{width:'auto', padding:'10px 20px'}}>
                  {loading ? '...' : '+ Записати'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
 
      {/* Форма якщо день не вибраний */}
      {!selectedDate && (
        <div className="card">
          <h2 style={{color:'#fff', fontWeight:'700', marginBottom:'20px'}}>Записати вагу</h2>
          {message && <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>{message}</div>}
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Вага (кг)</label>
                <input type="number" step="0.1" name="weight" value={form.weight} onChange={handleChange}
                  className="form-input" placeholder="70.5" required />
              </div>
              <div className="form-group">
                <label className="form-label">Дата</label>
                <input type="date" name="date" value={form.date} onChange={handleChange}
                  className="form-input" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn btn-purple">
              {loading ? 'Збереження...' : '+ Зберегти'}
            </button>
          </form>
        </div>
      )}
 
      {message && selectedDate && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>{message}</div>
      )}
 
      {/* Графік */}
      {logs.length > 0 && (
        <div className="card">
          <h2 style={{color:'#fff', fontWeight:'700', marginBottom:'16px'}}>📈 Графік ваги</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={logs}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#64748b" tick={{fontSize:11}} />
              <YAxis stroke="#64748b" domain={['auto','auto']} tick={{fontSize:11}} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="weight" stroke="#38bdf8" strokeWidth={2} dot={{r:5, fill:'#38bdf8'}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
 
      {/* Прогноз */}
      {prediction && (
        <div className="card">
          <h2 style={{color:'#fff', fontWeight:'700', marginBottom:'8px'}}>🔮 Прогноз ваги</h2>
          <p style={{color:'#64748b', fontSize:'0.8rem', marginBottom:'16px'}}>
            На основі харчування, тренувань та базового метаболізму
          </p>
 
          <div style={{background:'#0f172a', borderRadius:'12px', padding:'16px', marginBottom:'16px', border:'1px solid #334155'}}>
            <p style={{color:'#94a3b8', fontSize:'0.875rem', marginBottom:'12px', fontWeight:'600'}}>📊 Деталі розрахунку:</p>
            <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'8px'}}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span style={{color:'#64748b', fontSize:'0.8rem'}}>BMR:</span>
                <span style={{color:'#e2e8f0', fontSize:'0.8rem', fontWeight:'600'}}>{prediction.bmr} ккал</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span style={{color:'#64748b', fontSize:'0.8rem'}}>Витрати/день:</span>
                <span style={{color:'#e2e8f0', fontSize:'0.8rem', fontWeight:'600'}}>{prediction.dailyExpenditure} ккал</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span style={{color:'#64748b', fontSize:'0.8rem'}}>Середнє споживання:</span>
                <span style={{color:'#4ade80', fontSize:'0.8rem', fontWeight:'600'}}>{prediction.avgCalories} ккал</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span style={{color:'#64748b', fontSize:'0.8rem'}}>Добовий баланс:</span>
                <span style={{color: prediction.dailyBalance > 0 ? '#f87171' : '#4ade80', fontSize:'0.8rem', fontWeight:'600'}}>
                  {prediction.dailyBalance > 0 ? '+' : ''}{prediction.dailyBalance} ккал
                </span>
              </div>
            </div>
          </div>
 
          <p style={{color:'#64748b', fontSize:'0.875rem', marginBottom:'16px'}}>
            Поточна вага: <span style={{color:'#fff', fontWeight:'600'}}>{prediction.current} кг</span>
            {' · '}Тенденція: <span style={{color: prediction.trend === 'зростання' ? '#f87171' : prediction.trend === 'зниження' ? '#4ade80' : '#94a3b8', fontWeight:'600'}}>{prediction.trend}</span>
          </p>
 
          <div className="prediction-grid">
            <div className="prediction-card">
              <p className="prediction-label">Через 7 днів</p>
              <p className="prediction-value">{prediction.predictions.days7} кг</p>
              <p style={{color: prediction.predictions.days7 > prediction.current ? '#f87171' : '#4ade80', fontSize:'0.75rem', marginTop:'4px'}}>
                {prediction.predictions.days7 > prediction.current ? '+' : ''}{(prediction.predictions.days7 - prediction.current).toFixed(1)} кг
              </p>
            </div>
            <div className="prediction-card">
              <p className="prediction-label">Через 14 днів</p>
              <p className="prediction-value">{prediction.predictions.days14} кг</p>
              <p style={{color: prediction.predictions.days14 > prediction.current ? '#f87171' : '#4ade80', fontSize:'0.75rem', marginTop:'4px'}}>
                {prediction.predictions.days14 > prediction.current ? '+' : ''}{(prediction.predictions.days14 - prediction.current).toFixed(1)} кг
              </p>
            </div>
            <div className="prediction-card">
              <p className="prediction-label">Через 30 днів</p>
              <p className="prediction-value">{prediction.predictions.days30} кг</p>
              <p style={{color: prediction.predictions.days30 > prediction.current ? '#f87171' : '#4ade80', fontSize:'0.75rem', marginTop:'4px'}}>
                {prediction.predictions.days30 > prediction.current ? '+' : ''}{(prediction.predictions.days30 - prediction.current).toFixed(1)} кг
              </p>
            </div>
          </div>
 
          <div style={{background:'#0f172a', borderRadius:'12px', padding:'16px', marginTop:'16px', border:'1px solid #334155'}}>
            <p style={{color:'#94a3b8', fontSize:'0.875rem'}}>
              💡 <strong style={{color:'#e2e8f0'}}>Порада:</strong>{' '}
              {prediction.dailyBalance > 0
                ? `Ти споживаєш на ${prediction.dailyBalance} ккал більше ніж витрачаєш. Щоб зупинити зростання ваги — зменш калорії або збільш тренування.`
                : prediction.dailyBalance < 0
                ? `Ти маєш дефіцит ${Math.abs(prediction.dailyBalance)} ккал на день. Це призведе до поступового зниження ваги.`
                : 'Твій енергетичний баланс стабільний. Вага має залишатись незмінною.'
              }
            </p>
          </div>
 
          {/* Блок рекомендацій (продукційні правила) */}
          {(() => {
            const delta = prediction.predictions.days7 - prediction.current;
            const balance = prediction.dailyBalance;
            const goalCal = 2000;
 
            let recommendations = [];
 
            // Правило 1: вага зростає + профіцит калорій
            if (delta > 0.3 && balance > 300) {
              recommendations.push({
                icon: '🍽️',
                title: 'Зменшити калорійність',
                text: `Прогнозується набір ${delta.toFixed(1)} кг за тиждень. Рекомендується зменшити добове споживання калорій на 200–300 ккал.`,
                color: '#f87171',
                bg: '#450a0a',
                border: '#dc2626'
              });
            }
 
            // Правило 2: вага зростає + калорії в нормі
            if (delta > 0.3 && balance >= 0 && balance <= 300) {
              recommendations.push({
                icon: '🏃',
                title: 'Збільшити фізичну активність',
                text: `Вага зростає попри нормальне харчування. Рекомендується збільшити фізичну активність на 10–15% або додати 1 тренування на тиждень.`,
                color: '#fb923c',
                bg: '#431407',
                border: '#ea580c'
              });
            }
 
            // Правило 3: вага стабільна
            if (Math.abs(delta) <= 0.1) {
              recommendations.push({
                icon: '✅',
                title: 'Підтримувати поточний режим',
                text: `Вага стабільна. Поточний баланс харчування та тренувань є оптимальним — продовжуйте в тому ж режимі.`,
                color: '#4ade80',
                bg: '#052e16',
                border: '#16a34a'
              });
            }
 
            // Правило 4: вага знижується + дефіцит калорій
            if (delta < -0.3 && balance < -300) {
              recommendations.push({
                icon: '🥗',
                title: 'Збільшити калорійність',
                text: `Виявлено значний дефіцит калорій (${Math.abs(balance)} ккал/день). Рекомендується збільшити добову калорійність на 100–200 ккал для збереження м'язової маси.`,
                color: '#38bdf8',
                bg: '#0c1a2e',
                border: '#0284c7'
              });
            }
 
            // Якщо жодне правило не спрацювало — загальна порада
            if (recommendations.length === 0) {
              recommendations.push({
                icon: '📊',
                title: 'Продовжуйте моніторинг',
                text: `Даних поки недостатньо для точної рекомендації. Продовжуйте фіксувати вагу, харчування та тренування щодня.`,
                color: '#94a3b8',
                bg: '#0f172a',
                border: '#334155'
              });
            }
 
            return (
              <div style={{marginTop:'16px'}}>
                <h3 style={{color:'#fff', fontWeight:'700', marginBottom:'12px', fontSize:'1rem'}}>
                  🤖 Рекомендації системи
                </h3>
                <p style={{color:'#64748b', fontSize:'0.75rem', marginBottom:'12px'}}>
                  Сформовано на основі продукційних правил (delta_weight = {delta.toFixed(2)} кг, баланс = {balance} ккал/день)
                </p>
                {recommendations.map((rec, i) => (
                  <div key={i} style={{
                    background: rec.bg,
                    border: `1px solid ${rec.border}`,
                    borderRadius:'12px',
                    padding:'16px',
                    marginBottom:'10px'
                  }}>
                    <p style={{color: rec.color, fontWeight:'700', fontSize:'0.9rem', marginBottom:'6px'}}>
                      {rec.icon} {rec.title}
                    </p>
                    <p style={{color:'#94a3b8', fontSize:'0.85rem', lineHeight:'1.5'}}>
                      {rec.text}
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
 
      {/* Історія */}
      {logs.length > 0 && (
        <div className="card">
          <h2 style={{color:'#fff', fontWeight:'700', marginBottom:'16px'}}>📋 Історія</h2>
          {[...logs].reverse().map(log => (
            <div key={log.id} className="log-item">
              <p style={{color:'#94a3b8'}}>{log.date}</p>
              <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                <span className="log-value text-blue">{log.weight} кг</span>
                <button onClick={() => handleDelete(log.id)} className="btn-delete">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
 
export default Weight;