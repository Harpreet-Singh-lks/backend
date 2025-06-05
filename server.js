const app = require('./src/app');
//const config = require('./src/config/config');
const database = require('./src/utils/database');
redisClient = require('./src/utils/redis');


async function startserver(){
    try{
        await database.connect();

       await redisClient.connect();


        const server = app.listen(3000, ()=>{
            console.log("server is running on 3000");
        })
    }catch (error){
        console.error('failed to start server', error);
        process.exit(1);
    }
}

startserver();
