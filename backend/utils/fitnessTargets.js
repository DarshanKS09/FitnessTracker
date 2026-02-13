function toNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function calculateTargetsFromProfile(profile = {}) {
  const height = toNum(profile.height);
  const weight = toNum(profile.weight);
  const age = toNum(profile.age);

  if (!height || !weight || !age) {
    return null;
  }

  const gender = String(profile.gender || '').toLowerCase();
  const activityLevel = profile.activityLevel || 'Moderate';
  const goal = profile.goal || 'Maintenance';

  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'male') bmr += 5;
  if (gender === 'female') bmr -= 161;

  const activityMap = {
    Sedentary: 1.2,
    Light: 1.375,
    Moderate: 1.55,
    Active: 1.725,
  };

  const tdee = bmr * (activityMap[activityLevel] || 1.55);

  let calorieTarget = tdee;
  if (goal === 'Cutting') calorieTarget -= 500;
  if (goal === 'Bulking') calorieTarget += 300;

  const proteinPerKg = goal === 'Bulking' ? 1.8 : goal === 'Cutting' ? 1.6 : 1.5;
  const proteinTarget = weight * proteinPerKg;

  return {
    calorieTarget: Math.round(calorieTarget),
    proteinTarget: Math.round(proteinTarget),
  };
}

module.exports = { calculateTargetsFromProfile };
