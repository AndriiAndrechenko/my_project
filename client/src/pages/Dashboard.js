import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Компонент прогрес-бару
function ProgressBar({ value, max, color }) {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <div style={{background:'#0f172a', borderRadius:'9999px', height:'8px', marginTop:'6px'}}>
      <div style={{width:`${percent}%`, height:'8px', borderRadius:'9999px', background:color, transition:'width 0.3s'}}></div>
    </div>
  );
}

// Компонент календаря
function WeekCalendar({ selectedDate, onSelectDate }) {
  const days = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const today = new Date();

  const week = Array.from({length: 7}, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i);
    return d;
  });

  return (
    <div style={{background:'#1e293b', borderRadius:'16px', padding:'20px', marginBottom:'16px', border:'1px solid #334155'}}>
      <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'8px', textAlign:'center'}}>
        {week.map((d, i) => {
          const dateStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today.toISOString().split('T')[0];
          return (
            <div key={i} onClick={() => onSelectDate(dateStr)}
              style={{
                cursor:'pointer',
                borderRadius:'12px',
                padding:'10px 4px',
                background: isSelected ? '#2563eb' : isToday ? '#1e3a5f' : 'transparent',
                border: isToday && !isSelected ? '1px solid #2563eb' : '1px solid transparent',
                transition:'all 0.2s'
              }}>
              <p style={{color:'#64748b', fontSize:'0.75rem', marginBottom:'6px'}}>{days[d.getDay()]}</p>
              <p style={{color: isSelected ? '#fff' : isToday ? '#38bdf8' : '#94a3b8', fontWeight: isSelected || isToday ? '700' : '400', fontSize:'1.1rem'}}>
                {d.getDate()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Модальне вікно додавання їжі
function AddFoodModal({ onClose, onAdd, headers }) {
  const [tab, setTab] = useState('manual');
  const [form, setForm] = useState({ name: '', calories: '', protein: '', fat: '', carbs: '' });
  const [favorites, setFavorites] = useState([]);
  const [saveToFav, setSaveToFav] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/favorites', { headers });
        setFavorites(res.data.filter(f => f.type === 'food'));
      } catch (err) { console.error(err); }
    };
    fetchFavorites();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saveToFav) {
      try {
        await axios.post('http://localhost:5000/api/favorites', { ...form, type: 'food' }, { headers });
      } catch {}
    }
    onAdd(form);
  };

  const handleAddFromFav = (fav) => {
    onAdd({ name: fav.name, calories: fav.calories, protein: fav.protein, fat: fav.fat, carbs: fav.carbs });
  };

  const handleDeleteFav = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/favorites/${id}`, { headers });
      setFavorites(favorites.filter(f => f.id !== id));
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
      <div style={{background:'#1e293b', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'480px', border:'1px solid #334155', maxHeight:'90vh', overflowY:'auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
          <h2 style={{color:'#fff', fontWeight:'700'}}>🍎 Додати їжу</h2>
          <button onClick={onClose} style={{background:'none', border:'none', color:'#64748b', fontSize:'1.5rem', cursor:'pointer'}}>✕</button>
        </div>

        {/* Вкладки */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'20px'}}>
          <button onClick={() => setTab('manual')}
            style={{padding:'8px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:'600', fontSize:'0.875rem',
              background: tab === 'manual' ? '#2563eb' : '#0f172a', color: tab === 'manual' ? '#fff' : '#64748b'}}>
            ✏️ Вручну
          </button>
          <button onClick={() => setTab('favorites')}
            style={{padding:'8px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:'600', fontSize:'0.875rem',
              background: tab === 'favorites' ? '#2563eb' : '#0f172a', color: tab === 'favorites' ? '#fff' : '#64748b'}}>
            ⭐ Улюблене ({favorites.length})
          </button>
        </div>

        {/* Вручну */}
        {tab === 'manual' && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Назва продукту</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="form-input" placeholder="Гречка з куркою" required />
            </div>
            <div className="form-group">
              <label className="form-label">Калорії (ккал)</label>
              <input type="number" value={form.calories} onChange={e => setForm({...form, calories: e.target.value})}
                className="form-input" placeholder="350" required />
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px'}}>
              <div className="form-group">
                <label className="form-label">Білки (г)</label>
                <input type="number" value={form.protein} onChange={e => setForm({...form, protein: e.target.value})}
                  className="form-input" placeholder="30" />
              </div>
              <div className="form-group">
                <label className="form-label">Жири (г)</label>
                <input type="number" value={form.fat} onChange={e => setForm({...form, fat: e.target.value})}
                  className="form-input" placeholder="10" />
              </div>
              <div className="form-group">
                <label className="form-label">Вуглеводи (г)</label>
                <input type="number" value={form.carbs} onChange={e => setForm({...form, carbs: e.target.value})}
                  className="form-input" placeholder="40" />
              </div>
            </div>

            {/* Зберегти в улюблене */}
            <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px', cursor:'pointer'}}
              onClick={() => setSaveToFav(!saveToFav)}>
              <div style={{width:'20px', height:'20px', borderRadius:'4px', border:'2px solid #334155',
                background: saveToFav ? '#2563eb' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center'}}>
                {saveToFav && <span style={{color:'#fff', fontSize:'0.75rem'}}>✓</span>}
              </div>
              <span style={{color:'#94a3b8', fontSize:'0.875rem'}}>⭐ Зберегти в улюблене</span>
            </div>

            <button type="submit" className="btn btn-green">Додати</button>
          </form>
        )}

        {/* Улюблене */}
        {tab === 'favorites' && (
          <div>
            {favorites.length === 0 ? (
              <p style={{color:'#475569', textAlign:'center', padding:'20px 0'}}>
                Ще немає улюблених продуктів.
                Додайте їжу вручну і відмітьте "Зберегти в улюблене"
              </p>
            ) : (
              favorites.map(fav => (
                <div key={fav.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'#0f172a', borderRadius:'8px', padding:'12px', marginBottom:'8px'}}>
                  <div style={{flex:1, cursor:'pointer'}} onClick={() => handleAddFromFav(fav)}>
                    <p style={{color:'#e2e8f0', fontWeight:'600'}}>{fav.name}</p>
                    <p style={{color:'#64748b', fontSize:'0.75rem'}}>
                      {fav.calories} ккал · Б:{fav.protein}г · Ж:{fav.fat}г · В:{fav.carbs}г
                    </p>
                  </div>
                  <div style={{display:'flex', gap:'8px'}}>
                    <button onClick={() => handleAddFromFav(fav)}
                      style={{background:'#052e16', border:'1px solid #16a34a', color:'#4ade80', borderRadius:'6px', padding:'4px 10px', cursor:'pointer', fontSize:'0.75rem'}}>
                      + Додати
                    </button>
                    <button onClick={() => handleDeleteFav(fav.id)}
                      style={{background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:'1rem'}}>
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Модальне вікно додавання тренування
function AddWorkoutModal({ onClose, onAdd, headers }) {
  const [tab, setTab] = useState('manual');
  const [form, setForm] = useState({ name: '', duration: '', calories_burned: '' });
  const [favorites, setFavorites] = useState([]);
  const [saveToFav, setSaveToFav] = useState(false);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/favorites', { headers });
        setFavorites(res.data.filter(f => f.type === 'workout'));
      } catch (err) { console.error(err); }
    };
    fetchFavorites();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saveToFav) {
      try {
        await axios.post('http://localhost:5000/api/favorites', {
          ...form, type: 'workout', calories: form.calories_burned
        }, { headers });
      } catch {}
    }
    onAdd(form);
  };

  const handleAddFromFav = (fav) => {
    onAdd({ name: fav.name, duration: fav.duration, calories_burned: fav.calories });
  };

  const handleDeleteFav = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/favorites/${id}`, { headers });
      setFavorites(favorites.filter(f => f.id !== id));
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
      <div style={{background:'#1e293b', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'480px', border:'1px solid #334155', maxHeight:'90vh', overflowY:'auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
          <h2 style={{color:'#fff', fontWeight:'700'}}>🏋️ Додати тренування</h2>
          <button onClick={onClose} style={{background:'none', border:'none', color:'#64748b', fontSize:'1.5rem', cursor:'pointer'}}>✕</button>
        </div>

        {/* Вкладки */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'20px'}}>
          <button onClick={() => setTab('manual')}
            style={{padding:'8px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:'600', fontSize:'0.875rem',
              background: tab === 'manual' ? '#ea580c' : '#0f172a', color: tab === 'manual' ? '#fff' : '#64748b'}}>
            ✏️ Вручну
          </button>
          <button onClick={() => setTab('favorites')}
            style={{padding:'8px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:'600', fontSize:'0.875rem',
              background: tab === 'favorites' ? '#ea580c' : '#0f172a', color: tab === 'favorites' ? '#fff' : '#64748b'}}>
            ⭐ Улюблене ({favorites.length})
          </button>
        </div>

        {/* Вручну */}
        {tab === 'manual' && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Назва тренування</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="form-input" placeholder="Біг, Силове тренування..." required />
            </div>
            <div className="form-group">
              <label className="form-label">Тривалість (хв)</label>
              <input type="number" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})}
                className="form-input" placeholder="45" required />
            </div>
            <div className="form-group">
              <label className="form-label">Спалено калорій (ккал)</label>
              <input type="number" value={form.calories_burned} onChange={e => setForm({...form, calories_burned: e.target.value})}
                className="form-input" placeholder="300" />
            </div>

            {/* Зберегти в улюблене */}
            <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px', cursor:'pointer'}}
              onClick={() => setSaveToFav(!saveToFav)}>
              <div style={{width:'20px', height:'20px', borderRadius:'4px', border:'2px solid #334155',
                background: saveToFav ? '#ea580c' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center'}}>
                {saveToFav && <span style={{color:'#fff', fontSize:'0.75rem'}}>✓</span>}
              </div>
              <span style={{color:'#94a3b8', fontSize:'0.875rem'}}>⭐ Зберегти в улюблене</span>
            </div>

            <button type="submit" className="btn btn-orange">Додати</button>
          </form>
        )}

        {/* Улюблене */}
        {tab === 'favorites' && (
          <div>
            {favorites.length === 0 ? (
              <p style={{color:'#475569', textAlign:'center', padding:'20px 0'}}>
                Ще немає улюблених тренувань.
                Додайте тренування вручну і відмітьте "Зберегти в улюблене"
              </p>
            ) : (
              favorites.map(fav => (
                <div key={fav.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'#0f172a', borderRadius:'8px', padding:'12px', marginBottom:'8px'}}>
                  <div style={{flex:1, cursor:'pointer'}} onClick={() => handleAddFromFav(fav)}>
                    <p style={{color:'#e2e8f0', fontWeight:'600'}}>{fav.name}</p>
                    <p style={{color:'#64748b', fontSize:'0.75rem'}}>
                      {fav.duration} хв · {fav.calories} ккал
                    </p>
                  </div>
                  <div style={{display:'flex', gap:'8px'}}>
                    <button onClick={() => handleAddFromFav(fav)}
                      style={{background:'#431407', border:'1px solid #ea580c', color:'#fb923c', borderRadius:'6px', padding:'4px 10px', cursor:'pointer', fontSize:'0.75rem'}}>
                      + Додати
                    </button>
                    <button onClick={() => handleDeleteFav(fav.id)}
                      style={{background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:'1rem'}}>
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Меню вибору що додати
function AddMenu({ onSelectFood, onSelectWorkout, onClose }) {
  return (
    <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000}}
      onClick={onClose}>
      <div style={{background:'#1e293b', borderRadius:'16px 16px 0 0', padding:'24px', width:'100%', maxWidth:'600px', border:'1px solid #334155', marginBottom:'0'}}
        onClick={e => e.stopPropagation()}>
        <p style={{color:'#64748b', textAlign:'center', marginBottom:'16px', fontSize:'0.875rem'}}>Що хочеш додати?</p>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px'}}>
          <button onClick={onSelectFood} style={{background:'#052e16', border:'1px solid #16a34a', borderRadius:'12px', padding:'16px', cursor:'pointer', color:'#4ade80', fontSize:'1rem', fontWeight:'600'}}>
            🍎 Їжу
          </button>
          <button onClick={onSelectWorkout} style={{background:'#431407', border:'1px solid #ea580c', borderRadius:'12px', padding:'16px', cursor:'pointer', color:'#fb923c', fontSize:'1rem', fontWeight:'600'}}>
            🏋️ Тренування
          </button>
        </div>
        <button onClick={onClose} style={{width:'100%', background:'#0f172a', border:'1px solid #334155', borderRadius:'12px', padding:'12px', cursor:'pointer', color:'#64748b', fontSize:'0.875rem'}}>
          Скасувати
        </button>
      </div>
    </div>
  );
}

// Головний компонент Dashboard
function Dashboard() {
  const { user } = useAuth();
  const today = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(today);
  const [foodLogs, setFoodLogs] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [goals, setGoals] = useState({ goal_calories: 2000, goal_protein: 150, goal_fat: 60, goal_carbs: 200 });
  const [modal, setModal] = useState(null); // null | 'menu' | 'food' | 'workout'
  const [weekFood, setWeekFood] = useState([]);
  const [statsRange, setStatsRange] = useState('7');

  const headers = { Authorization: `Bearer ${user.token}` };

const fetchData = async (date) => {
    try {
      const [foodRes, workoutRes, goalsRes, allFoodRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/food/${date}`, { headers }),
        axios.get(`http://localhost:5000/api/workout/${date}`, { headers }),
        axios.get('http://localhost:5000/api/auth/goals', { headers }),
        axios.get('http://localhost:5000/api/food', { headers }),
      ]);
      setFoodLogs(foodRes.data);
      setWorkoutLogs(workoutRes.data);
      setGoals(goalsRes.data);

      const grouped = {};
      allFoodRes.data.forEach(f => {
        grouped[f.date] = (grouped[f.date] || 0) + f.calories;
      });
      const chartData = Object.entries(grouped)
        .slice(-30)
        .map(([date, calories]) => ({ date, calories }));
      setWeekFood(chartData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]);

  const handleAddFood = async (form) => {
    try {
      await axios.post('http://localhost:5000/api/food', { ...form, date: selectedDate }, { headers });
      setModal(null);
      fetchData(selectedDate);
    } catch (err) { console.error(err); }
  };

  const handleAddWorkout = async (form) => {
    try {
      await axios.post('http://localhost:5000/api/workout', { ...form, date: selectedDate }, { headers });
      setModal(null);
      fetchData(selectedDate);
    } catch (err) { console.error(err); }
  };

  const handleDeleteFood = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/food/${id}`, { headers });
      fetchData(selectedDate);
    } catch (err) { console.error(err); }
  };

  const handleDeleteWorkout = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/workout/${id}`, { headers });
      fetchData(selectedDate);
    } catch (err) { console.error(err); }
  };

  const totalCalories = foodLogs.reduce((sum, f) => sum + f.calories, 0);
  const totalProtein = foodLogs.reduce((sum, f) => sum + (f.protein || 0), 0);
  const totalFat = foodLogs.reduce((sum, f) => sum + (f.fat || 0), 0);
  const totalCarbs = foodLogs.reduce((sum, f) => sum + (f.carbs || 0), 0);
  const totalBurned = workoutLogs.reduce((sum, w) => sum + w.calories_burned, 0);
  const caloriesLeft = goals.goal_calories - totalCalories + totalBurned;

  const isToday = selectedDate === today;

  return (
    <div className="main-content">

      {/* Заголовок */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
        <h1 style={{color:'#fff', fontSize:'1.5rem', fontWeight:'700'}}>
          {isToday ? `Привіт, ${user.username}! 👋` : `📅 ${selectedDate}`}
        </h1>
      </div>

      {/* Календар */}
      <WeekCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Головна картка калорій */}
      <div className="card" style={{textAlign:'center', marginBottom:'16px'}}>
        <p style={{color:'#64748b', fontSize:'0.875rem', marginBottom:'8px'}}>Залишилось калорій</p>
        <p style={{color: caloriesLeft >= 0 ? '#4ade80' : '#f87171', fontSize:'3rem', fontWeight:'700'}}>{caloriesLeft}</p>
        <p style={{color:'#475569', fontSize:'0.875rem'}}>з {goals.goal_calories} ккал</p>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', marginTop:'20px'}}>
          <div>
            <p style={{color:'#64748b', fontSize:'0.75rem'}}>Спожито</p>
            <p style={{color:'#4ade80', fontWeight:'700', fontSize:'1.1rem'}}>{totalCalories}</p>
          </div>
          <div>
            <p style={{color:'#64748b', fontSize:'0.75rem'}}>Спалено</p>
            <p style={{color:'#fb923c', fontWeight:'700', fontSize:'1.1rem'}}>{totalBurned}</p>
          </div>
          <div>
            <p style={{color:'#64748b', fontSize:'0.75rem'}}>Норма</p>
            <p style={{color:'#38bdf8', fontWeight:'700', fontSize:'1.1rem'}}>{goals.goal_calories}</p>
          </div>
        </div>
      </div>

      {/* КБЖВ */}
      <div className="card" style={{marginBottom:'16px'}}>
        <h2 style={{color:'#fff', fontWeight:'700', marginBottom:'16px'}}>🥗 Нутрієнти</h2>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px'}}>
          <div>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <span style={{color:'#94a3b8', fontSize:'0.8rem'}}>💪 Білки</span>
              <span style={{color:'#38bdf8', fontSize:'0.8rem'}}>{totalProtein}г/{goals.goal_protein}г</span>
            </div>
            <ProgressBar value={totalProtein} max={goals.goal_protein} color="#38bdf8" />
          </div>
          <div>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <span style={{color:'#94a3b8', fontSize:'0.8rem'}}>🥑 Жири</span>
              <span style={{color:'#f87171', fontSize:'0.8rem'}}>{totalFat}г/{goals.goal_fat}г</span>
            </div>
            <ProgressBar value={totalFat} max={goals.goal_fat} color="#f87171" />
          </div>
          <div>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <span style={{color:'#94a3b8', fontSize:'0.8rem'}}>🌾 Вуглеводи</span>
              <span style={{color:'#fbbf24', fontSize:'0.8rem'}}>{totalCarbs}г/{goals.goal_carbs}г</span>
            </div>
            <ProgressBar value={totalCarbs} max={goals.goal_carbs} color="#fbbf24" />
          </div>
        </div>
      </div>

      {/* Їжа */}
      <div className="card" style={{marginBottom:'16px'}}>
        <h2 style={{color:'#fff', fontWeight:'700', marginBottom:'16px'}}>🍎 Їжа</h2>
        {foodLogs.length === 0 ? (
          <p style={{color:'#475569', textAlign:'center', padding:'16px 0'}}>Ще нічого не додано</p>
        ) : (
          foodLogs.map(f => (
            <div key={f.id} className="log-item">
              <div>
                <p className="log-name">{f.name}</p>
                <p className="log-sub">Б:{f.protein}г · Ж:{f.fat}г · В:{f.carbs}г</p>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                <span className="log-value text-green">{f.calories} ккал</span>
                <button onClick={() => handleDeleteFood(f.id)} className="btn-delete">✕</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Тренування */}
      <div className="card" style={{marginBottom:'80px'}}>
        <h2 style={{color:'#fff', fontWeight:'700', marginBottom:'16px'}}>🏋️ Тренування</h2>
        {workoutLogs.length === 0 ? (
          <p style={{color:'#475569', textAlign:'center', padding:'16px 0'}}>Ще нічого не додано</p>
        ) : (
          workoutLogs.map(w => (
            <div key={w.id} className="log-item">
              <div>
                <p className="log-name">{w.name}</p>
                <p className="log-sub">{w.duration} хвилин</p>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                <span className="log-value text-orange">{w.calories_burned} ккал</span>
                <button onClick={() => handleDeleteWorkout(w.id)} className="btn-delete">✕</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Графік калорій */}
      {weekFood.length > 0 && (
        <div className="card" style={{marginBottom:'16px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
            <h2 style={{color:'#fff', fontWeight:'700'}}>📊 Калорії по днях</h2>
            <div style={{display:'flex', gap:'8px'}}>
              <button onClick={() => setStatsRange('7')}
                style={{padding:'4px 12px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'0.75rem', fontWeight:'600',
                  background: statsRange === '7' ? '#2563eb' : '#0f172a', color: statsRange === '7' ? '#fff' : '#64748b'}}>
                7 днів
              </button>
              <button onClick={() => setStatsRange('30')}
                style={{padding:'4px 12px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'0.75rem', fontWeight:'600',
                  background: statsRange === '30' ? '#2563eb' : '#0f172a', color: statsRange === '30' ? '#fff' : '#64748b'}}>
                30 днів
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekFood.slice(-Number(statsRange))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#64748b" tick={{fontSize:11}} />
              <YAxis stroke="#64748b" tick={{fontSize:11}} />
              <Tooltip contentStyle={{backgroundColor:'#1e293b', border:'1px solid #334155', borderRadius:'8px', color:'#e2e8f0'}} />
              <Bar dataKey="calories" fill="#4ade80" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          {(() => {
            const data = weekFood.slice(-Number(statsRange));
            const avg = Math.round(data.reduce((s, d) => s + d.calories, 0) / data.length);
            const max = Math.max(...data.map(d => d.calories));
            const min = Math.min(...data.map(d => d.calories));
            return (
              <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginTop:'16px'}}>
                <div style={{background:'#0f172a', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                  <p style={{color:'#64748b', fontSize:'0.75rem'}}>Середнє</p>
                  <p style={{color:'#4ade80', fontWeight:'700'}}>{avg} ккал</p>
                </div>
                <div style={{background:'#0f172a', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                  <p style={{color:'#64748b', fontSize:'0.75rem'}}>Максимум</p>
                  <p style={{color:'#f87171', fontWeight:'700'}}>{max} ккал</p>
                </div>
                <div style={{background:'#0f172a', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                  <p style={{color:'#64748b', fontSize:'0.75rem'}}>Мінімум</p>
                  <p style={{color:'#38bdf8', fontWeight:'700'}}>{min} ккал</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Кнопка + */}
      <button onClick={() => setModal('menu')}
        style={{
          position:'fixed', bottom:'32px', right:'32px',
          width:'60px', height:'60px', borderRadius:'50%',
          background:'linear-gradient(135deg, #2563eb, #7c3aed)',
          border:'none', color:'#fff', fontSize:'2rem',
          cursor:'pointer', boxShadow:'0 4px 20px rgba(37,99,235,0.5)',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'transform 0.2s'
        }}>
        +
      </button>

      {/* Модальні вікна */}
      {modal === 'menu' && (
        <AddMenu
          onSelectFood={() => setModal('food')}
          onSelectWorkout={() => setModal('workout')}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'food' && (
      <AddFoodModal onClose={() => setModal(null)} onAdd={handleAddFood} headers={headers} />
      )}
      {modal === 'workout' && (
      <AddWorkoutModal onClose={() => setModal(null)} onAdd={handleAddWorkout} headers={headers} />
      )}

    </div>
  );
}

export default Dashboard;