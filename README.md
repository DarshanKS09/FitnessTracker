To run 
* backend -> cd backend
             node server.js
* frontend -> cd frontend
              npm run dev


For starting it first time u need to have react plugin installed 
 for that paste the below code in the frontend directory(cd frontend)
 
       npm install @vitejs/plugin-react --save-dev
       
Then run the frontend (npm run dev)



For connecting to mongo db (either atlas or shell)
Add the connection string to the MongoUrI in the .env file (backend folder)
