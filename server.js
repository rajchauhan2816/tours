const mongoose = require('mongoose');
const dotenv = require('dotenv');

// process.on('uncaughtException', err => {
//     console.log("Unhandled Exception Shutinng Down...");
//     console.log(err.name, err.message);
//     process.exit(1);
// });

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

(async () => {
    try {
        await mongoose.connect(DB, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            useUnifiedTopology: true
        });
        console.log('Database Connection Successfull');


    } catch (error) {
        console.log(erro);
    }
})();

const port = process.env.PORT ;
const server = app.listen(port, () => {
    console.log(`App Running on ${port}...`);
});

process.on('unhandledRejection',err =>{
    console.log("Unhandled Rejection Shutinng Down...");
    console.log(err.name, err.message);
    server.close(()=>{
        process.exit(1);
    });
    
});



