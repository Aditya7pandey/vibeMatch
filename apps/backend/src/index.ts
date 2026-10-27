import express from 'express'
import authRoutes from './routes/auth.routes.js'
import { Request,Response,NextFunction } from 'express';
import messageRoutes from './routes/message.routes.js'

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

app.use('/auth',authRoutes);
app.use('/message',messageRoutes);

// error handler has to be registered after the routes, otherwise it never runs
app.use((err:Error,req:Request,res:Response,next:NextFunction) => {
  console.log(err.message);

  const statusCode = res.statusCode >= 400 ? res.statusCode : 500;

  return res.status(statusCode).json({
    error:err.message || "Internal Server error",
    success:false
  })
})

app.listen(PORT,()=>{
  console.log(`app is listening in ${PORT}`);
})