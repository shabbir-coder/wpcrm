const axios = require('axios');
const Instance = require('../models/instance.model')
const mongoose = require('mongoose');

exports.createQr = async (req, res) => {
  try {
      const url = process.env.LOGIN_CB_API
      const access_token = process.env.ACCESS_TOKEN_CB
      const createInstanceResponse = await axios.get(`${url}/create_instance`, {params:
      {access_token}
    })

    const instanceId = createInstanceResponse.data.instance_id;
    if (!instanceId) {
      throw new Error('Instance ID not found in the create instance response');
    }

    // Call the second API to get the QR Code, using the instanceId from the first call's response
    const getQrCodeResponse = await axios.get(`${url}/get_qrcode?instance_id=${instanceId}&access_token=${access_token}`);
    return res.status(200).json({
      message:'success',
      data: getQrCodeResponse.data,
      instance_id: instanceId
    })

    } catch (error) {
      console.log(error)
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

exports.saveInstance = async (req, res)=>{
    try {
      const url = process.env.LOGIN_CB_API;
      const instance_id = req.body.instance_id;
      let enable = true;
      let webhook_url = process.env.IMAGE_URL + 'api/chats/event';
      // let webhook_url = 'https://webhook.site/3981014c-0806-48f8-a6b1-c2047438a8bb'
      const access_token = process.env.ACCESS_TOKEN_CB
      const result = await axios.get(`${url}/set_webhook`, {params:{
        webhook_url, enable, instance_id, access_token
      }})
      if(result.data.status!=='error'){
        req.body['lastScannedAt'] = new Date()
        req.body['isActive'] = true
      }else{
        req.body['isActive'] = false
      }
      req.body['access_token'] = access_token;
  
      const instance = new Instance(req.body);
      await instance.save();
      return res.status(201).send(instance);
      
    } catch (error) {
      console.log(error)
      return res.status(500).json({error: 'Internal Server Error'});
    }
  };