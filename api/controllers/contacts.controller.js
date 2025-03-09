const axios = require('axios');
const Instance = require('../models/instance.model')
const mongoose = require('mongoose');
const { Message } = require('../models/chats.model');
const { Contact } = require('../models/contact.model');

// exports.getContact = async(req, res)=>{
//     try {
//       let query = {};
//       const { page, limit, searchtext, filter} = req.query;
//       const instanceId = req.user.instance_id;

//       query = {instanceId};
      
//       if (searchtext) {
//         query.$or = [
//           { name: { $regex: new RegExp(searchtext, 'i') } },
//           { number: { $regex: new RegExp(searchtext, 'i') } }
//         ];
//       }

//       if(filter === 'pinned'){
//         query.isPinned = true
//       }
      
//       // const Contacts = await Contact.find(query)
//       //   .skip((page - 1) * limit)
//       //   .sort({updatedAt : -1})
//       //   .limit(limit);

//       const pipeline = [
//         { $match: query },
//         {
//           $lookup: {
//             from: "chats",
//             localField: "number",
//             foreignField: "number",
//             let: { contactNumber: "$number" },
//             pipeline: [
//               {
//                 $match: {
//                   $expr: { $eq: ["$instanceId", instanceId] },
//                   fromMe: false,
//                 }
//               },
//               {
//                 $count: "unreadMessages"
//               }
//             ],
//             as: "unreadMessages"
//           }
//         },
//         {
//           $addFields: {
//             unreadMessages: { $ifNull: [{ $arrayElemAt: ["$unreadMessages.unreadMessages", 0] }, 0] }
//           }
//         }
//       ];

//       if (filter === "unread") {
//         pipeline.push({ $match: { unreadMessages: { $gt: 0 } } });
//       }

//       const totalContacts = await Contact.aggregate([...pipeline, { $count: "total" }]);
//       const total = totalContacts.length > 0 ? totalContacts[0].total : 0;
      
//       pipeline.push({ $sort: { updatedAt: -1 } });
//       pipeline.push({ $skip: (page - 1) * limit });
//       pipeline.push({ $limit: parseInt(limit) });

//       const contacts = await Contact.aggregate(pipeline);

//       return res.status(200).json({data: contacts, total});

//       } catch (error) {
//         return res.status(500).send({ error: error.message });
//       }
// }

exports.getContact = async (req, res) => {
  try {
    const { page = 1, limit = 10, searchtext, filter } = req.query;
    const instanceId = req.user.instance_id;

    let matchStage = { instanceId };

    if (searchtext) {
      matchStage.$or = [
        { name: { $regex: new RegExp(searchtext, "i") } },
        { number: { $regex: new RegExp(searchtext, "i") } }
      ];
    }

    if (filter === "pinned") {
      matchStage.isPinned = true;
    }

    const pipeline = [
      { $match: matchStage }, // Filter contacts based on search and instanceId
      {
        $lookup: {
          from: "messages",
          localField: "number",
          foreignField: "number",
          let: { contactNumber: "$number" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$instanceId", instanceId] },
                fromMe: false
              }
            },
            {
              $addFields: {
                isUnread: {
                  $not: {
                    $in: ["4", "$messageStatus.status"] // Check if status 4 (read) is NOT in the array
                  }
                }
              }
            },
            {
              $match: { isUnread: true } // Keep only unread messages
            },
            {
              $count: "unreadMessages" // Count unread messages per contact
            }
          ],
          as: "unreadMessages"
        }
      },
      {
        $addFields: {
          unreadMessages: { $ifNull: [{ $arrayElemAt: ["$unreadMessages.unreadMessages", 0] }, 0] }
        }
      }
    ];

    // Apply unread filter if selected
    if (filter === "unread") {
      pipeline.push({ $match: { unreadMessages: { $gt: 0 } } });
    }

    // Pagination
    const totalContacts = await Contact.aggregate([...pipeline, { $count: "total" }]);
    const total = totalContacts.length > 0 ? totalContacts[0].total : 0;

    pipeline.push({ $sort: { updatedAt: -1 } });
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: parseInt(limit) });

    const contacts = await Contact.aggregate(pipeline);

    return res.status(200).json({ data: contacts, total });

  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

exports.saveContact = async(req, res)=>{
    try {
        const instanceId = req.user.instance_id
        
        const { number, name } = req.body;

        if (!number || !instanceId) {
            return res.status(400).send({ message: 'Number and instanceId are required' });
        }

        const ifExist = await Contact.findOne({
            instanceId, 
            $or: [
              { number: number }, 
              { name: name }
            ]
          });
        if(ifExist) return res.status(400).json({message: 'Number already in use'})

        const newContact = new Contact(req.body);
        newContact.pushName = name;
        newContact.instanceId = instanceId;
        await newContact.save();
        return res.status(201).send({ message: 'Contact created', contact: newContact });

      } catch (error) {
        // console.log(error)
        return res.status(500).send({ error: error.message });
      }
}

