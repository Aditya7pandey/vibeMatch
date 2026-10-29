// import { WebSocketServer,WebSocket } from "ws";

// const wss = new WebSocketServer({port:8080});

// wss.on("connection",(socket,request)=>{
//   const ip = request.socket.remoteAddress;

//   socket.on("message",(rawData)=>{
//     const data = rawData.toString();

//     wss.clients.forEach((client)=>{
//       if(client.readyState === WebSocket.OPEN && client !== socket){
//         client.send(data);
//       }
//     })
//   })  

//   socket.on("error",(err)=>{
//     console.log(`Error ${err.message}`)
//   })

//   socket.on("close",(client)=>{
//     console.log("Client disconnected");
//   })
// })

// console.log('Websocket server is live on port 8080');