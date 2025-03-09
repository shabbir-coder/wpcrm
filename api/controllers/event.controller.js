const Instance = require('../models/instance.model')
const mongoose = require('mongoose');
const { Message, File } = require('../models/chats.model');
const { Contact } = require('../models/contact.model');
const { emitToInstance } = require('../middlewares/socket');

exports.handleEvent= async(req,res)=>{
    try {
        const { instance_id, data } = req.body;
        if (!data || !data.event) return res.status(400).send({ error: 'Invalid request' });
        const io = req.io;

        switch (data.event) {
            case 'messages.upsert':
                await handleMessageUpsert(data.data, instance_id);
                break;
            case 'messages.update':
                await handleMessageUpdate(data.data, instance_id);
                break;
            default:
                console.log("Unknown event received:", data.event);
        }

        res.status(200).send({ message: 'Event processed successfully' });
    } catch (error) {
        console.error("Error processing webhook:", error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}

// Function to handle new contacts update
const handleContactUpdate = async (contacts, instanceId) => {
    if (!Array.isArray(contacts)) return;
    console.log('contact.update')
    for (const contact of contacts) {
        const { id, notify } = contact;
        const number = id.replace('@s.whatsapp.net', ''); 

        const existingContact = await Contact.findOne({ number });

        if (!existingContact) {
            await Contact.create({
                pushName: notify || 'Unknown',
                number,
                instanceId
            });
        }
        // Emit event to update contact list in frontend
        emitToInstance(instanceId, "contactUpdated", existingContact);

    }
};

// Function to handle incoming messages
const handleMessageUpsert = async (messageData, instanceId) => {
    if (!messageData.messages) return;
    
    console.log('message.upsert')
    for (const msg of messageData.messages) {
        const { key, messageTimestamp, pushName, message } = msg;
        const number = key.remoteJid.replace('@s.whatsapp.net', '');
        if(isNaN(number.length)||number.length>12) return

        const fromMe = key.fromMe;
        const messageId = key.id;
        const textMessage = message?.conversation || message?.extendedTextMessage?.text || '';

        const {imageMessage, videoMessage, audioMessage } = message
        let fileData
        if(imageMessage || videoMessage || audioMessage){
            fileData = await saveFileData(imageMessage || videoMessage || audioMessage )
        }

        const updateFields = {
            lastMessage: textMessage,
            lastMessageAt: new Date()
        };
        
        if (!fromMe) {
            updateFields.pushName = pushName || 'Unknown';
            updateFields.instanceId = instanceId;
        }

        const findCondition = fromMe
            ? { number , instanceId}
            : { number, instanceId, pushName: pushName || 'Unknown' };
        
        const contact = await Contact.findOneAndUpdate(
            findCondition,
            { $set: updateFields },
            { new: true, upsert: true }
        );
        
        const newMessage = await Message.findOneAndUpdate(
            {messageId},
            { 
                $set: {
                    number,
                    fromMe,
                    instanceId,
                    message: textMessage || '',
                    messageId,
                    timeStamp: new Date(),
                    messageStatus: [{ status: fromMe ? "2" : "3", time: new Date() }],
                    type: fileData? 'media' : 'text',
                    fileType: fileData?.filetype,
                    mimeType: fileData?.mimetype,
                    fileSize: fileData?.fileLength,
                    fileLength: fileData?.seconds,
                    fileId: fileData?._id,
                    jpegThumbnail: fileData?.jpegThumbnail
                }
            },
            { new: true, upsert: true }
        ); 

        emitToInstance(instanceId, 'message-'+number, newMessage );
        emitToInstance(instanceId, "contactUpdated", contact)
    }
};

// Function to update message statuses
const handleMessageUpdate = async (messageUpdates, instanceId) => {
    if (!Array.isArray(messageUpdates)) return;
    console.log('message.update')
    for (const update of messageUpdates) {
        const { key, update: messageUpdate } = update
        const number = key.remoteJid.replace('@s.whatsapp.net', '');
        const messageId = key.id;
        const status = messageUpdate.status;

        await Message.updateOne(
            { messageId },
            { $push: { messageStatus: { status, time: new Date() } } }
        );
        // Emit event for message status update
        emitToInstance(instanceId, 'messageStatus-'+number, { messageId, status });
    }
};

const saveFileData = async(message)=>{
    try {
        const fileData = {
            url: message.url || '',
            filetype: message.mimetype.split('/')[0],
            mimetype: message.mimetype || '',
            caption: message.caption || '',
            fileSha256: message.fileSha256 || '',
            fileLength: message.fileLength || '',
            height: message.height || '',
            width: message.width || '',
            mediaKey: message.mediaKey || '',
            fileEncSha256: message.fileEncSha256 || '',
            path: message.path || '',
            mediaKeyTimestamp: message.mediaKeyTimestamp || '',
            jpegThumbnail: message.jpegThumbnail || '',
            seconds: message.seconds || '',
            contextInfo: message.contextInfo || '',
            streamingSidecar: message.streamingSidecar || ''
        };
        
        const savedFile = await File.create(fileData);
        return savedFile;
    } catch (error) {
        console.error("Error saving file data:", error);
        return null;
    }
}