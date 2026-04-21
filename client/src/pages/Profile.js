import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function getActivityFactor(workoutsPerWeek) {
  if (workoutsPerWeek === 0) return 1.2;
  if (workoutsPerWeek <= 2) return 1.375;
  if (workoutsPerWeek <= 4) return 1.55;
  if (workoutsPerWeek <= 6) return 1.725;
  return 1.9;
}

function calculateCalories(weight, height, age, workoutsPerWeek, sex) {
  if (!weight || !height || !age) return null;
  // Формула Міффліна-Сан Жеора
  const BMR = sex === 'female'
    ? 10 * weight + 6.25 * height - 5 * age - 161  // для жінок
    : 10 * weight + 6.25 * height - 5 * age + 5;   // для чоловіків
  const factor = getActivityFactor(workoutsPerWeek);
  const maintenance = Math.round(BMR * factor);

  const getMacros = (calories) => ({
    protein: Math.round((calories * 0.30) / 4),
    fat: Math.round((calories * 0.25) / 9),
    carbs: Math.round((calories * 0.45) / 4),
  });

  return {
    loss: maintenance - 500,
    maintenance,
    gain: maintenance + 500,
    bmr: Math.round(BMR),
    macros: {
      loss: getMacros(maintenance - 500),
      maintenance: getMacros(maintenance),
      gain: getMacros(maintenance + 500),
    }
  };
}

