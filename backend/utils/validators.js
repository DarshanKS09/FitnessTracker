const Joi = require('joi');

const sendOtpSchema = Joi.object({ email: Joi.string().email().optional(), phone: Joi.string().optional() }).or('email', 'phone');
const verifyOtpSchema = Joi.object({ email: Joi.string().email().required(), code: Joi.string().length(6).required() });
const registerSchema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().min(8).required(), name: Joi.string().min(2).required() });
const loginSchema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() });

const foodLogSchema = Joi.object({ foodName: Joi.string().required(), grams: Joi.number().positive().required(), bodyWeight: Joi.number().positive().required(), mealType: Joi.string().optional() });

const dietSchema = Joi.object({ age: Joi.number().positive().required(), gender: Joi.string().valid('male','female','other').required(), height: Joi.number().positive().required(), weight: Joi.number().positive().required(), activityLevel: Joi.string().valid('sedentary','moderate','active').required(), goal: Joi.string().valid('fat loss','maintenance','muscle gain').required(), preference: Joi.string().valid('veg','non-veg').required() });

const workoutSchema = Joi.object({ cardioType: Joi.string().required(), cardioMinutes: Joi.number().min(0).required(), strengthMinutes: Joi.number().min(0).required() });

module.exports = { sendOtpSchema, verifyOtpSchema, registerSchema, loginSchema, foodLogSchema, dietSchema, workoutSchema };