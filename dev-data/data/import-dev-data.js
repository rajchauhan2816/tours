const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
// console.log(DB);

(async () => {
    try {
        const res = await mongoose.connect(DB, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            useUnifiedTopology: true
        });
        console.log('Database Connection Successfull');
        // const toursCol = res.connection.collection('tours');
        // console.log(await toursCol.find().toArray());
        // console.log(res.connection);


    } catch (error) {
        console.log(error);
    }
})();

//Read Json File
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));

//Import data in dataBase
const importData = async () => {
    try {
        await Tour.create(tours);
        console.log('Data successfully Loaded!');
    } catch (error) {
        console.log(error);
    }
    process.exit();
}

//Delete data from Database
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        console.log('Data SuccessFully Deleted');
    } catch (error) {
        console.log(error);
    }
    process.exit();
}

if(process.argv[2] === '--import'){
    importData();
} else if (process.argv[2] === '--delete'){
    deleteData();
}