function Profile() {
  const { user } = useAuth();
    const [form, setForm] = useState({
    age: '', weight: '', height: '',
    goal_calories: '', goal_protein: '', goal_fat: '', goal_carbs: '',
    workouts_per_week: '3',
    sex: 'male'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [calories, setCalories] = useState(null);

  const headers = { Authorization: `Bearer ${user.token}` };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/auth/profile', { headers });
          setForm({
          age: res.data.age || '',
          weight: res.data.weight || '',
          height: res.data.height || '',
          goal_calories: res.data.goal_calories || 2000,
          goal_protein: res.data.goal_protein || 150,
          goal_fat: res.data.goal_fat || 60,
          goal_carbs: res.data.goal_carbs || 200,
          workouts_per_week: res.data.workouts_per_week || 3,
          sex: res.data.sex || 'male',
        });
        if (res.data.age && res.data.weight && res.data.height) {
          setCalories(calculateCalories(
            res.data.weight, res.data.height, res.data.age,
            res.data.workouts_per_week || 3, res.data.sex || 'male'
          ));
        }
      } catch (err) { console.error(err); }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    if (updated.weight && updated.height && updated.age) {
        setCalories(calculateCalories(
        Number(updated.weight),
        Number(updated.height),
        Number(updated.age),
        Number(updated.workouts_per_week),
        updated.sex
      ));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put('http://localhost:5000/api/auth/profile', form, { headers });
      setMessage('✅ Профіль оновлено!');
      setTimeout(() => setMessage(''), 3000);
    } catch { setMessage('❌ Помилка збереження'); }
    finally { setLoading(false); }
  };

  return (
    <div className="main-content">
      <h1 className="page-title">👤 Профіль</h1>

      {/* Особисті дані */}
      <div className="card">
        <h2 style={{color:'#fff', fontWeight:'700', marginBottom:'20px'}}>Особисті дані</h2>
        {message && <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>{message}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px'}}>
            <div className="form-group">
              <label className="form-label">Вік</label>
              <input type="number" name="age" value={form.age} onChange={handleChange}
                className="form-input" placeholder="25" />
            </div>
            <div className="form-group">
              <label className="form-label">Вага (кг)</label>
              <input type="number" name="weight" value={form.weight} onChange={handleChange}
                className="form-input" placeholder="70" />
            </div>
            <div className="form-group">
              <label className="form-label">Зріст (см)</label>
              <input type="number" name="height" value={form.height} onChange={handleChange}
                className="form-input" placeholder="175" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">🏋️ Кількість тренувань на тиждень</label>
            <select name="workouts_per_week" value={form.workouts_per_week} onChange={handleChange}
              className="form-input">
              <option value="0">0 — Сидячий спосіб життя</option>
              <option value="1">1 — Дуже легка активність</option>
              <option value="2">2 — Легка активність</option>
              <option value="3">3 — Помірна активність</option>
              <option value="4">4 — Висока активність</option>
              <option value="5">5 — Дуже висока активність</option>
              <option value="6">6 — Інтенсивні тренування</option>
              <option value="7">7 — Щоденні тренування</option>
            </select>
          </div>
          <div className="form-group">
             <label className="form-label">👤 Стать</label>
            <select name="sex" value={form.sex} onChange={handleChange} className="form-input">
              <option value="male">Чоловік</option>
              <option value="female">Жінка</option>
            </select>
          </div>

          {/* Рекомендовані калорії */}
          {calories && (
            <div style={{background:'#0f172a', borderRadius:'12px', padding:'16px', marginBottom:'16px', border:'1px solid #334155'}}>
              <p style={{color:'#94a3b8', fontSize:'0.875rem', marginBottom:'12px', fontWeight:'600'}}>
                🔥 Рекомендовані калорії (BMR: {calories.bmr} ккал):
              </p>
              <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px'}}>
                <div style={{background:'#1e293b', borderRadius:'10px', padding:'12px', textAlign:'center', border:'1px solid #ef4444', cursor:'pointer'}}
                  onClick={() => setForm({...form, goal_calories: calories.loss, goal_protein: calories.macros.loss.protein, goal_fat: calories.macros.loss.fat, goal_carbs: calories.macros.loss.carbs})}>
                  <p style={{color:'#f87171', fontSize:'0.75rem', marginBottom:'4px'}}>🔴 Схуднення</p>
                  <p style={{color:'#fff', fontWeight:'700', fontSize:'1.1rem'}}>{calories.loss}</p>
                  <p style={{color:'#64748b', fontSize:'0.7rem'}}>ккал/день</p>
                  <p style={{color:'#64748b', fontSize:'0.7rem'}}>~-0.5 кг/тиждень</p>
                </div>
                <div style={{background:'#1e293b', borderRadius:'10px', padding:'12px', textAlign:'center', border:'1px solid #f59e0b', cursor:'pointer'}}
                  onClick={() => setForm({...form, goal_calories: calories.maintenance, goal_protein: calories.macros.maintenance.protein, goal_fat: calories.macros.maintenance.fat, goal_carbs: calories.macros.maintenance.carbs})}>
                  <p style={{color:'#fbbf24', fontSize:'0.75rem', marginBottom:'4px'}}>🟡 Утримання</p>
                  <p style={{color:'#fff', fontWeight:'700', fontSize:'1.1rem'}}>{calories.maintenance}</p>
                  <p style={{color:'#64748b', fontSize:'0.7rem'}}>ккал/день</p>
                  <p style={{color:'#64748b', fontSize:'0.7rem'}}>стабільна вага</p>
                </div>
                <div style={{background:'#1e293b', borderRadius:'10px', padding:'12px', textAlign:'center', border:'1px solid #22c55e', cursor:'pointer'}}
                  onClick={() => setForm({...form, goal_calories: calories.gain, goal_protein: calories.macros.gain.protein, goal_fat: calories.macros.gain.fat, goal_carbs: calories.macros.gain.carbs})}>
                  <p style={{color:'#4ade80', fontSize:'0.75rem', marginBottom:'4px'}}>🟢 Набір маси</p>
                  <p style={{color:'#fff', fontWeight:'700', fontSize:'1.1rem'}}>{calories.gain}</p>
                  <p style={{color:'#64748b', fontSize:'0.7rem'}}>ккал/день</p>
                  <p style={{color:'#64748b', fontSize:'0.7rem'}}>~+0.5 кг/тиждень</p>
                </div>
              </div>
              <p style={{color:'#475569', fontSize:'0.75rem', marginTop:'8px', textAlign:'center'}}>
                💡 Натисни на картку щоб встановити як денну норму
              </p>
            </div>
          )}

          {/* Денні норми */}
          <h2 style={{color:'#fff', fontWeight:'700', margin:'24px 0 16px'}}>🎯 Денні норми</h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'12px'}}>
            <div className="form-group">
              <label className="form-label">🔥 Калорії (ккал)</label>
              <input type="number" name="goal_calories" value={form.goal_calories} onChange={handleChange}
                className="form-input" placeholder="2000" />
            </div>
            <div className="form-group">
              <label className="form-label">💪 Білки (г)</label>
              <input type="number" name="goal_protein" value={form.goal_protein} onChange={handleChange}
                className="form-input" placeholder="150" />
            </div>
            <div className="form-group">
              <label className="form-label">🥑 Жири (г)</label>
              <input type="number" name="goal_fat" value={form.goal_fat} onChange={handleChange}
                className="form-input" placeholder="60" />
            </div>
            <div className="form-group">
              <label className="form-label">🌾 Вуглеводи (г)</label>
              <input type="number" name="goal_carbs" value={form.goal_carbs} onChange={handleChange}
                className="form-input" placeholder="200" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-blue">
            {loading ? 'Збереження...' : '💾 Зберегти профіль'}
          </button>
        </form>
      </div>

      {/* Інфо */}
      <div className="card">
        <h2 style={{color:'#fff', fontWeight:'700', marginBottom:'16px'}}>ℹ️ Інформація акаунту</h2>
        <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
          <div style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #334155'}}>
            <span style={{color:'#64748b'}}>Ім'я користувача</span>
            <span style={{color:'#e2e8f0', fontWeight:'600'}}>{user.username}</span>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', padding:'10px 0'}}>
            <span style={{color:'#64748b'}}>Статус акаунту</span>
            <span style={{color:'#4ade80', fontWeight:'600'}}>✅ Активний</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;