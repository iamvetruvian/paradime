const express = require('express');
const path = require('path');
const app = express();
const port = 5000

app.use(express.static("../Frontend/public"))
// console.log(path.resolve("../Frontend/public"))

app.get("/search", (req, res)=>{
  const filePath = path.resolve('../search.html')
  const {query} = req.query
  if(!query){
    res.redirect("/")
    return
  }
  // console.log(query)
  // console.log(filePath);
  // console.log(require('fs').existsSync(filePath));
  res.status(200).sendFile(filePath)
  // res.end()
})

app.get("/", (req, res)=>{
  res.sendFile(path.resolve("../index.html"))
})

app.get("/:type/:id", (req, res)=>{
  const { type, id } = req.params;
  if(type=="movie"){
    res.status(200).sendFile(path.resolve('../Frontend/movie.html'))
  }
  else if(type=="tv"){
    res.status(200).sendFile(path.resolve('../Frontend/tv.html'))
  }
  res.end();
})

app.get("/page", (req, res)=>{
  const {type, id} = req.query
  console.log(type, id)
  if(type == "movie"){
    res.status(200).sendFile(path.resolve("../movie.html"))
  }
  if(type==="tv"){
    res.status(200).sendFile(path.resolve("../tv.html"))
  }
})

app.use((req, res)=>{
  res.status(404).send("Resource not found")
})
app.listen(port, ()=>{
  console.log(`Started listening on port ${port}...`)
})