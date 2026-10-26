import express from 'express'
import authRoutes from './routes/auth.routes.js'
import { Request,Response,NextFunction } from 'express';

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

app.use((err:Error,req:Request,res:Response,next:NextFunction) => {
  console.log(err.message);

  const statusCode = res.statusCode || 500;

  return res.status(statusCode).json({
    error:err.message || "Internal Server error",
    success:false
  })
})

app.use('/auth',authRoutes);

app.listen(PORT,()=>{
  console.log(`app is listening in ${PORT}`);
})