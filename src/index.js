const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const port = 8080

// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const { connection } = require('./connector')


//TOTAL RECOVERED
app.get("/totalRecovered", async (req,res)=>{
    try {

        const result = await connection.aggregate([{
            $group:{
                _id:"total",
                recovered:{$sum:"$recovered"}
            }
        }])
    
        res.send(result)
    }catch(err){
        res.send(err.message)
    }

})

///TOTAL ACTIVE
app.get("/totalActive", async (req,res)=>{
    try{
       let result = await connection.aggregate([
            {
                $group: {
                    _id: "total",
                    active: {
                        $sum: { $subtract: ['$infected', '$recovered'] }
                    }
                }
            }
        ])
        res.send(result)
    }catch(err){
        res.send(err.message)
    }
    })

    ///TOTAL DEATH
app.get("/totalDeath", async (req,res)=>{
    try{
        let result = await connection.aggregate([{
         $group:{
             _id:"total",
             totaldeath:{ $sum: "$death" }
         }
        }])
        res.send(result);
    }catch(err){
        res.send(err.message)
    }
    })

    ///HOTSPOT STATE
app.get('/hotspotStates' , async(req , res)=>{
    try{
        const result = await connection.aggregate([
            {
              $addFields:{
                rate : {
                  $round : [
                      {
                        $divide : [
                            {
                            $subtract : ["$infected" , "$recovered"],
                            },"$infected"
                          ],
                      },
                      5,
                    ],
                }
              }
            },
            {
              $match : {rate : {$gt : 0.1}},
            },
            {
                $project : {
                  _id : 0,
                  state : 1,
                  rate : 1
                }
              }
              ])
          res.send(result);
      }catch(err){
          res.send(err.message)
      }
  })

    ///HEALTHY STATE
    app.get('/healthyStates' , async(req , res)=>{
        try{
            const result = await connection.aggregate([
                {
                    $addFields : {
                        mortality : {
                            $round : [
                                {
                                    $divide : [
                                        "$death" , "$infected"
                                    ]
                                } , 5
                            ]
                        }
                    }
                },{
                    $match : {
                        mortality : {$lt : 0.05}
                    }
                },{
                    $project : {
                        _id : 0,
                        state : 1,
                        mortality : 1
                    }
                }
            ])
            res.send(result);
        }catch(err){
            res.send(err.message)
        }
    })


app.listen(port, () => console.log(`App listening on port ${port}!`))

module.exports = app;