const mongoose = require('mongoose')
const Document = require('./Document')

mongoose.connect('mongodb://localhost:27017/test-app');

const defaultValue = ""

const io = require('socket.io')(3001, {
  cors: {
    origin: 'http://localhost:3000',
    method: ['GET', "POST"]
  }
})

io.on("connection", socket => {
  console.log("connected:", socket.id);
  socket.on('get-document', async (documentId) => {
    const document = await findOrCreateDocument(documentId)

    //room with this documentId
    //if a user use this id. this user will join in the room
    socket.join(documentId)
    socket.emit("load-document", document.data)
    socket.on('send-changes', (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta)
    })

    //save 
    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data })
    })
  })


  // socket.on('send-changes', (delta) => {
  //   socket.broadcast.emit("receive-changes", delta)
  // })
})


async function findOrCreateDocument(id) {
  if (id == null) return;

  const document = await Document.findById(id);
  if (document) return document;

  return await Document.create({ _id: id, data: defaultValue })
}