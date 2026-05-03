import dotenv from 'dotenv'; dotenv.config();
import { app } from './app.js';
import { assertDbConnection } from './config/db.js';
const port=process.env.PORT || 5000;
assertDbConnection().then(()=>{
  app.listen(port, ()=> console.log(`API running on port ${port}`));
}).catch(err=>{ console.error('Database connection failed:', err.message); process.exit(1); });