exports.updateContacts = async(req, res)=>{
    try {
        const { id } = req.params;
        const contact = await Contact.findByIdAndUpdate(id, req.body, { new: true });
        if (!contact) {
          return res.status(404).send({ message: 'Contact not found' });
        }
        res.status(200).send(contact);
      } catch (error) {
        // console.log(error)
        return res.status(500).send({ error: error.message });
      }
}

exports.deleteContact = async (req, res) => {
    try {
        const { id } = req.params;
        const contact = await Contact.findById(id);
        if (!contact) {
            return res.status(404).json({ message: "Contact not found" });
        }
        await Message.deleteMany({ number: contact.number, instanceId: contact.instanceId });
        await Contact.findByIdAndDelete(id);

        res.status(200).json({ message: "Contact and related messages deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.getMessages = async (req, res)=>{
    try {
        const {senderNumber, limit = 20, offset = 0 } = req.body;
        
        const instance = req.user

        const messages = await Message.find({ 
          number: ''+ senderNumber,
          instanceId: instance.instance_id     
         }).sort({ createdAt: -1 })
         .skip(offset * limit)
         .limit(limit);

         const count = await Message.countDocuments({
          number: ''+ senderNumber,
          instanceId: instance.instance_id 
         })
        res.status(200).send({messages,count});
      } catch (error) {
        // console.log(error)
        return res.status(500).send({ error: error.message });
      }
}

exports.sendMessage = async(req, res)=>{
try {
    const { number, message, type, media_url } = req.body;
    const instanceId = req.user.instance_id
    if (!number || !(message || media_url)) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const messageData = {
        number,
        instance_id: instanceId,
        message,
        type: "text"
    };

    if(media_url){
      messageData['type'] = type
      messageData['media_url']= media_url
    }

    console.log('messageData', messageData)
    const API_URL = process.env.LOGIN_CB_API
    const ACCESS_TOKEN = process.env.ACCESS_TOKEN_CB
    const response = await axios.get(`${API_URL}/send`, {
        params: { ...messageData, access_token: ACCESS_TOKEN },
    });

    console.log('response', response.data)

    if (response.data.status !== "success") {
        return res.status(500).json({ error: "Failed to send message", details: response.data });
    }
    
    const newChat = new Message({
        number,
        fromMe: true,
        instanceId,
        messageStatus: [{ status: 1, time: new Date() }],
        message,
        type: type || "text",
        timeStamp: new Date(response.data?.message?.messageTimestamp*1000
          
        ),
        mediaUrl: media_url || "",
        messageId: response.data?.message?.key?.id || "",
    });

    await newChat.save();

    // console.log(number)

    // const contact = await Contact.findOneAndUpdate(
    //     { number , instanceId},
    //     {
    //       $set: {
    //         lastMessage: message,
    //         lastMessageAt: new Date(),
    //         updatedAt: new Date()
    //       }
    //     },
    //     { new: true, upsert: true }
    //   );

    //   console.log(contact)
    return res.status(200).json({ success: true, message: "Message sent successfully"});
    } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}

exports.markMessagesAsRead = async (req, res) => {
  try {
    const { number } = req.body;
    const instanceId = req.user.instance_id; // Assuming authentication middleware sets user instance ID

    if (!number) {
      return res.status(400).json({ error: "Number is required" });
    }

    const filter = {
      number,
      instanceId,
      fromMe: false,
      "messageStatus.status": { $ne: "4" } // Find messages where status ≠ '4'
    };

    const update = {
      $push: {
        messageStatus: {
          status: "4",
          time: new Date() // Add current timestamp
        }
      }
    };

    const result = await Message.updateMany(filter, update);

    return res.status(200).json({
      message: "Messages marked as read",
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.uploadFile = (req, res) => {
  if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
  }

  res.json({
      message: 'File uploaded successfully!',
      fileName: req.file.filename,
      filePath: `/uploads/${req.file.filename}`,
      fileType: req.file.mimetype
  });
};

const sendMessageFunc = async (message, data={})=>{
console.log(message)
const instance = await Instance.findOne({
    instance_id: message.instance_id
}).sort({ updatedAt: -1 })

const contact = await Contact.findOne({number: message.number, eventId: instance?.eventId.toString()});
message.message = reformText(message?.message, {contact})

const url = process.env.LOGIN_CB_API
const access_token = process.env.ACCESS_TOKEN_CB
if(message?.media_url){
    const newMessage = {
    ...message,
    senderNumber: message?.number,
    instanceId: message?.instance_id,
    fromMe: true,
    text: message?.message,
    media_url: message?.media_url,
    eventId: instance?.eventId
    }
    const savedMessage = new Message(newMessage);
    await savedMessage.save();
}

// console.log('aaaa',newMessage)

const response = await axios.get(`${url}/send`,{params:{...message,access_token}})
return true;
}